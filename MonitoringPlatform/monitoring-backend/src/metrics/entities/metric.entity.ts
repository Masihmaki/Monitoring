import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DiskMetricDto } from '../dto/disk-metric.dto';

@Entity('system_metrics')
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid', { nullable: true })
  userId: string | null;

  @Index()
  @Column('uuid', { nullable: true })
  organizationId: string | null;

  @Column()
  machineName: string;

  @Column('float')
  cpuUsagePercent: number;

  @Column('float')
  ramUsagePercent: number;

  @Column('float')
  ramTotalMb: number;

  @Column('float')
  ramUsedMb: number;

  @Column('jsonb')
  disks: DiskMetricDto[];

  @CreateDateColumn()
  createdAt: Date;
}
