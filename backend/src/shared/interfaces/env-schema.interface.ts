import { IRedisCacheConfig } from "../types/redis-cache.types";

export interface IEnvSchema extends IRedisCacheConfig {
  BASE_URL: string;
  NODE_ENV: string;
  PORT: string;
  FRONTEND_URL: string;
  MONGO_URI: string;
  MONGO_DNS_SERVERS?: string;
  GLOBAL_API_PREFIX: string;
  JWT_SECRET_KEY: string;
  JWT_TOKEN_EXPIRATION: string;
  RESET_TOKEN_EXPIRY_MINUTES: number;
  DEFAULT_ACCOUNT_FULL_NAME: string;
  DEFAULT_ACCOUNT_EMAIL: string;
  DEFAULT_ACCOUNT_PASSWORD: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM?: string;
  SMTP_SECURE?: boolean;
  SMS_PROVIDER?: string;
  SMS_SENDER_ID?: string;
}
