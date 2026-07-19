export type AppEnv = 'demo' | 'staging' | 'production';

export interface Environment {
  appEnv: AppEnv;
  production: boolean;
  /** Base URL of the Ensyncro API, including the /api prefix. */
  apiBaseUrl: string;
}
