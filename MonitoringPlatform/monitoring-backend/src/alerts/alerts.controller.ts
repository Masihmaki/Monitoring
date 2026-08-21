import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';
import { UpdateAlertStatusDto } from './dto/update-alert-status.dto';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return await this.alertsService.findAll(user.organizationId);
  }

  @Patch(':id')
  async updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAlertStatusDto,
  ) {
    return await this.alertsService.updateStatus(
      user.organizationId,
      id,
      dto.status,
    );
  }
}
