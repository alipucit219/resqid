import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";

export type WhatsappSendResult = {
  phoneNumber: string;
  success: boolean;
  testingOnly?: boolean;
  error?: string;
};

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  private formatToWhatsApp(phone: string): string {
    // Remove spaces, dashes, parentheses
    let cleaned = phone.replace(/[\s\-()]/g, "");

    // If starts with 0, replace leading 0 with country code 92 (Pakistan)
    if (cleaned.startsWith("0")) {
      cleaned = "92" + cleaned.slice(1);
    }

    // If doesn't start with +, ensure it has no + prefix
    cleaned = cleaned.replace(/^\+/, "");

    return cleaned;
  }

  async sendSosAlert(params: {
    senderName: string;
    message: string;
    latitude: number;
    longitude: number;
    phoneNumber: string;
  }): Promise<WhatsappSendResult> {
    const { senderName, message, latitude, longitude } = params;
    const formattedPhone = this.formatToWhatsApp(params.phoneNumber);

    const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiKey = process.env.META_API_KEY;

    if (!phoneNumberId || !apiKey) {
      this.logger.warn("WhatsApp API credentials not configured.");
      return {
        phoneNumber: formattedPhone,
        success: false,
        error: "WhatsApp API credentials not configured.",
      };
    }

    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: "sos_alert_notification_v2",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: senderName },
              { type: "text", text: message },
              { type: "text", text: locationUrl },
            ],
          },
        ],
      },
    };

    try {
      await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      this.logger.log(`WhatsApp SOS alert sent to ${formattedPhone}`);
      return { phoneNumber: formattedPhone, success: true };
    } catch (error: any) {
      const errorData = error?.response?.data?.error;
      const errorCode = errorData?.code;

      if (errorCode === 131030) {
        this.logger.warn(
          `WhatsApp recipient ${formattedPhone} not in allowed list (testing mode).`,
        );
        return {
          phoneNumber: formattedPhone,
          success: false,
          testingOnly: true,
          error:
            "Recipient phone number not in allowed list. Only approved testing numbers can receive messages in sandbox mode.",
        };
      }

      const errorMessage =
        errorData?.message || error?.message || "Unknown WhatsApp API error.";
      this.logger.error(
        `WhatsApp SOS alert failed for ${formattedPhone}: ${errorMessage}`,
      );
      return { phoneNumber: formattedPhone, success: false, error: errorMessage };
    }
  }
}
