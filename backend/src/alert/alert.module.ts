import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert, AlertRecipient } from './alert.entity';
import { Record } from '../record/record.entity';
import { HealthScore } from '../health/health-score.entity';
import { FamilyMember, FamilyPermission } from '../family/family.entity';
import { User } from '../auth/user.entity';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Alert,
      AlertRecipient,
      Record,
      HealthScore,
      FamilyMember,
      FamilyPermission,
      User,
    ]),
    AuthModule,
  ],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
