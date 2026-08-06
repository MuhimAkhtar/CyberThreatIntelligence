import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationChannel } from '@prisma/client';
import { NotificationQueryDto } from './dto/notification-query.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(userId: string, subject: string, body: string): Promise<Notification> {
    const inAppNotification = await this.prisma.notification.create({
      data: {
        userId,
        subject,
        body,
        channel: NotificationChannel.IN_APP,
      },
    });

    const nodemailer = await (import('nodemailer' as any) as Promise<any>).catch(() => null);
    if (!nodemailer) {
      this.logger.warn('nodemailer not installed, skipping email');
      return inAppNotification;
    }

    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<string>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP configuration missing, skipping email send');
      return inAppNotification;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser || !dbUser.email) {
      this.logger.warn(`User ${userId} not found or has no email, skipping email send`);
      return inAppNotification;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from: user,
        to: dbUser.email,
        subject,
        text: body,
      });

      const emailNotification = await this.prisma.notification.create({
        data: {
          userId,
          subject,
          body,
          channel: NotificationChannel.EMAIL,
        },
      });
      return emailNotification;
    } catch (error) {
      this.logger.error(`Failed to send email to ${dbUser.email}:`, error);
      return inAppNotification;
    }
  }

  async sendSlack(webhookUrl: string, subject: string, body: string, metadata?: any): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: subject,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${subject}*\n${body}`,
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        this.logger.error(`Slack webhook failed with status ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Failed to send Slack notification:', error);
    }
  }

  async sendInApp(userId: string, subject: string, body: string, metadata?: any): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId,
        subject,
        body,
        channel: NotificationChannel.IN_APP,
        metadata: metadata || {},
      },
    });
  }

  async notifyUser(userId: string, subject: string, body: string, channels: NotificationChannel[], metadata?: any): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const channel of channels) {
      if (channel === NotificationChannel.IN_APP) {
        const notif = await this.sendInApp(userId, subject, body, metadata);
        notifications.push(notif);
      } else if (channel === NotificationChannel.EMAIL) {
        const notif = await this.sendEmail(userId, subject, body);
        notifications.push(notif);
      } else if (channel === NotificationChannel.SLACK) {
        // Attempt to extract slack webhook url from metadata if provided
        if (metadata && metadata.slackWebhookUrl) {
          await this.sendSlack(metadata.slackWebhookUrl, subject, body, metadata);
        }
        const notif = await this.prisma.notification.create({
          data: {
            userId,
            subject,
            body,
            channel: NotificationChannel.SLACK,
            metadata: metadata || {},
          },
        });
        notifications.push(notif);
      }
    }

    return notifications;
  }

  async getNotifications(userId: string, query: NotificationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.unreadOnly !== undefined) {
      if (query.unreadOnly === true) {
        where.read = false;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return { updated: result.count };
  }
}
