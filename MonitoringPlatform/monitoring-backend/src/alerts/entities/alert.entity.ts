import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  machineName!: string;

  @Column()
  metricName!: string; // مثلاً CPU, RAM یا DISK

  @Column('float')
  currentValue!: number;

  @Column('float')
  thresholdValue!: number;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.WARNING,
  })
  severity!: AlertSeverity;

  @Column()
  message!: string;

  @CreateDateColumn()
  createdAt!: Date;
}