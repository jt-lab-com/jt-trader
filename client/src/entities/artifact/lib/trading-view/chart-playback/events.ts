type ListenersType = {
  [event: string]: Array<(...args: any[]) => void | Promise<void>>;
};

export enum Events {
  Play = "play",
  Pause = "pause",
  End = "end",
  SpeedChange = "speed_change",
  Tick = "tick",
  CardValueChange = "card_value_change",
  Close = "close",
}

class ChartEventEmitter {
  listeners: ListenersType = {};

  on(event: Events, handler: (...args: any[]) => void | Promise<void>): VoidFunction {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(handler);

    return () => {
      this.listeners[event] = this.listeners[event].filter((listener) => listener !== handler);
    };
  }

  emit(event: Events, ...args: unknown[]) {
    if (!this.listeners[event]) {
      return null;
    }

    for (const handler of this.listeners[event]) {
      handler(...args);
    }
  }

  removeAllListeners() {
    this.listeners = {};
  }
}

export const chartEvents = new ChartEventEmitter();
