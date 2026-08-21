import { v4 as uuidv4 } from 'uuid';

export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly occurredAt: Date;

  constructor(eventType: string) {
    this.eventId = uuidv4();
    this.eventType = eventType;
    this.occurredAt = new Date();
  }
}
