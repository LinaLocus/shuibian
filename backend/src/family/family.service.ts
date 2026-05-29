import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { Family, FamilyMember, FamilyRole, FamilyMessage } from './family.entity';
import { User, DEFAULT_PRIVACY } from '../auth/user.entity';
import { Record } from '../record/record.entity';

function genInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family)
    private readonly familyRepo: Repository<Family>,
    @InjectRepository(FamilyMember)
    private readonly memberRepo: Repository<FamilyMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Record)
    private readonly recordRepo: Repository<Record>,
    @InjectRepository(FamilyMessage)
    private readonly messageRepo: Repository<FamilyMessage>,
  ) {}

  private async generateUniqueCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = genInviteCode();
      const exists = await this.familyRepo.findOne({ where: { inviteCode: code } });
      if (!exists) return code;
    }
    throw new Error('Failed to generate unique invite code');
  }

  async create(userId: string, name: string): Promise<Family> {
    if (!name?.trim()) throw new BadRequestException('家庭名称不能为空');
    const inviteCode = await this.generateUniqueCode();
    const family = await this.familyRepo.save(
      this.familyRepo.create({ name: name.trim(), inviteCode, createdBy: userId }),
    );
    await this.memberRepo.save(
      this.memberRepo.create({
        familyId: family.id,
        userId,
        role: FamilyRole.ADMIN,
      }),
    );
    return family;
  }

  async join(userId: string, inviteCode: string): Promise<Family> {
    const code = inviteCode?.trim().toUpperCase();
    if (!code) throw new BadRequestException('邀请码不能为空');
    const family = await this.familyRepo.findOne({ where: { inviteCode: code } });
    if (!family) throw new NotFoundException('邀请码无效');
    const existing = await this.memberRepo.findOne({
      where: { familyId: family.id, userId },
    });
    if (existing) throw new ConflictException('你已经是该家庭成员');
    await this.memberRepo.save(
      this.memberRepo.create({
        familyId: family.id,
        userId,
        role: FamilyRole.MEMBER,
      }),
    );
    return family;
  }

  async listMyFamilies(userId: string) {
    const memberships = await this.memberRepo.find({ where: { userId } });
    if (memberships.length === 0) return [];
    const familyIds = memberships.map((m) => m.familyId);
    const families = await this.familyRepo.find({ where: { id: In(familyIds) } });

    const counts = await Promise.all(
      familyIds.map((fid) => this.memberRepo.count({ where: { familyId: fid } })),
    );

    return families.map((f) => {
      const m = memberships.find((x) => x.familyId === f.id)!;
      const idx = familyIds.indexOf(f.id);
      return {
        id: f.id,
        name: f.name,
        inviteCode: f.inviteCode,
        createdAt: f.createdAt,
        myRole: m.role,
        memberCount: counts[idx],
      };
    });
  }

  private async assertMember(userId: string, familyId: string): Promise<FamilyMember> {
    const m = await this.memberRepo.findOne({ where: { userId, familyId } });
    if (!m) throw new ForbiddenException('你不是该家庭成员');
    return m;
  }

  async getDetail(userId: string, familyId: string) {
    const me = await this.assertMember(userId, familyId);
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    if (!family) throw new NotFoundException('家庭不存在');

    const members = await this.memberRepo.find({
      where: { familyId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });

    return {
      id: family.id,
      name: family.name,
      inviteCode: family.inviteCode,
      createdAt: family.createdAt,
      createdBy: family.createdBy,
      myRole: me.role,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        nickname: m.user.nickname,
        email: m.user.email,
        avatar: m.user.avatar,
        role: m.role,
        joinedAt: m.joinedAt,
        isMe: m.userId === userId,
      })),
    };
  }

  async getFeed(userId: string, familyId: string, limit = 30) {
    await this.assertMember(userId, familyId);
    const members = await this.memberRepo.find({ where: { familyId } });
    const userIds = members.map((m) => m.userId);
    const records = await this.recordRepo.find({
      where: { userId: In(userIds) },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['healthScore'],
    });
    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return records.map((r) => {
      const u = userMap.get(r.userId);
      const isSelf = r.userId === userId;
      const privacy = { ...DEFAULT_PRIVACY, ...(u?.privacy || {}) };
      return {
        id: r.id,
        userId: r.userId,
        nickname: u?.nickname || '',
        avatar: u?.avatar,
        bristolType: isSelf || privacy.showDetailsToFamily ? r.bristolType : null,
        score: isSelf || privacy.showScoreToFamily ? r.healthScore?.score ?? null : null,
        notes: isSelf || privacy.showNotesToFamily ? r.notes : null,
        createdAt: r.createdAt,
      };
    });
  }

  async regenerateCode(userId: string, familyId: string): Promise<{ inviteCode: string }> {
    const me = await this.assertMember(userId, familyId);
    if (me.role !== FamilyRole.ADMIN)
      throw new ForbiddenException('仅管理员可重置邀请码');
    const inviteCode = await this.generateUniqueCode();
    await this.familyRepo.update({ id: familyId }, { inviteCode });
    return { inviteCode };
  }

  async leave(userId: string, familyId: string): Promise<void> {
    const me = await this.assertMember(userId, familyId);
    if (me.role === FamilyRole.ADMIN) {
      const adminCount = await this.memberRepo.count({
        where: { familyId, role: FamilyRole.ADMIN },
      });
      const totalCount = await this.memberRepo.count({ where: { familyId } });
      if (adminCount === 1 && totalCount > 1) {
        throw new BadRequestException('请先转让管理员或移除其他成员');
      }
      if (totalCount === 1) {
        await this.memberRepo.delete({ id: me.id });
        await this.familyRepo.delete({ id: familyId });
        return;
      }
    }
    await this.memberRepo.delete({ id: me.id });
  }

  async removeMember(
    userId: string,
    familyId: string,
    targetMemberId: string,
  ): Promise<void> {
    const me = await this.assertMember(userId, familyId);
    if (me.role !== FamilyRole.ADMIN)
      throw new ForbiddenException('仅管理员可移除成员');
    const target = await this.memberRepo.findOne({
      where: { id: targetMemberId, familyId },
    });
    if (!target) throw new NotFoundException('成员不存在');
    if (target.userId === userId)
      throw new BadRequestException('不能移除自己，请使用退出家庭');
    await this.memberRepo.delete({ id: target.id });
  }

  async sendMessage(userId: string, familyId: string, content: string) {
    await this.assertMember(userId, familyId);
    const text = content?.trim();
    if (!text) throw new BadRequestException('消息不能为空');
    if (text.length > 500) throw new BadRequestException('消息过长（500 字以内）');
    const msg = await this.messageRepo.save(
      this.messageRepo.create({ familyId, userId, content: text }),
    );
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return {
      id: msg.id,
      userId,
      nickname: user?.nickname || '',
      content: msg.content,
      createdAt: msg.createdAt,
    };
  }

  async listMessages(
    userId: string,
    familyId: string,
    opts: { since?: string; limit?: number },
  ) {
    await this.assertMember(userId, familyId);
    const where: any = { familyId };
    if (opts.since) {
      const sinceDate = new Date(opts.since);
      if (!isNaN(sinceDate.getTime())) where.createdAt = MoreThan(sinceDate);
    }
    const msgs = await this.messageRepo.find({
      where,
      order: { createdAt: opts.since ? 'ASC' : 'DESC' },
      take: opts.limit ?? 50,
      relations: ['user'],
    });
    const ordered = opts.since ? msgs : msgs.reverse();
    return ordered.map((m) => ({
      id: m.id,
      userId: m.userId,
      nickname: m.user?.nickname || '',
      content: m.content,
      createdAt: m.createdAt,
    }));
  }
}
