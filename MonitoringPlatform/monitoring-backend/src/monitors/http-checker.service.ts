import { Injectable } from '@nestjs/common';
import { UptimeStatus } from './uptime-status';

export type HttpCheckResult = {
  status: UptimeStatus;
  statusCode: number | null;
  latencyMs: number;
  errorMessage: string | null;
};

@Injectable()
export class HttpChecker {
  async check(url: string, timeoutMs = 10_000): Promise<HttpCheckResult> {
    const started = Date.now();

    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          'User-Agent': 'MonitoringPlatform/1.0 (+uptime-check)',
        },
      });

      const latencyMs = Date.now() - started;
      const isUp = response.status >= 200 && response.status < 400;

      return {
        status: isUp ? UptimeStatus.UP : UptimeStatus.DOWN,
        statusCode: response.status,
        latencyMs,
        errorMessage: isUp ? null : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        status: UptimeStatus.DOWN,
        statusCode: null,
        latencyMs: Date.now() - started,
        errorMessage: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }
}
