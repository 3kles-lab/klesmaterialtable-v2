import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { KlesTableIntl } from '../table/table-intl';

@Component({
    selector: 'kles-table-empty-state',
    standalone: true,
    imports: [MatIconModule],
    templateUrl: './empty-state.component.html',
    styleUrl: './empty-state.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KlesTableEmptyStateComponent {
    readonly intl = inject(KlesTableIntl);

    private readonly changeDetectorRef = inject(ChangeDetectorRef);

    private readonly destroyRef = inject(DestroyRef);

    constructor() {
        this.intl.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.changeDetectorRef.markForCheck();
        });
    }
}
