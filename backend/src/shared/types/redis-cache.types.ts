export interface IRedisCacheConfig {
  host: string;
  port: number;
  ttl: number;
  max?: number;
}
