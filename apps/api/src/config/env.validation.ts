import { Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator';

export enum AppEnv {
  demo = 'demo',
  staging = 'staging',
  production = 'production',
}

enum NodeEnv {
  development = 'development',
  production = 'production',
  test = 'test',
}

/**
 * Declarative contract for the environment variables the API reads.
 * Types/enums are enforced (a bad value throws at boot); secrets are
 * optional here so the auth-less skeleton can still start, and are only
 * *warned* about when running as production. Tighten to required once the
 * auth work (task #5) lands.
 */
class EnvVars {
  @IsEnum(AppEnv)
  APP_ENV: AppEnv = AppEnv.demo;

  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.development;

  @IsInt()
  @Min(1)
  API_PORT = 3000;

  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  DIRECT_URL?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_SECRET?: string;

  @IsInt()
  JWT_ACCESS_TTL = 900;

  @IsInt()
  JWT_REFRESH_TTL = 1209600;

  @IsOptional()
  @IsString()
  OTP_MODE?: string;
}

// Values that must be present in a real production deployment. Missing ones
// are warnings today (skeleton) and should become hard errors once features
// depend on them.
const PRODUCTION_REQUIRED: ReadonlyArray<keyof EnvVars> = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

/**
 * Wired into ConfigModule.forRoot({ validate }). Throws with a readable
 * message if any declared variable has the wrong type/enum, so a
 * misconfigured environment fails immediately instead of at first use.
 */
export function validateEnv(config: Record<string, unknown>): EnvVars {
  const validated = plainToInstance(EnvVars, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${details}`);
  }

  if (validated.APP_ENV === AppEnv.production) {
    const logger = new Logger('EnvValidation');
    for (const key of PRODUCTION_REQUIRED) {
      if (!validated[key]) {
        logger.warn(`${key} is not set in production environment.`);
      }
    }
  }

  return validated;
}
