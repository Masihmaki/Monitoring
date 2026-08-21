import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  createApiKey(): string {
    return `mon_${randomBytes(32).toString('hex')}`;
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const user = this.usersRepository.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      apiKey: this.createApiKey(),
    });
    return await this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  async findByApiKey(apiKey: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { apiKey } });
  }

  async updateTelegramChatId(
    userId: string,
    telegramChatId: string | null,
  ): Promise<void> {
    await this.usersRepository.update({ id: userId }, { telegramChatId });
  }
}
