import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { HealthScore } from '../health/health-score.entity';

export enum RecordMode {
  QUICK = 'quick',
  DETAILED = 'detailed',
}

export enum StoolColor {
  BROWN = 'brown',
  DARK_BROWN = 'dark_brown',
  YELLOW = 'yellow',
  GREEN = 'green',
  BLACK = 'black',
  RED = 'red',
  PALE = 'pale',
}

export enum Effort {
  EASY = 'easy',
  MODERATE = 'moderate',
  HARD = 'hard',
}

export enum Amount {
  SMALL = 'small',
  MODERATE = 'moderate',
  LARGE = 'large',
}

@Entity('records')
export class Record {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: RecordMode })
  mode: RecordMode;

  @Column({ type: 'int' })
  bristolType: number;

  @Column({ type: 'enum', enum: StoolColor })
  color: StoolColor;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'enum', enum: Effort })
  effort: Effort;

  @Column({ type: 'int' })
  comfort: number;

  @Column({ type: 'enum', enum: Amount, nullable: true })
  amount: Amount;

  @Column({ type: 'simple-array', nullable: true })
  symptoms: string[];

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => HealthScore, (hs) => hs.record)
  healthScore: HealthScore;
}
