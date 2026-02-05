import { Injectable, signal } from '@angular/core';

@Injectable()
export class LoadingService {
    private _loading = signal(false);

    get loading() {
        return this._loading.asReadonly();
    }

    start() {
        this._loading.set(true);
    }
    stop() {
        this._loading.set(false);
    }
}
