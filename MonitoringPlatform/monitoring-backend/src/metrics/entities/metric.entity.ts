import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('system_metrics')
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  // ذخیره دیسک‌ها به صورت JSON در دیتابیس
  @Column('jsonb')
  disks: any;

  @CreateDateColumn()
  createdAt: Date;
}