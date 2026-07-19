import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Minimal health/root controller for the skeleton.
 * Feature controllers will be added under their own modules later.
 */
@Controller()
export class AppController {
  constructor(private readonly config: ConfigService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'ensyncro-api',
      env: this.config.get<string>('appEnv'),
      time: new Date().toISOString(),
    };
  }
}
