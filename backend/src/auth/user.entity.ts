import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface PrivacySettings {
  showScoreToFamily: boolean;
  showDetailsToFamily: boolean;
  showNotesToFamily: boolean;
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  showScoreToFamily: true,
  showDetailsToFamily: true,
  showNotesToFamily: false,
};

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'jsonb', default: () => `'${JSON.stringify(DEFAULT_PRIVACY)}'` })
  privacy: PrivacySettings;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
