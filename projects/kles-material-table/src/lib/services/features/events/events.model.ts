import { TableEventMap } from './event-map.model';

export type TableEventType<TValue = unknown> = keyof TableEventMap<TValue>;

export type TableEvent<TValue = unknown> = {
    [K in keyof TableEventMap<TValue>]: TableEventMap<TValue>[K] extends void
        ? {
              type: K;
          }
        : {
              type: K;
              payload: TableEventMap<TValue>[K];
          };
}[keyof TableEventMap<TValue>];

export type TableEventPayload<TValue, K extends keyof TableEventMap<TValue>> = TableEventMap<TValue>[K];
