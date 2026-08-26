import { Inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { FOOTER } from '../../../token';
import { EventsService } from '../events/events.service';

@Injectable()
export class FooterService {
    constructor(
        @Inject(FOOTER) private _footer: WritableSignal<boolean>,
        private readonly eventsService: EventsService,
    ) {}

    public get footer(): Signal<boolean> {
        return this._footer.asReadonly();
    }

    public show() {
        if (this._footer()) {
            return;
        }
        this._footer.set(true);
        this.eventsService.emit('footerVisibilityChange', { visible: true });
    }

    public hide() {
        if (!this._footer()) {
            return;
        }
        this._footer.set(false);
        this.eventsService.emit('footerVisibilityChange', { visible: false });
    }
}
