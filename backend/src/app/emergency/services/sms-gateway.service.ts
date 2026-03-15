import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "src/config";
import { PanicAlertDispatchStatus } from "../schemas/panic-alert-dispatch.schema";

type SendSmsPayload = {
  to: string;
  message: string;
};

export type SendSmsResult = {
  status: PanicAlertDispatchStatus;
  providerResponse?: string;
  errorMessage?: string;
};

@Injectable()
export class SmsGatewayService {
  private readonly logger = new Logger(SmsGatewayService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendSms(payload: SendSmsPayload): Promise<SendSmsResult> {
    const provider = this.configService.getSmsProvider();

    if (!provider) {
      this.logger.warn(
        `SMS provider missing. Fallback log for ${payload.to}: ${payload.message}`,
      );
      return {
        status: PanicAlertDispatchStatus.LOGGED_FALLBACK,
        providerResponse: "provider_not_configured",
      };
    }

    if (provider === "console" || provider === "mock") {
      this.logger.log(`[${provider}] SMS to ${payload.to}: ${payload.message}`);
      return {
        status: PanicAlertDispatchStatus.SENT,
        providerResponse: provider,
      };
    }

    this.logger.warn(
      `Unsupported SMS provider "${provider}". Falling back to logging.`,
    );

    return {
      status: PanicAlertDispatchStatus.LOGGED_FALLBACK,
      providerResponse: "unsupported_provider",
    };
  }
}

