import { GroupUiState } from '@3kles/kles-material-dynamicforms';
import { Component, computed, DestroyRef, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ExpandedRowStore } from '../../services/store/expanded-row-store.service';
import { filter, map, switchMap } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { KlesColumnConfig } from '../../core/table/column.interface';
import { TreeService } from '../../services/features/tree/tree.service';
import { EventsService } from '../../services/features/events/events.service';

@Component({
    selector: 'kles-cell',
    templateUrl: './cell.component.html',
    styleUrl: './cell.component.scss',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule],
})
export class KlesCellComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly expandedRowStore = inject(ExpandedRowStore);
    private readonly treeService = inject(TreeService);
    private readonly eventsService = inject(EventsService);

    ui = input.required<GroupUiState<any>>();
    group = input.required<FormGroup<any>>();
    column = input.required<KlesColumnConfig>();
    rowIndex = input.required<number>();

    expandedRow = computed(() => {
        return (this.column().canExpand ?? false) && (this.ui().get(this.column().columnDef)?.value().expandedRow ?? false);
    });

    expandedNode = computed(() => {
        return (this.column().canExpandNode ?? false) && (this.ui().get(this.column().columnDef)?.value().expandedNode ?? false);
    });

    hasChildren = computed(() => {
        return this.treeService.hasChildren(this.group(), this.group().getRawValue()._depth);
    });

    private column$ = toObservable(this.column);

    ngOnInit(): void {
        this.listen();
    }

    stopPropagation(event: any) {
        event.stopPropagation();
    }

    expandRow() {
        const row = this.group();
        const expanded = this.expandedRowStore.isExpanded(row.getRawValue()._id);
        this.expandedRowStore.toggle(row.getRawValue()._id);

        const payload = {
            row,
            rowIndex: this.rowIndex(),
            value: row.value,
            rawValue: row.getRawValue(),
            level: row.getRawValue()._depth,
        };
        this.eventsService.emit(expanded ? 'rowCollapse' : 'rowExpand', payload);
        this.eventsService.emit('rowToggleExpand', payload);
    }

    expandNode() {
        this.treeService.toggle(this.group().getRawValue()._id, this.group(), this.group().getRawValue()._depth ?? 0);
    }

    private listen() {
        this.column$
            .pipe(
                filter((column) => column.canExpand ?? false),
                switchMap(() => {
                    return this.expandedRowStore.expandedIds$.pipe(
                        takeUntilDestroyed(this.destroyRef),
                        map((ids) => {
                            return ids.has(this.group().value._id);
                        }),
                    );
                }),
            )
            .subscribe((expandedRow) => {
                this.ui().get(this.column().columnDef)?.patchValue({ expandedRow });
            });

        this.column$
            .pipe(
                filter((column) => column.canExpandNode ?? false),
                switchMap(() => {
                    return this.treeService.expandedIds$.pipe(
                        takeUntilDestroyed(this.destroyRef),
                        map((ids) => {
                            return ids.has(this.group().getRawValue()._id);
                        }),
                    );
                }),
            )
            .subscribe((expandedNode) => {
                this.ui().get(this.column().columnDef)?.patchValue({ expandedNode });
            });
    }
}
