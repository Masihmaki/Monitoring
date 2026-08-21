import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UptimeStatus } from '../uptime-status';

@Entity('uptime_monitors')
@Index(['organizationId', 'url'], { unique: true })
export class Monitor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid', { nullable: true })
  userId!: string | null;

  @Index()
  @Column('uuid', { nullable: true })
  organizationId!: string | null;

  @Column()
  name!: string;

  @Column()
  url!: string;

  @Column({ default: 60 })
  intervalSeconds!: number;

  @Column({ default: true })
  isEnabled!: boolean;

  @Column({
    type: 'enum',
    enum: UptimeStatus,
    default: UptimeStatus.UNKNOWN,
  })
  lastStatus!: UptimeStatus;

  @Column({ type: 'int', nullable: true })
  lastStatusCode!: number | null;

  @Column({ type: 'int', nullable: true })
  lastLatencyMs!: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastCheckedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
