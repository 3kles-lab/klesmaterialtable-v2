import { Signal } from '@angular/core';

export interface EmptyStateApi {
    enabled: Signal<boolean>;
    enable(): void;
    disable(): void;
    toggle(): void;
}
