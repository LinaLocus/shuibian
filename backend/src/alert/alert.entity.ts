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

export enum AlertType {
  DANGER_SIGNAL = 'danger_signal',
  SCORE_DROP = 'score_drop',
  CHRONIC_TREND = 'chronic_trend',
}

export enum AlertSeverity {
  DANGER = 'danger',
  WARN = 'warn',
  INFO = 'info',
}

export enum AlertVisibility {
  FULL = 'full',
  SUMMARY = 'summary',
}

@Entity('alerts')
@Index(['subjectUserId', 'type', 'createdAt'])
@Index(['familyId', 'createdAt'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  familyId: string;

  @Column()
  subjectUserId: string;

  @Column({ nullable: true })
  recordId: string | null;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ type: 'enum', enum: AlertSeverity })
  severity: AlertSeverity;

  @Column()
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'jsonb' })
  payload: object;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('alert_recipients')
@Index(['recipientUserId', 'readAt'])
export class AlertRecipient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  alertId: string;

  @ManyToOne(() => Alert)
  @JoinColumn({ name: 'alertId' })
  alert: Alert;

  @Column()
  recipientUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipientUserId' })
  recipient: User;

  @Column({ type: 'enum', enum: AlertVisibility })
  visibility: AlertVisibility;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @Column({ default: false })
  emailSent: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
