import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthScore } from './health-score.entity';
import { HealthService } from './health.service';

@Module({
  imports: [TypeOrmModule.forFeature([HealthScore])],
  controllers: [],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
