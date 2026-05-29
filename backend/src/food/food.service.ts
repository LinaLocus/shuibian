import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { FoodLog } from './food.entity';
import { Record } from '../record/record.entity';
import { HealthScore } from '../health/health-score.entity';
import { UpsertFoodDto } from './dto/upsert-food.dto';

interface TagStat {
  tag: string;
  occurrences: number;
  avgScoreSameDay: number | null;
  avgScoreNextDay: number | null;
  baselineAvg: number;
  delta: number; // (tag-day avg) - baseline; negative = suspicious
}

export interface FoodInsight {
  totalDays: number;
  baselineAvg: number | null;
  suspicious: TagStat[];
  friendly: TagStat[];
  neutral: TagStat[];
}

function toDateKey(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class FoodService {
  constructor(
    @InjectRepository(FoodLog)
    private readonly foodRepo: Repository<FoodLog>,
    @InjectRepository(Record)
    private readonly recordRepo: Repository<Record>,
    @InjectRepository(HealthScore)
    private readonly scoreRepo: Repository<HealthScore>,
  ) {}

  async upsert(userId: string, date: string, dto: UpsertFoodDto) {
    const cleanedTags = Array.from(
      new Set(
        (dto.tags || [])
          .map((t) => (t || '').trim())
          .filter(Boolean)
          .slice(0, 32),
      ),
    );
    const cleanedNotes = (dto.notes || '').trim().slice(0, 500) || null;

    const existing = await this.foodRepo.findOne({
      where: { userId, date },
    });

    if (existing) {
      existing.tags = cleanedTags;
      existing.notes = cleanedNotes;
      return this.foodRepo.save(existing);
    }
    const created = this.foodRepo.create({
      userId,
      date,
      tags: cleanedTags,
      notes: cleanedNotes,
    });
    return this.foodRepo.save(created);
  }

  async getOne(userId: string, date: string) {
    return this.foodRepo.findOne({ where: { userId, date } });
  }

  async getRange(userId: string, from: string, to: string) {
    return this.foodRepo.find({
      where: { userId, date: Between(from, to) },
      order: { date: 'DESC' },
    });
  }

  async getInsights(userId: string, days = 60): Promise<FoodInsight> {
    const to = toDateKey(new Date());
    const from = addDays(to, -days + 1);

    const logs = await this.foodRepo.find({
      where: { userId, date: Between(from, to) },
    });

    // Pull records + scores in range (extend +1 day for next-day correlation)
    const records = await this.recordRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.healthScore', 'hs')
      .where('r.userId = :userId', { userId })
      .andWhere('r.createdAt >= :from', { from: new Date(from + 'T00:00:00Z') })
      .andWhere('r.createdAt < :to', {
        to: new Date(addDays(to, 2) + 'T00:00:00Z'),
      })
      .getMany();

    // Average score per day
    const dailyScores = new Map<string, number[]>();
    for (const r of records) {
      const s = r.healthScore?.score;
      if (s == null) continue;
      const key = toDateKey(r.createdAt);
      if (!dailyScores.has(key)) dailyScores.set(key, []);
      dailyScores.get(key)!.push(s);
    }
    const dayAvg = new Map<string, number>();
    for (const [key, arr] of dailyScores) {
      dayAvg.set(key, arr.reduce((a, b) => a + b, 0) / arr.length);
    }

    // Baseline: average over all days with both food log AND a same-day or next-day record
    const baselineValues: number[] = [];
    for (const log of logs) {
      const sameDay = dayAvg.get(log.date);
      const nextDay = dayAvg.get(addDays(log.date, 1));
      const merged = average([sameDay, nextDay]);
      if (merged != null) baselineValues.push(merged);
    }
    const baselineAvg = average(baselineValues);

    // Tag-level stats
    const byTag = new Map<
      string,
      { occurrences: number; sameDayScores: number[]; nextDayScores: number[] }
    >();
    for (const log of logs) {
      const sameDay = dayAvg.get(log.date);
      const nextDay = dayAvg.get(addDays(log.date, 1));
      for (const tag of log.tags) {
        if (!byTag.has(tag)) {
          byTag.set(tag, { occurrences: 0, sameDayScores: [], nextDayScores: [] });
        }
        const bucket = byTag.get(tag)!;
        bucket.occurrences += 1;
        if (sameDay != null) bucket.sameDayScores.push(sameDay);
        if (nextDay != null) bucket.nextDayScores.push(nextDay);
      }
    }

    const stats: TagStat[] = [];
    for (const [tag, b] of byTag) {
      if (b.occurrences < 3) continue;
      const same = average(b.sameDayScores);
      const next = average(b.nextDayScores);
      const merged = average(
        [...b.sameDayScores, ...b.nextDayScores].filter((x) => x != null) as number[],
      );
      if (merged == null || baselineAvg == null) continue;
      stats.push({
        tag,
        occurrences: b.occurrences,
        avgScoreSameDay: same != null ? round1(same) : null,
        avgScoreNextDay: next != null ? round1(next) : null,
        baselineAvg: round1(baselineAvg),
        delta: round1(merged - baselineAvg),
      });
    }

    const suspicious = stats
      .filter((s) => s.delta <= -8)
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 5);
    const friendly = stats
      .filter((s) => s.delta >= 5)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 5);
    const neutral = stats
      .filter((s) => s.delta > -8 && s.delta < 5)
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5);

    return {
      totalDays: logs.length,
      baselineAvg: baselineAvg != null ? round1(baselineAvg) : null,
      suspicious,
      friendly,
      neutral,
    };
  }
}

function average(arr: Array<number | null | undefined>): number | null {
  const filtered = arr.filter((x): x is number => typeof x === 'number');
  if (filtered.length === 0) return null;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
