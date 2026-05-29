import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthScore } from './health-score.entity';
import { Record, StoolColor, Effort } from '../record/record.entity';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(HealthScore)
    private readonly healthScoreRepo: Repository<HealthScore>,
  ) {}

  async calculateAndSave(record: Record): Promise<HealthScore> {
    const factors = this.calculateFactors(record);
    const score = Math.round(
      factors.bristol * 0.35 +
        factors.color * 0.2 +
        factors.comfort * 0.2 +
        factors.effort * 0.15 +
        factors.symptoms * 0.1,
    );
    const advice = this.generateAdvice(score, record);

    const healthScore = this.healthScoreRepo.create({
      recordId: record.id,
      score,
      factors,
      advice,
    });
    return this.healthScoreRepo.save(healthScore);
  }

  async findByRecordId(recordId: string): Promise<HealthScore | null> {
    return this.healthScoreRepo.findOne({ where: { recordId } });
  }

  private calculateFactors(record: Record) {
    return {
      bristol: this.scoreBristol(record.bristolType),
      color: this.scoreColor(record.color),
      comfort: this.scoreComfort(record.comfort),
      effort: this.scoreEffort(record.effort),
      symptoms: this.scoreSymptoms(record.symptoms),
    };
  }

  private scoreBristol(type: number): number {
    switch (type) {
      case 3:
      case 4:
        return 100;
      case 2:
      case 5:
        return 70;
      case 1:
      case 6:
        return 40;
      case 7:
        return 20;
      default:
        return 50;
    }
  }

  private scoreColor(color: StoolColor): number {
    switch (color) {
      case StoolColor.BROWN:
      case StoolColor.DARK_BROWN:
        return 100;
      case StoolColor.YELLOW:
      case StoolColor.GREEN:
        return 70;
      case StoolColor.BLACK:
      case StoolColor.RED:
        return 20;
      case StoolColor.PALE:
        return 50;
      default:
        return 70;
    }
  }

  private scoreComfort(comfort: number): number {
    return (comfort / 5) * 100;
  }

  private scoreEffort(effort: Effort): number {
    switch (effort) {
      case Effort.EASY:
        return 100;
      case Effort.MODERATE:
        return 70;
      case Effort.HARD:
        return 30;
      default:
        return 70;
    }
  }

  private scoreSymptoms(symptoms: string[] | null): number {
    if (!symptoms || symptoms.length === 0) return 100;
    const hasBlood = symptoms.includes('出血');
    if (hasBlood) return Math.max(0, 100 - 50 - (symptoms.length - 1) * 20);
    return Math.max(0, 100 - symptoms.length * 20);
  }

  private generateAdvice(score: number, record: Record): string {
    if (score >= 80) {
      return '状态良好，继续保持当前的饮食和作息习惯。';
    }
    if (score >= 60) {
      const tips: string[] = [];
      if (record.bristolType <= 2) tips.push('建议增加膳食纤维和饮水量');
      if (record.bristolType >= 6) tips.push('注意饮食卫生，避免生冷食物');
      if (record.effort === Effort.HARD) tips.push('适当增加运动，促进肠道蠕动');
      return tips.length > 0 ? tips.join('；') + '。' : '基本正常，注意保持规律作息。';
    }
    if (score >= 40) {
      return '需要关注肠道健康，建议调整饮食结构，增加蔬果摄入，保持规律运动和充足睡眠。';
    }
    const warnings: string[] = [];
    if (record.color === StoolColor.BLACK || record.color === StoolColor.RED) {
      warnings.push('粪便颜色异常');
    }
    if (record.symptoms?.includes('出血')) {
      warnings.push('伴有出血症状');
    }
    return `健康评分较低${warnings.length > 0 ? '（' + warnings.join('、') + '）' : ''}，建议尽快就医检查。`;
  }
}
