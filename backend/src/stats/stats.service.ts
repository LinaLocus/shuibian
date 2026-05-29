import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Record } from '../record/record.entity';
import { HealthScore } from '../health/health-score.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Record)
    private readonly recordRepo: Repository<Record>,
    @InjectRepository(HealthScore)
    private readonly healthScoreRepo: Repository<HealthScore>,
  ) {}

  async getTrends(userId: string, period: string) {
    const days = period === 'month' ? 30 : 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const records = await this.recordRepo.find({
      where: { userId, createdAt: MoreThanOrEqual(since) },
      relations: ['healthScore'],
      order: { createdAt: 'ASC' },
    });

    const scoreTrend = records.map((r) => ({
      date: r.createdAt.toISOString().slice(0, 10),
      score: r.healthScore?.score || 0,
    }));

    const bristolDist: { [key: string]: number } = {};
    records.forEach((r) => {
      const key = `Type ${r.bristolType}`;
      bristolDist[key] = (bristolDist[key] || 0) + 1;
    });

    const totalRecords = records.length;
    const avgScore =
      totalRecords > 0
        ? Math.round(
            records.reduce((sum, r) => sum + (r.healthScore?.score || 0), 0) /
              totalRecords,
          )
        : 0;

    const daysWithRecords = new Set(
      records.map((r) => r.createdAt.toISOString().slice(0, 10)),
    ).size;

    return {
      period,
      totalRecords,
      avgScore,
      daysWithRecords,
      frequency: days > 0 ? +(totalRecords / days).toFixed(1) : 0,
      scoreTrend,
      bristolDistribution: Object.entries(bristolDist).map(([name, value]) => ({
        name,
        value,
      })),
    };
  }
}
