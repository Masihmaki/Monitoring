import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Alert, AlertSeverity, AlertStatus } from './entities/alert.entity';
import { AppConfiguration } from '../config/configuration';
import { NotificationsService } from '../notifications/notifications.service';
import { MetricsGateway } from '../metrics/metrics.gateway';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => MetricsGateway))
    private readonly metricsGateway: MetricsGateway,
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
      status: AlertStatus.OPEN,
      message,
      acknowledgedAt: null,
      resolvedAt: null,
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

  async updateStatus(
    organizationId: string,
    alertId: string,
    status: AlertStatus,
  ): Promise<Alert> {
    if (status === AlertStatus.OPEN) {
      throw new BadRequestException('Cannot reopen an alert from this endpoint');
    }

    const alert = await this.alertRepository.findOne({
      where: { id: alertId, organizationId },
    });
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    if (alert.status === AlertStatus.RESOLVED) {
      throw new BadRequestException('Resolved alerts cannot be changed');
    }

    if (status === AlertStatus.ACKNOWLEDGED) {
      if (alert.status !== AlertStatus.OPEN) {
        throw new BadRequestException('Only open alerts can be acknowledged');
      }
      alert.status = AlertStatus.ACKNOWLEDGED;
      alert.acknowledgedAt = new Date();
    } else {
      alert.status = AlertStatus.RESOLVED;
      alert.resolvedAt = new Date();
      if (!alert.acknowledgedAt) {
        alert.acknowledgedAt = alert.resolvedAt;
      }
    }

    const saved = await this.alertRepository.save(alert);
    this.metricsGateway.sendAlertUpdate(saved);
    return saved;
  }
}
