import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family, FamilyMember, FamilyPermission, FamilyMessage } from './family.entity';
import { User } from '../auth/user.entity';
import { Record } from '../record/record.entity';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Family, FamilyMember, FamilyPermission, FamilyMessage, User, Record]),
  ],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [TypeOrmModule],
})
export class FamilyModule {}
