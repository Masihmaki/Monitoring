import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Alert, AlertSeverity } from './entities/alert.entity';
import { AppConfiguration } from '../config/configuration';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createAlert(
    organizationId: string,
    machineName: string,
    metricName: string,
    currentValue: number,
    thresholdValue: number,
    severity: AlertSeverity,
    message: string,
  ): Promise<Alert | null> {
    const alerts = this.configService.get<AppConfiguration['alerts']>('alerts');
    const cooldownMinutes = alerts?.cooldownMinutes ?? 5;
    const since = new Date(Date.now() - cooldownMinutes * 60 * 1000);

    const recent = await this.alertRepository.findOne({
      where: {
        organizationId,
        machineName,
        metricName,
        createdAt: MoreThan(since),
      },
      order: { createdAt: 'DESC' },
    });

    if (recent) {
      return null;
    }

    const alert = this.alertRepository.create({
      organizationId,
      userId: null,
      machineName,
      metricName,
      currentValue,
      thresholdValue,
      severity,
      message,
    });
    const saved = await this.alertRepository.save(alert);
    await this.notificationsService.notifyAlert(saved);
    return saved;
  }

  async findAll(organizationId: string): Promise<Alert[]> {
    return await this.alertRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
