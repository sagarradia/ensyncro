import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Public, unauthenticated feature/config flags the SPA needs before login.
 *
 * Only ever expose non-sensitive values here — this response is world-readable.
 */
@Controller('config')
export class PublicConfigController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  get() {
    return {
      appEnv: this.config.get<string>('appEnv'),
      /** Drives whether the login screen renders the pitch shortcuts. */
      demoLoginsEnabled: this.config.get<boolean>('demoLoginsEnabled') === true,
    };
  }
}
