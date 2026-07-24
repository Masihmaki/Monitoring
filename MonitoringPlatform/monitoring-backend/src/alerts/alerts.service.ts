import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertSeverity } from './entities/alert.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
  ) {}

  async createAlert(
    machineName: string,
    metricName: string,
    currentValue: number,
    thresholdValue: number,
    severity: AlertSeverity,
    message: string,
  ): Promise<Alert> {
    const alert = this.alertRepository.create({
      machineName,
      metricName,
      currentValue,
      thresholdValue,
      severity,
      message,
    });
    return await this.alertRepository.save(alert);
  }

  async findAll(): Promise<Alert[]> {
    return await this.alertRepository.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}