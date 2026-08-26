import { Injectable, signal } from '@angular/core';
import { EventsService } from '../events/events.service';

@Injectable()
export class LoadingService {
    private _loading = signal(false);

    constructor(private readonly eventsService: EventsService) {}

    get loading() {
        return this._loading.asReadonly();
    }

    start() {
        if (this._loading()) {
            return;
        }
        this._loading.set(true);
        this.eventsService.emit('loadingChange', { loading: true });
    }
    stop() {
        if (!this._loading()) {
            return;
        }
        this._loading.set(false);
        this.eventsService.emit('loadingChange', { loading: false });
    }
}
