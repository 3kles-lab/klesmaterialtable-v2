import { Signal } from '@angular/core';

export interface LoadingApi {
    active: Signal<boolean>;
    start(): void;
    stop(): void;
}
