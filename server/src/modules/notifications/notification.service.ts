import { notificationRepository } from './notification.repository';
import { INotification } from './notification.model';
import { PaginationOptions, PaginatedResult } from '../../types/common.types';
import { buildPaginatedResult } from '../../utils/pagination.utils';

export interface SendNotificationDto {
  recipientId: string;
  type: string;
  title: string;
  body: string;
  data?: Partial<INotification['data']>;
  priority?: INotification['priority'];
}

export class NotificationService {
  /**
   * Send a notification via the in-app channel.
   * Phase 2: Will also dispatch to EmailChannel, PushChannel, WebSocketChannel
   * based on user preferences and notification priority.
   */
  async send(dto: SendNotificationDto): Promise<INotification> {
    const notification = await notificationRepository.create({
      recipient: dto.recipientId as unknown as import('mongoose').Types.ObjectId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      priority: dto.priority ?? 'medium',
      channels: [{ channel: 'in_app', status: 'sent', sentAt: new Date() }],
      isRead: false,
    });

    // Future Phase 2: Dispatch to other channels based on preferences
    // for (const channel of this.channelRegistry) {
    //   if (channel.supportsType(dto.type)) await channel.send(payload);
    // }

    return notification;
  }

  async getMyNotifications(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<INotification>> {
    const { data, total } = await notificationRepository.findByRecipient(userId, options);
    return buildPaginatedResult(data, total, options);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.countUnread(userId);
  }

  async markRead(id: string, userId: string): Promise<void> {
    await notificationRepository.markRead(id, userId);
  }

  async markAllRead(userId: string): Promise<void> {
    await notificationRepository.markAllRead(userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    await notificationRepository.delete(id, userId);
  }
}

export const notificationService = new NotificationService();
