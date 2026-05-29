import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('families')
export class Family {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  inviteCode: string;

  @Column()
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;
}

export enum FamilyRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('family_members')
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  familyId: string;

  @ManyToOne(() => Family)
  @JoinColumn({ name: 'familyId' })
  family: Family;

  @Column({ type: 'enum', enum: FamilyRole })
  role: FamilyRole;

  @CreateDateColumn()
  joinedAt: Date;
}

export enum PermissionLevel {
  NONE = 'none',
  SUMMARY = 'summary',
  FULL = 'full',
}

@Entity('family_permissions')
export class FamilyPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  familyId: string;

  @Column()
  ownerId: string;

  @Column()
  viewerId: string;

  @Column({ type: 'enum', enum: PermissionLevel, default: PermissionLevel.NONE })
  level: PermissionLevel;

  @ManyToOne(() => Family)
  @JoinColumn({ name: 'familyId' })
  family: Family;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'viewerId' })
  viewer: User;
}

@Entity('family_messages')
export class FamilyMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  familyId: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
