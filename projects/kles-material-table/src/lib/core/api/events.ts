import { Observable } from 'rxjs';

export interface EventsApi {
    listen(): Observable<any>;
}
