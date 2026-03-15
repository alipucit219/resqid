import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { ConfigService } from "src/config";

type SendEmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMail(payload: SendEmailPayload) {
    if (!this.configService.isSmtpConfigured()) {
      this.logger.warn(
        `SMTP is not configured. Fallback email log for ${payload.to}: ${payload.subject}`,
      );
      return {
        delivered: false,
        fallback: true,
      };
    }

    const smtpConfig = this.configService.getSmtpConfig();
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
    });

    await transporter.sendMail({
      from: smtpConfig.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html || payload.text,
    });

    return {
      delivered: true,
      fallback: false,
    };
  }
}

