import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Alert, AlertRecipient, AlertType, AlertSeverity, AlertVisibility } from './alert.entity';
import { Record } from '../record/record.entity';
import { HealthScore } from '../health/health-score.entity';
import { FamilyMember, FamilyPermission, PermissionLevel } from '../family/family.entity';
import { User } from '../auth/user.entity';
import { MailService } from '../auth/mail.service';
import { evaluate, AlertRuleInput, AlertCandidate } from './rules/alert-rules';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(Alert)
    private readonly alertRepo: Repository<Alert>,
    @InjectRepository(AlertRecipient)
    private readonly recipientRepo: Repository<AlertRecipient>,
    @InjectRepository(Record)
    private readonly recordRepo: Repository<Record>,
    @InjectRepository(HealthScore)
    private readonly healthScoreRepo: Repository<HealthScore>,
    @InjectRepository(FamilyMember)
    private readonly memberRepo: Repository<FamilyMember>,
    @InjectRepository(FamilyPermission)
    private readonly permRepo: Repository<FamilyPermission>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async evaluateAndDispatch(record: Record, healthScore: HealthScore): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: record.userId } });
    if (!user) return;

    const history = await this.loadHistory(record.userId, record.id);
    const input: AlertRuleInput = {
      record: {
        id: record.id,
        bristolType: record.bristolType,
        color: record.color,
        symptoms: record.symptoms,
      },
      healthScore: { score: healthScore.score },
      history,
      subjectNickname: user.nickname,
    };

    const candidates = evaluate(input);
    if (candidates.length === 0) return;

    const memberships = await this.memberRepo.find({ where: { userId: record.userId } });
    if (memberships.length === 0) return;

    for (const candidate of candidates) {
      try {
        await this.processCandidate(candidate, record, memberships);
      } catch (err) {
        this.logger.error(`Failed to process alert candidate ${candidate.type}`, err);
      }
    }
  }

  private async processCandidate(
    candidate: AlertCandidate,
    record: Record,
    memberships: FamilyMember[],
  ): Promise<void> {
    if (candidate.type !== AlertType.DANGER_SIGNAL) {
      const cooldown = await this.alertRepo.findOne({
        where: {
          subjectUserId: record.userId,
          type: candidate.type,
          createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
        },
      });
      if (cooldown) return;
    }

    const familyIds = memberships.map((m) => m.familyId);
    const alert = await this.alertRepo.save(
      this.alertRepo.create({
        familyId: familyIds[0],
        subjectUserId: record.userId,
        recordId: record.id,
        type: candidate.type,
        severity: candidate.severity,
        title: candidate.title,
        summary: candidate.summary,
        payload: candidate.payload,
      }),
    );

    const allMembers = await this.memberRepo.find({
      where: { familyId: In(familyIds) },
    });
    const recipientUserIds = [...new Set(
      allMembers
        .map((m) => m.userId)
        .filter((uid) => uid !== record.userId),
    )];

    if (recipientUserIds.length === 0) return;

    const permissions = await this.permRepo.find({
      where: { ownerId: record.userId, familyId: In(familyIds) },
    });
    const permMap = new Map(permissions.map((p) => [p.viewerId, p.level]));

    const recipients: AlertRecipient[] = [];
    const emailTargets: { email: string; visibility: AlertVisibility }[] = [];

    for (const uid of recipientUserIds) {
      const level = permMap.get(uid) ?? PermissionLevel.FULL;
      if (level === PermissionLevel.NONE && candidate.severity !== AlertSeverity.DANGER) {
        continue;
      }
      const visibility = level === PermissionLevel.FULL
        ? AlertVisibility.FULL
        : AlertVisibility.SUMMARY;

      recipients.push(
        this.recipientRepo.create({
          alertId: alert.id,
          recipientUserId: uid,
          visibility,
          readAt: null,
          emailSent: false,
        }),
      );
    }

    if (recipients.length === 0) return;
    await this.recipientRepo.save(recipients);

    if (candidate.severity === AlertSeverity.DANGER || candidate.severity === AlertSeverity.WARN) {
      const users = await this.userRepo.find({
        where: { id: In(recipients.map((r) => r.recipientUserId)) },
      });
      for (const r of recipients) {
        const u = users.find((x) => x.id === r.recipientUserId);
        if (u) emailTargets.push({ email: u.email, visibility: r.visibility });
      }
      this.dispatchEmails(alert, emailTargets).catch((err) =>
        this.logger.error('Email dispatch failed', err),
      );
    }
  }

  private async dispatchEmails(
    alert: Alert,
    targets: { email: string; visibility: AlertVisibility }[],
  ): Promise<void> {
    for (const t of targets) {
      const summary = t.visibility === AlertVisibility.FULL
        ? alert.summary
        : `${alert.title.split(' ')[0]} 健康记录有异常，请关注`;
      await this.mailService.sendAlertEmail(t.email, alert.title, summary, alert.severity);
      await this.recipientRepo.update(
        { alertId: alert.id, recipientUserId: (await this.userRepo.findOne({ where: { email: t.email } }))?.id },
        { emailSent: true },
      );
    }
  }

  private async loadHistory(userId: string, excludeRecordId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRecords = await this.recordRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 6,
      relations: ['healthScore'],
    });
    const filtered = recentRecords.filter((r) => r.id !== excludeRecordId);

    const recentScores = filtered
      .filter((r) => r.healthScore && r.createdAt >= sevenDaysAgo)
      .map((r) => ({ score: r.healthScore.score, createdAt: r.createdAt }));

    const recentRecordData = filtered.map((r) => ({
      bristolType: r.bristolType,
      score: r.healthScore?.score ?? 70,
    }));

    return { recentScores, recentRecords: recentRecordData };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.recipientRepo.count({
      where: { recipientUserId: userId, readAt: null as any },
    });
  }

  async listAlerts(userId: string, opts: { unread?: boolean; page?: number; limit?: number }) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const where: any = { recipientUserId: userId };
    if (opts.unread) where.readAt = null as any;

    const [items, total] = await this.recipientRepo.findAndCount({
      where,
      relations: ['alert'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      alerts: items.map((r) => this.formatAlert(r)),
      total,
      page,
      limit,
    };
  }

  async markRead(userId: string, recipientId: string): Promise<boolean> {
    const r = await this.recipientRepo.findOne({
      where: { id: recipientId, recipientUserId: userId },
    });
    if (!r) return false;
    r.readAt = new Date();
    await this.recipientRepo.save(r);
    return true;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.recipientRepo.update(
      { recipientUserId: userId, readAt: null as any },
      { readAt: new Date() },
    );
    return result.affected ?? 0;
  }

  async getFamilyDangerAlerts(userId: string, familyId: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recipients = await this.recipientRepo.find({
      where: {
        recipientUserId: userId,
        readAt: null as any,
      },
      relations: ['alert'],
      order: { createdAt: 'DESC' },
      take: 5,
    });
    return recipients
      .filter((r) => r.alert.familyId === familyId && r.alert.severity === AlertSeverity.DANGER && r.alert.createdAt >= since)
      .slice(0, 2)
      .map((r) => this.formatAlert(r));
  }

  private formatAlert(r: AlertRecipient) {
    const a = r.alert;
    if (r.visibility === AlertVisibility.SUMMARY) {
      return {
        id: r.id,
        alertId: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        summary: `${a.title.split(' ')[0]} 健康记录有异常，请关注`,
        payload: null,
        readAt: r.readAt,
        createdAt: a.createdAt,
      };
    }
    return {
      id: r.id,
      alertId: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      summary: a.summary,
      payload: a.payload,
      readAt: r.readAt,
      createdAt: a.createdAt,
    };
  }
}
