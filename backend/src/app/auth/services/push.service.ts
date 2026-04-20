import { Injectable } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class PushService {
  private expo = new Expo();

  async sendPush(tokens: string[], payload: any) {
   const messages: ExpoPushMessage[] = tokens
  .filter((token) => Expo.isExpoPushToken(token))
  .map((token) => ({
  to: token,
  sound: 'default' as const,
  title: `🚨 ${payload.senderName || 'Someone'} sent you an alert`,
  body: `Message: ${payload.message || 'No message'}`,
  categoryId: 'sos_alert',
  data: {
    latitude: payload.latitude,
    longitude: payload.longitude,
    senderName: payload.senderName,
    message: payload.message,
    type: 'SOS',
  },
  priority: 'high' as const,
  channelId: 'sos-alerts-v2',
  // ✅ forces Android to expand and show full body with line breaks
  android: {
    style: {
      type: 'bigText',
      text: `Message: ${payload.message || 'No message'}`,
    },
  },
}));

    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const receipts = await this.expo.sendPushNotificationsAsync(chunk);
        console.log('Push receipts:', receipts);
      } catch (error) {
        console.error('Push error:', error);
      }
    }
  }
}