import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Alert, AlertSeverity, AlertStatus } from './entities/alert.entity';
import { AlertsService } from './alerts.service';

describe('AlertsService.updateStatus', () => {
  const alert: Alert = {
    id: 'a1',
    userId: null,
    organizationId: 'org-1',
    machineName: 'web-1',
    metricName: 'CPU',
    currentValue: 95,
    thresholdValue: 80,
    severity: AlertSeverity.CRITICAL,
    status: AlertStatus.OPEN,
    message: 'High CPU',
    acknowledgedAt: null,
    resolvedAt: null,
    createdAt: new Date(),
  };

  function buildService(current: Alert) {
    const saved: Alert[] = [];
    const alertRepository = {
      findOne: jest.fn().mockResolvedValue({ ...current }),
      save: jest.fn().mockImplementation(async (value: Alert) => {
        saved.push(value);
        return value;
      }),
    };
    const metricsGateway = {
      sendAlertUpdate: jest.fn(),
    };
    const service = new AlertsService(
      alertRepository as never,
      { get: jest.fn() } as unknown as ConfigService,
      { notifyAlert: jest.fn() } as never,
      metricsGateway as never,
    );
    return { service, alertRepository, metricsGateway, saved };
  }

  it('acknowledges an open alert', async () => {
    const { service, metricsGateway, saved } = buildService(alert);
    const result = await service.updateStatus(
      'org-1',
      'a1',
      AlertStatus.ACKNOWLEDGED,
    );
    expect(result.status).toBe(AlertStatus.ACKNOWLEDGED);
    expect(result.acknowledgedAt).toBeTruthy();
    expect(metricsGateway.sendAlertUpdate).toHaveBeenCalled();
    expect(saved).toHaveLength(1);
  });

  it('resolves an acknowledged alert', async () => {
    const { service } = buildService({
      ...alert,
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date(),
    });
    const result = await service.updateStatus(
      'org-1',
      'a1',
      AlertStatus.RESOLVED,
    );
    expect(result.status).toBe(AlertStatus.RESOLVED);
    expect(result.resolvedAt).toBeTruthy();
  });

  it('rejects reopening and missing alerts', async () => {
    const { service, alertRepository } = buildService(alert);
    await expect(
      service.updateStatus('org-1', 'a1', AlertStatus.OPEN),
    ).rejects.toBeInstanceOf(BadRequestException);

    alertRepository.findOne.mockResolvedValue(null);
    await expect(
      service.updateStatus('org-1', 'missing', AlertStatus.RESOLVED),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
