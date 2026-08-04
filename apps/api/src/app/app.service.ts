import { Injectable } from '@nestjs/common';

/**
 * Core application service providing system health status information.
 */
@Injectable()
export class AppService {
  /**
   * Returns current health check status of the API service.
   */
  getHealthStatus(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'Windrose API',
      timestamp: new Date().toISOString(),
    };
  }
}
