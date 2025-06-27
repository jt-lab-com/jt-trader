import { EventEmitterInterface } from "./interface/event-emitter.interface";

export class SyncEventEmitter implements EventEmitterInterface {
  private subscribers: Map<string, ((data: any) => void)[]>;

  constructor() {
    this.subscribers = new Map();
  }

  on = (event: string, callback: (data?: any) => void) => {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }

    const items = this.subscribers.get(event);
    items.push(callback);
  };

  emit = (event: string, data?: any): void => {
    if (!this.subscribers.has(event)) {
      return;
    }

    const items = this.subscribers.get(event);
    for (let callback of items) {
      callback(data);
    }
  };
}
