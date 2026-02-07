import webPush from 'web-push';
import { PrismaClient } from '@prisma/client';

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hola@guelaguetza.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface SubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export class PushService {
  constructor(private prisma: PrismaClient) {}

  getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  async saveSubscription(
    subscription: SubscriptionData,
    userId?: string
  ): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: userId || null,
        updatedAt: new Date(),
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: userId || null,
      },
    });
  }

  async removeSubscription(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.delete({
      where: { endpoint },
    }).catch(() => {
      // Ignore if not found
    });
  }

  async sendNotificationToUser(
    userId: string,
    payload: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    return this.sendToSubscriptions(subscriptions, payload);
  }

  async sendNotificationToAll(
    payload: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    const subscriptions = await this.prisma.pushSubscription.findMany();
    return this.sendToSubscriptions(subscriptions, payload);
  }

  private async sendToSubscriptions(
    subscriptions: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>,
    payload: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192.png',
      badge: payload.badge || '/icons/icon-72.png',
      url: payload.url || '/',
      tag: payload.tag,
    });

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payloadString
        );
        success++;
      } catch (error: unknown) {
        failed++;

        // Remove invalid subscriptions (410 Gone or 404 Not Found)
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const statusCode = (error as { statusCode: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await this.prisma.pushSubscription.delete({
              where: { id: sub.id },
            }).catch(() => {});
          }
        }
      }
    }

    return { success, failed };
  }

}
