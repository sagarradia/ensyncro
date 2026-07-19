/**
 * Central runtime configuration, sourced entirely from environment variables.
 * No secrets or connection strings are hardcoded here.
 *
 * APP_ENV selects the logical environment (demo | staging | production);
 * the host (Vercel) is responsible for injecting the matching values,
 * including DATABASE_URL via the Neon integration.
 */
export type AppEnv = 'demo' | 'staging' | 'production';

export default () => ({
  appEnv: (process.env.APP_ENV ?? 'demo') as AppEnv,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '3000', 10),
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  database: {
    // Read at connection time by Prisma via env("DATABASE_URL").
    // Surfaced here only so the app can warn if it is missing.
    url: process.env.DATABASE_URL ?? '',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '1209600', 10),
  },
  otpMode: process.env.OTP_MODE ?? 'mock',
});
