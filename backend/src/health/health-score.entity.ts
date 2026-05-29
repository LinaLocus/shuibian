import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Record } from '../record/record.entity';

@Entity('health_scores')
export class HealthScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recordId: string;

  @OneToOne(() => Record)
  @JoinColumn({ name: 'recordId' })
  record: Record;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'jsonb' })
  factors: object;

  @Column()
  advice: string;

  @CreateDateColumn()
  createdAt: Date;
}
