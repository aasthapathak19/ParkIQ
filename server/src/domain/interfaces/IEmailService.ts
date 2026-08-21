export interface IEmailService {
  /**
   * Send an email using the configured provider
   * @param to The recipient's email address
   * @param templateId The identifier for the email template (e.g., 'welcome', 'booking_confirmation')
   * @param payload The dynamic data to inject into the template
   */
  sendEmail(to: string, templateId: string, payload: Record<string, any>): Promise<void>;
}
