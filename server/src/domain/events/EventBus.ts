import { DomainEvent } from './DomainEvent';
import { logger } from '../../config/logger';

type EventHandler<T extends DomainEvent> = (event: T) => Promise<void>;

class InProcessEventBus {
  private handlers: Map<string, EventHandler<DomainEvent>[]> = new Map();

  /**
   * Subscribe a handler to an event type.
   * Future: replace body with Kafka producer registration.
   */
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler as EventHandler<DomainEvent>]);
  }

  /**
   * Publish a domain event to all registered handlers.
   * Future: replace with Kafka topic publish.
   */
  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? [];

    if (handlers.length === 0) {
      logger.debug({ eventType: event.eventType, eventId: event.eventId }, 'No handlers for event');
      return;
    }

    await Promise.allSettled(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          logger.error(
            { eventType: event.eventType, eventId: event.eventId, error },
            'Event handler failed',
          );
        }
      }),
    );
  }
}

// Singleton export — single event bus across the application
export const eventBus = new InProcessEventBus();
export type { InProcessEventBus };
