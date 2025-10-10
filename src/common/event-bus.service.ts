import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBusService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit(event: string, ...values: any[]): boolean {
    return this.eventEmitter.emit(event, ...values);
  }

  async emitAsync<T = any>(event: string, ...values: any[]): Promise<T[]> {
    const listeners = this.eventEmitter.listeners(event);

    if (!listeners.length) {
      return [];
    }

    const results = await Promise.all(listeners.map((listener) => Promise.resolve(listener(...values))));

    return results as T[];
  }
}
