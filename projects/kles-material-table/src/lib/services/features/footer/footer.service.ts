import { Inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { FOOTER } from '../../../token';

@Injectable()
export class FooterService {
    constructor(@Inject(FOOTER) private _footer: WritableSignal<boolean>) {}

    public get footer(): Signal<boolean> {
        return this._footer.asReadonly();
    }

    public show() {
        this._footer.set(true);
    }

    public hide() {
        this._footer.set(false);
    }
}
