import mongoose from 'mongoose';
import { NotificationModel, INotification } from './notification.model';
import { PaginationOptions } from '../../types/common.types';

export class NotificationRepository {
  async create(data: Partial<INotification>): Promise<INotification> {
    return new NotificationModel(data).save();
  }

  async findByRecipient(
    recipientId: string,
    options: PaginationOptions,
  ): Promise<{ data: INotification[]; total: number }> {
    const query = { recipient: new mongoose.Types.ObjectId(recipientId) };
    const skip = (options.page - 1) * options.limit;

    const [data, total] = await Promise.all([
      NotificationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(options.limit).lean(),
      NotificationModel.countDocuments(query),
    ]);
    return { data, total };
  }

  async countUnread(recipientId: string): Promise<number> {
    return NotificationModel.countDocuments({
      recipient: new mongoose.Types.ObjectId(recipientId),
      isRead: false,
    });
  }

  async markRead(id: string, recipientId: string): Promise<void> {
    await NotificationModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), recipient: new mongoose.Types.ObjectId(recipientId) },
      { $set: { isRead: true, readAt: new Date() } },
    );
  }

  async markAllRead(recipientId: string): Promise<void> {
    await NotificationModel.updateMany(
      { recipient: new mongoose.Types.ObjectId(recipientId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );
  }

  async delete(id: string, recipientId: string): Promise<void> {
    await NotificationModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      recipient: new mongoose.Types.ObjectId(recipientId),
    });
  }
}

export const notificationRepository = new NotificationRepository();
