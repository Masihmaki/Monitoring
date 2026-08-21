import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';
import { UpdateTelegramDto } from './dto/update-telegram.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('telegram')
  getTelegram(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getTelegramSettings(user.id);
  }

  @Patch('telegram')
  updateTelegram(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateTelegramDto,
  ) {
    return this.notificationsService.updateTelegramChatId(user.id, dto.chatId);
  }

  @Post('telegram/test')
  testTelegram(@CurrentUser() user: AuthUser) {
    return this.notificationsService.sendTestMessage(user.id);
  }
}
