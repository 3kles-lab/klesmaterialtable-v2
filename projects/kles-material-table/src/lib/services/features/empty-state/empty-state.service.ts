import { Inject, Injectable, signal, Type } from '@angular/core';
import { KlesTableEmptyStateComponent } from '../../../components/empty-state/empty-state.component';
import { EmptyStateConfig } from '../../../core/table/config.interface';
import { EMPTY_STATE_CONFIG } from '../../../token';

@Injectable()
export class EmptyStateService {
    private readonly _enabled = signal(true);

    readonly enabled = this._enabled.asReadonly();
    readonly component: Type<unknown>;

    constructor(
        @Inject(EMPTY_STATE_CONFIG)
        config: boolean | EmptyStateConfig | undefined,
    ) {
        if (typeof config === 'boolean') {
            this._enabled.set(config);
            this.component = KlesTableEmptyStateComponent;
            return;
        }

        this._enabled.set(config?.enabled ?? true);

        this.component = config?.component ?? KlesTableEmptyStateComponent;
    }

    enable(): void {
        this._enabled.set(true);
    }

    disable(): void {
        this._enabled.set(false);
    }

    toggle(): void {
        this._enabled.update((enabled) => !enabled);
    }
}
