import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertSeverity } from '../alerts/entities/alert.entity';
import { AlertsService } from '../alerts/alerts.service';
import { MetricsGateway } from '../metrics/metrics.gateway';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { MonitorCheck } from './entities/monitor-check.entity';
import { Monitor } from './entities/monitor.entity';
import { HttpChecker, type HttpCheckResult } from './http-checker.service';
import { assertPublicHttpUrl } from './url-policy';
import { UptimeStatus } from './uptime-status';

const MAX_MONITORS_PER_ORG = 20;
const CHECK_HISTORY_LIMIT = 50;

@Injectable()
export class MonitorsService {
  constructor(
    @InjectRepository(Monitor)
    private readonly monitorRepository: Repository<Monitor>,
    @InjectRepository(MonitorCheck)
    private readonly checkRepository: Repository<MonitorCheck>,
    private readonly httpChecker: HttpChecker,
    private readonly alertsService: AlertsService,
    private readonly metricsGateway: MetricsGateway,
  ) {}

  async create(organizationId: string, dto: CreateMonitorDto): Promise<Monitor> {
    const url = await assertPublicHttpUrl(dto.url);
    const count = await this.monitorRepository.count({
      where: { organizationId },
    });
    if (count >= MAX_MONITORS_PER_ORG) {
      throw new ConflictException(
        `You can monitor at most ${MAX_MONITORS_PER_ORG} sites`,
      );
    }

    const existing = await this.monitorRepository.findOne({
      where: { organizationId, url },
    });
    if (existing) {
      throw new ConflictException('This URL is already being monitored');
    }

    const monitor = this.monitorRepository.create({
      organizationId,
      userId: null,
      url,
      name: dto.name?.trim() || new URL(url).hostname,
      intervalSeconds: dto.intervalSeconds ?? 60,
      lastStatus: UptimeStatus.UNKNOWN,
    });
    const saved = await this.monitorRepository.save(monitor);
    await this.runCheck(saved);
    return (await this.monitorRepository.findOneBy({ id: saved.id })) ?? saved;
  }

  async findAll(organizationId: string): Promise<Monitor[]> {
    return await this.monitorRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const monitor = await this.monitorRepository.findOne({
      where: { id, organizationId },
    });
    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }
    await this.monitorRepository.remove(monitor);
  }

  async pollDueMonitors(): Promise<void> {
    const due = await this.findDueMonitors();
    for (const monitor of due) {
      await this.runCheck(monitor);
    }
  }

  private async findDueMonitors(): Promise<Monitor[]> {
    const monitors = await this.monitorRepository.find({
      where: { isEnabled: true },
      take: 40,
      order: { lastCheckedAt: 'ASC' },
    });

    const now = Date.now();
    return monitors
      .filter((monitor) => {
        if (!monitor.lastCheckedAt) {
          return true;
        }
        return (
          now - monitor.lastCheckedAt.getTime() >=
          monitor.intervalSeconds * 1000
        );
      })
      .slice(0, 15);
  }

  private async runCheck(monitor: Monitor): Promise<void> {
    const previousStatus = monitor.lastStatus;
    try {
      await assertPublicHttpUrl(monitor.url);
    } catch {
      const blocked = {
        status: UptimeStatus.DOWN,
        statusCode: null,
        latencyMs: 0,
        errorMessage: 'That host cannot be monitored',
      };
      await this.persistCheck(monitor, previousStatus, blocked);
      return;
    }

    const result = await this.httpChecker.check(monitor.url);
    await this.persistCheck(monitor, previousStatus, result);
  }

  private async persistCheck(
    monitor: Monitor,
    previousStatus: UptimeStatus,
    result: HttpCheckResult,
  ): Promise<void> {
    monitor.lastStatus = result.status;
    monitor.lastStatusCode = result.statusCode;
    monitor.lastLatencyMs = result.latencyMs;
    monitor.lastError = result.errorMessage;
    monitor.lastCheckedAt = new Date();
    await this.monitorRepository.save(monitor);

    await this.checkRepository.save(
      this.checkRepository.create({
        monitorId: monitor.id,
        status: result.status,
        statusCode: result.statusCode,
        latencyMs: result.latencyMs,
        errorMessage: result.errorMessage,
      }),
    );
    await this.trimCheckHistory(monitor.id);

    this.metricsGateway.sendMonitorUpdate(monitor);

    if (
      previousStatus !== UptimeStatus.DOWN &&
      result.status === UptimeStatus.DOWN &&
      monitor.organizationId
    ) {
      const alert = await this.alertsService.createAlert(
        monitor.organizationId,
        monitor.name,
        'UPTIME',
        result.statusCode ?? 0,
        200,
        AlertSeverity.CRITICAL,
        `Site down: ${monitor.url} (${result.errorMessage ?? 'no response'})`,
      );
      if (alert) {
        this.metricsGateway.sendNewAlert(alert);
      }
    }
  }

  private async trimCheckHistory(monitorId: string) {
    const extra = await this.checkRepository.find({
      where: { monitorId },
      order: { checkedAt: 'DESC' },
      skip: CHECK_HISTORY_LIMIT,
    });
    if (extra.length > 0) {
      await this.checkRepository.remove(extra);
    }
  }
}
