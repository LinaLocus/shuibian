import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Record } from '../record/record.entity';
import { HealthScore } from '../health/health-score.entity';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Record, HealthScore])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
