import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { CreateMetricDto } from './dto/create-metric.dto';
import { QueryMetricsDto } from './dto/query-metrics.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  async create(
    @Body() createMetricDto: CreateMetricDto,
    @CurrentUser() user: AuthUser,
  ) {
    const savedMetric = await this.metricsService.create(
      createMetricDto,
      user.organizationId,
      user.id,
    );
    return {
      status: 'success',
      data: savedMetric,
    };
  }

  @Get('hosts')
  @UseGuards(JwtAuthGuard)
  async listHosts(@CurrentUser() user: AuthUser) {
    return await this.metricsService.listHosts(user.organizationId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryMetricsDto,
  ) {
    return await this.metricsService.findAll(user.organizationId, query);
  }
}
