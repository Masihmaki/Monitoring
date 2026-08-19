import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid', { nullable: true })
  userId!: string | null;

  @Column()
  machineName!: string;

  @Column()
  metricName!: string;

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
