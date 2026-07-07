import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { TableEvent, TableEventPayload, TableEventType } from './events.model';
import { TableEventMap } from './event-map.model';

@Injectable()
export class EventsService<TValue = unknown> {
    private readonly eventsSubject = new Subject<TableEvent<TValue>>();

    public readonly events$: Observable<TableEvent<TValue>> = this.eventsSubject.asObservable();

    /**
     * Émet un event typé.
     *
     * Si l'event a un payload, TypeScript t'oblige à le fournir.
     * Si l'event est void, TypeScript t'empêche de fournir un payload.
     */
    public emit<K extends TableEventType<TValue>>(type: K, ...args: TableEventMap<TValue>[K] extends void ? [] : [payload: TableEventPayload<TValue, K>]): void {
        const payload = args[0];

        const event = payload === undefined ? ({ type } as TableEvent<TValue>) : ({ type, payload } as TableEvent<TValue>);

        this.eventsSubject.next(event);
    }

    /**
     * Émet directement un event complet.
     * Pratique si tu construis déjà l'objet ailleurs.
     */
    public emitEvent(event: TableEvent<TValue>): void {
        this.eventsSubject.next(event);
    }

    public complete(): void {
        this.eventsSubject.complete();
    }
}
