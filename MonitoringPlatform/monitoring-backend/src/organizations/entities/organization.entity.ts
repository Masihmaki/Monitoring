import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Index({ unique: true })
  @Column()
  apiKey!: string;

  @Column({ type: 'double precision', nullable: true })
  alertCpuThreshold: number | null = null;

  @Column({ type: 'double precision', nullable: true })
  alertRamThreshold: number | null = null;

  @Column({ type: 'double precision', nullable: true })
  alertDiskThreshold: number | null = null;

  @CreateDateColumn()
  createdAt!: Date;
}
