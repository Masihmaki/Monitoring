import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateAlertThresholdsDto } from './dto/update-alert-thresholds.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.organizationsService.listForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(user.id, dto);
  }

  @Get('alert-thresholds')
  getAlertThresholds(@CurrentUser() user: AuthUser) {
    return this.organizationsService.getAlertThresholds(
      user.id,
      user.organizationId,
    );
  }

  @Patch('alert-thresholds')
  updateAlertThresholds(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateAlertThresholdsDto,
  ) {
    return this.organizationsService.updateAlertThresholds(
      user.id,
      user.organizationId,
      dto,
    );
  }

  @Get(':id/members')
  listMembers(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.organizationsService.listMembers(user.id, id);
  }

  @Post(':id/members')
  invite(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.organizationsService.inviteMember(user.id, id, dto.email);
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
  ) {
    await this.organizationsService.removeMember(user.id, id, memberUserId);
    return { status: 'deleted' };
  }
}
