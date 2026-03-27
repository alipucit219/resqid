import * as dotenv from "dotenv";
import * as Joi from "joi";
import { Injectable } from "@nestjs/common";
import { DeploymentEnvironmentTypes } from "src/shared/enums/deployment-environment-types.enum";
import { IEnvSchema } from "src/shared/interfaces/env-schema.interface";
import * as AppRootPath from "app-root-path";
import * as Winston from "winston";

@Injectable()
export class ConfigService {
  private readonly envConfig: IEnvSchema;

  constructor() {
    dotenv.config({
      path: `${AppRootPath.path}/.env`,
      override: true,
    });
    this.envConfig = this.validateEnvSchema(process.env);
  }

  private getEnvSchema() {
    return Joi.object<IEnvSchema>({
      BASE_URL: Joi.string().uri().required(),
      NODE_ENV: Joi.string()
        .valid(...Object.values(DeploymentEnvironmentTypes))
        .default(DeploymentEnvironmentTypes.Development),
      PORT: Joi.number().port().required(),
      FRONTEND_URL: Joi.string().uri().required(),
      MONGO_URI: Joi.string().trim().min(1).required(),
      MONGO_DNS_SERVERS: Joi.string().trim().allow("").optional(),
      GLOBAL_API_PREFIX: Joi.string()
        .trim()
        .regex(/v([1-9]+)/)
        .required(),
      JWT_SECRET_KEY: Joi.string().trim().min(1).required(),
      JWT_TOKEN_EXPIRATION: Joi.string().trim().min(1).required(),
      RESET_TOKEN_EXPIRY_MINUTES: Joi.number().integer().min(1).default(30),
      DEFAULT_ACCOUNT_FULL_NAME: Joi.string().trim().min(1).required(),
      DEFAULT_ACCOUNT_EMAIL: Joi.string().email().required(),
      DEFAULT_ACCOUNT_PASSWORD: Joi.string().trim().min(8).required(),
      SMTP_HOST: Joi.string().trim().allow("").optional(),
      SMTP_PORT: Joi.number().port().empty("").optional(),
      SMTP_USER: Joi.string().trim().allow("").optional(),
      SMTP_PASSWORD: Joi.string().trim().allow("").optional(),
      SMTP_FROM: Joi.string().email().allow("").optional(),
      SMTP_SECURE: Joi.boolean().default(false),
      SMS_PROVIDER: Joi.string().trim().allow("").optional(),
      SMS_SENDER_ID: Joi.string().trim().allow("").optional(),
    });
  }

  private validateEnvSchema(keyValuePairs) {
    const validationResult = this.getEnvSchema().validate(keyValuePairs, {
      allowUnknown: true,
    });

    if (validationResult.error) {
      throw new Error(
        `Validation failed for .env file. ${validationResult.error.message}`,
      );
    }

    return validationResult.value;
  }

  private get<Key extends keyof IEnvSchema>(key: Key): IEnvSchema[Key] {
    return this.envConfig[key];
  }

  getBaseUrl(): string {
    return this.get("BASE_URL");
  }

  getFrontendUrl(): string {
    return this.get("FRONTEND_URL");
  }

  getMongoUri(): string {
    return this.get("MONGO_URI");
  }

  getMongoDnsServers(): string[] {
    const value = (this.get("MONGO_DNS_SERVERS") || "").toString().trim();

    if (!value) {
      return [];
    }

    return value
      .split(",")
      .map((server) => server.trim())
      .filter(Boolean);
  }

  getEnvironment(): string {
    return this.get("NODE_ENV");
  }

  getPort(): number {
    return Number(this.get("PORT"));
  }

  getJWTSecretKey(): string {
    return this.get("JWT_SECRET_KEY");
  }

  getJWTTokenExpiration(): string {
    return this.get("JWT_TOKEN_EXPIRATION");
  }

  getGlobalAPIPrefix(): string {
    return this.get("GLOBAL_API_PREFIX");
  }

  getResetTokenExpiryMinutes(): number {
    return Number(this.get("RESET_TOKEN_EXPIRY_MINUTES"));
  }

  getDefaultAccountPayload() {
    return {
      fullName: this.get("DEFAULT_ACCOUNT_FULL_NAME"),
      email: this.get("DEFAULT_ACCOUNT_EMAIL"),
      password: this.get("DEFAULT_ACCOUNT_PASSWORD"),
      isActive: true,
    };
  }

  isSmtpConfigured(): boolean {
    return Boolean(
      this.get("SMTP_HOST") &&
        this.get("SMTP_PORT") &&
        this.get("SMTP_USER") &&
        this.get("SMTP_PASSWORD") &&
        this.get("SMTP_FROM"),
    );
  }

  getSmtpConfig() {
    return {
      host: this.get("SMTP_HOST"),
      port: Number(this.get("SMTP_PORT") || 0),
      secure: Boolean(this.get("SMTP_SECURE")),
      auth: {
        user: this.get("SMTP_USER"),
        pass: this.get("SMTP_PASSWORD"),
      },
      from: this.get("SMTP_FROM"),
    };
  }

  getSmptConfig() {
    return this.getSmtpConfig();
  }

  getSmsProvider(): string {
    return (this.get("SMS_PROVIDER") || "").toString().trim().toLowerCase();
  }

  getSmsSenderId(): string {
    return (this.get("SMS_SENDER_ID") || "").toString().trim();
  }

  getWinstonOptions() {
    const options = {
      file: {
        level: "info",
        filename: `${AppRootPath.path}/logs/app.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880,
        maxFiles: 5,
        colorize: false,
      },
      error: {
        level: "error",
        filename: `${AppRootPath.path}/logs/error.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880,
        maxFiles: 5,
        colorize: false,
      },
      console: {
        level: "silly",
        handleExceptions: true,
        json: false,
        colorize: true,
      },
    };

    return {
      exitOnError: false,
      transports: [
        new Winston.transports.File(options.file),
        new Winston.transports.File(options.error),
        new Winston.transports.Console(options.console),
      ],
      exceptionHandlers: [new Winston.transports.Console(options.console)],
    };
  }
}
