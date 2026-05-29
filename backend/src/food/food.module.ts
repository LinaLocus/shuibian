import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodLog } from './food.entity';
import { Record } from '../record/record.entity';
import { HealthScore } from '../health/health-score.entity';
import { FoodService } from './food.service';
import { FoodController } from './food.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FoodLog, Record, HealthScore])],
  controllers: [FoodController],
  providers: [FoodService],
})
export class FoodModule {}
