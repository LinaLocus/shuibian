import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Record } from './record.entity';
import { RecordService } from './record.service';
import { RecordController } from './record.controller';
import { HealthModule } from '../health/health.module';
import { AlertModule } from '../alert/alert.module';

@Module({
  imports: [TypeOrmModule.forFeature([Record]), HealthModule, AlertModule],
  controllers: [RecordController],
  providers: [RecordService],
  exports: [RecordService],
})
export class RecordModule {}
