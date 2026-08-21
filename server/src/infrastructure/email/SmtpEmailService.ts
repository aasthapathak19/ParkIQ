import nodemailer from 'nodemailer';
import { IEmailService } from '../../domain/interfaces/IEmailService';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class SmtpEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.mailtrap.io',
      port: env.SMTP_PORT || 2525,
      auth: {
        user: env.SMTP_USER || 'user',
        pass: env.SMTP_PASS || 'pass',
      },
    });
  }

  async sendEmail(to: string, templateId: string, payload: Record<string, any>): Promise<void> {
    try {
      // In a real app, you would load an HTML template based on templateId and inject payload
      let subject = 'ParkIQ Notification';
      let html = `<p>Hello!</p>`;

      if (templateId === 'booking_confirmation') {
        subject = 'Booking Confirmed - ParkIQ';
        html = `
          <h2>Your Booking is Confirmed!</h2>
          <p>Booking Reference: <strong>${payload.bookingRef}</strong></p>
          <p>Location: ${payload.parkingLotName}</p>
          <p>Start Time: ${payload.startTime}</p>
        `;
      }

      await this.transporter.sendMail({
        from: '"ParkIQ AI" <noreply@parkiq.ai>',
        to,
        subject,
        html,
      });

      logger.debug({ to, templateId }, 'Email sent successfully');
    } catch (error) {
      logger.error({ error, to, templateId }, 'Failed to send email');
      throw error;
    }
  }
}

export const emailService = new SmtpEmailService();
