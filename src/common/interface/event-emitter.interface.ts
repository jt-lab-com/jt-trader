export interface EventEmitterInterface {
  on(event: string, callback: (data?: any) => Promise<void> | void): void;

  emit(event: string, data?: any): Promise<void> | void;
}
