import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UptimeStatus } from '../uptime-status';
import { Monitor } from './monitor.entity';

@Entity('uptime_checks')
export class MonitorCheck {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  monitorId!: string;

  @ManyToOne(() => Monitor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'monitorId' })
  monitor!: Monitor;

  @Column({ type: 'enum', enum: UptimeStatus })
  status!: UptimeStatus;

  @Column({ type: 'int', nullable: true })
  statusCode!: number | null;

  @Column({ type: 'int', nullable: true })
  latencyMs!: number | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn()
  checkedAt!: Date;
}
