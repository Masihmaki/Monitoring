import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { MonitorsService } from './monitors.service';

@Injectable()
export class MonitorsScheduler {
  private readonly logger = new Logger(MonitorsScheduler.name);
  private running = false;

  constructor(private readonly monitorsService: MonitorsService) {}

  @Interval(15_000)
  async tick() {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      await this.monitorsService.pollDueMonitors();
    } catch (error) {
      this.logger.error('Uptime poll failed', error);
    } finally {
      this.running = false;
    }
  }
}
