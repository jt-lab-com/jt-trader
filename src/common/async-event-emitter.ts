import { EventEmitterInterface } from "./interface/event-emitter.interface";

export class AsyncEventEmitter implements EventEmitterInterface {
  private subscribers: Map<string, ((data: any) => Promise<void> | void)[]>;

  constructor() {
    this.subscribers = new Map();
  }

  on = (event: string, callback: (data?: any) => Promise<void> | void) => {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }

    const items = this.subscribers.get(event);
    items.push(callback);
  };

  emit = async (event: string, data?: any): Promise<void> => {
    if (!this.subscribers.has(event)) {
      return;
    }

    const items = this.subscribers.get(event);
    for (let callback of items) {
      await callback(data);
    }
  };
}
