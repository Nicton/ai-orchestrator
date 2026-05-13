import { EventEmitter } from 'node:events';
import type { OrchestratorEvent } from './events.js';

export type EventBus = {
  emit(event: OrchestratorEvent): void;
  on(type: OrchestratorEvent['type'] | '*', handler: (event: OrchestratorEvent) => void): () => void;
};

export function createInMemoryBus(): EventBus {
  const ee = new EventEmitter();

  return {
    emit(event) {
      ee.emit(event.type, event);
      ee.emit('*', event);
    },
    on(type, handler) {
      ee.on(type, handler);
      return () => ee.off(type, handler);
    },
  };
}
