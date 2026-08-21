import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification {
  _id: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  type: string;
  title: string;
  body: string;
  data: {
    resourceType?: string;
    resourceId?: mongoose.Types.ObjectId;
    actionUrl?: string;
    imageUrl?: string;
  };
  channels: Array<{
    channel: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    sentAt?: Date;
    error?: string;
  }>;
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: {
      resourceType: String,
      resourceId: Schema.Types.ObjectId,
      actionUrl: String,
      imageUrl: String,
      _id: false,
    },
    channels: [{
      channel: String,
      status: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'], default: 'pending' },
      sentAt: Date,
      error: String,
      _id: false,
    }],
    isRead: { type: Boolean, default: false },
    readAt: Date,
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    scheduledFor: Date,
  },
  { timestamps: true },
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1 });
NotificationSchema.index({ scheduledFor: 1 }, { sparse: true });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL: 90 days

export const NotificationModel = mongoose.model<INotification>(
  'Notification',
  NotificationSchema,
);
