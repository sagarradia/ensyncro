/**
 * Central runtime configuration, sourced entirely from environment variables.
 * No secrets or connection strings are hardcoded here.
 *
 * APP_ENV selects the logical environment (demo | staging | production);
 * the host (Vercel) is responsible for injecting the matching values,
 * including DATABASE_URL via the Neon integration.
 */
export type AppEnv = 'demo' | 'staging' | 'production';

/**
 * AWS_REGION has to be a bare region code, because the SDK uses it as a
 * hostname component. The AWS console displays regions as
 * "Asia Pacific (Sydney) ap-southeast-2", which is easy to paste in whole, so
 * take the code out of the label instead of failing on every single upload.
 */
const REGION_CODE = /\b[a-z]{2}(?:-gov|-iso[a-z]?)?-[a-z]+-\d\b/;
const normaliseRegion = (raw: string): string => REGION_CODE.exec(raw.trim())?.[0] ?? '';

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
  s3: {
    bucket: process.env.AWS_S3_BUCKET ?? '',
    region: normaliseRegion(process.env.AWS_REGION ?? ''),
    /** Kept so a mis-set region can be reported precisely at boot. */
    rawRegion: process.env.AWS_REGION ?? '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
  /**
   * One-click demo logins (task #18). Enabled by default so the pitch
   * shortcuts work; set DEMO_LOGINS_ENABLED=false to switch them off without
   * a redeploy.
   */
  demoLoginsEnabled: (process.env.DEMO_LOGINS_ENABLED ?? 'true').toLowerCase() !== 'false',
});
