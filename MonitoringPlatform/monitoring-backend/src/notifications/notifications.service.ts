import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  forwardRef,
} from '@nestjs/common';
import { Alert } from '../alerts/entities/alert.entity';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import { TelegramService } from './telegram.service';

export type TelegramSettings = {
  botConfigured: boolean;
  chatId: string | null;
};

const TEST_COOLDOWN_MS = 30_000;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly lastTestAt = new Map<string, number>();

  constructor(
    private readonly usersService: UsersService,
    private readonly telegramService: TelegramService,
    @Inject(forwardRef(() => OrganizationsService))
    private readonly organizationsService: OrganizationsService,
  ) {}

  async getTelegramSettings(userId: string): Promise<TelegramSettings> {
    const user = await this.usersService.findById(userId);
    return {
      botConfigured: this.telegramService.isConfigured(),
      chatId: user?.telegramChatId ?? null,
    };
  }

  async updateTelegramChatId(
    userId: string,
    chatId: string | null,
  ): Promise<TelegramSettings> {
    await this.usersService.updateTelegramChatId(userId, chatId);
    return await this.getTelegramSettings(userId);
  }

  async sendTestMessage(userId: string): Promise<{ status: string }> {
    if (!this.telegramService.isConfigured()) {
      throw new ServiceUnavailableException('Telegram bot is not configured');
    }

    const last = this.lastTestAt.get(userId) ?? 0;
    if (Date.now() - last < TEST_COOLDOWN_MS) {
      throw new BadRequestException('Wait a few seconds before sending another test');
    }

    const settings = await this.getTelegramSettings(userId);
    if (!settings.chatId) {
      throw new BadRequestException('Save a Telegram chat ID first');
    }

    await this.telegramService.sendMessage(
      settings.chatId,
      'پیام آزمایشی از سامانه پایش سرور — اتصال تلگرام برقرار است.',
    );
    this.lastTestAt.set(userId, Date.now());
    return { status: 'sent' };
  }

  async notifyAlert(alert: Alert): Promise<void> {
    if (!alert.organizationId || !this.telegramService.isConfigured()) {
      return;
    }

    try {
      const memberIds = await this.organizationsService.listMemberUserIds(
        alert.organizationId,
      );
      const text = this.formatAlert(alert);

      for (const userId of memberIds) {
        const user = await this.usersService.findById(userId);
        if (!user?.telegramChatId) {
          continue;
        }
        try {
          await this.telegramService.sendMessage(user.telegramChatId, text);
        } catch (error) {
          this.logger.warn(
            `Telegram alert delivery failed for user ${userId}: ${
              error instanceof Error ? error.message : 'unknown error'
            }`,
          );
        }
      }
    } catch (error) {
      this.logger.warn(
        `Telegram alert fan-out failed for org ${alert.organizationId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private formatAlert(alert: Alert): string {
    return [
      `هشدار پایش (${alert.severity})`,
      `${alert.machineName} · ${alert.metricName}`,
      `مقدار: ${alert.currentValue} (آستانه ${alert.thresholdValue})`,
      alert.message,
    ].join('\n');
  }
}
