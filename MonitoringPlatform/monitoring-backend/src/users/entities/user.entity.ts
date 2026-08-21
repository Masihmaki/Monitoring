import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ unique: true })
  apiKey!: string;

  @Column({ type: 'varchar', nullable: true })
  telegramChatId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
