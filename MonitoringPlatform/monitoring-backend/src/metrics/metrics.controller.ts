import { Controller, Get, Post, Body } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { CreateMetricDto } from './dto/create-metric.dto';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Post()
  async create(@Body() createMetricDto: CreateMetricDto) {
    const savedMetric = await this.metricsService.create(createMetricDto);
    return {
      status: 'success',
      data: savedMetric,
    };
  }

  @Get()
  async findAll() {
    return await this.metricsService.findAll();
  }
}