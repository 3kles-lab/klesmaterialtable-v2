import { Observable } from 'rxjs';
import { TableEvent } from '../../services/features/events/events.model';

export interface EventsApi<TValue = unknown> {
    listen(): Observable<TableEvent<TValue>>;
}
