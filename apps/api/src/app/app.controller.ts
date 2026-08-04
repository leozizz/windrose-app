import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Root application controller serving system health check endpoints.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check endpoint used by cloud load balancers and container probes.
   */
  @Get()
  getHealth() {
    return this.appService.getHealthStatus();
  }
}
