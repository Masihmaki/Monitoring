import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from '../config/configuration';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.botToken());
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    const token = this.botToken();
    if (!token) {
      throw new ServiceUnavailableException('Telegram bot is not configured');
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
      },
    );

    if (!response.ok) {
      this.logger.warn(`Telegram send failed with HTTP ${response.status}`);
      throw new BadRequestException(
        'Could not send Telegram message. Start a chat with the bot, then check the chat ID.',
      );
    }
  }

  private botToken(): string | null {
    return (
      this.configService.get<AppConfiguration['telegram']>('telegram')
        ?.botToken ?? null
    );
  }
}
