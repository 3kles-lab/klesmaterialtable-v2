import { Inject, Injector, Optional } from '@angular/core';
import { CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { DragDropConfig, DragDropRowChange } from '../../../core/table/config.interface';
import { DRAG_DROP_CONFIG, KLES_DRAG_DROP_ROW_CONTEXT } from '../../../token';
import { FormGroup } from '@angular/forms';
import { EventsService } from '../events/events.service';
import { KlesForm } from '../table/form';
import { defaultIfEmpty, defer, take } from 'rxjs';

export abstract class DragDropBase<TValue = unknown> {
    private static nextDropListId = 0;
    readonly dropListId: string;

    constructor(
        protected config: DragDropConfig<TValue> | undefined,
        protected readonly eventsService: EventsService,
        protected readonly klesForm: KlesForm,
        protected readonly injector: Injector,
        tableId?: string,
    ) {
        this.dropListId = tableId ? this.toDropListId(tableId) : `kles-rows-drop-list-${DragDropBase.nextDropListId++}`;
    }

    get enable() {
        return this.config?.enable || false;
    }

    get handleOnly(): boolean {
        return this.enable && (this.config?.options?.handleOnly ?? false);
    }

    get autoScrollStep(): number {
        return this.config?.options?.autoScrollStep ?? 8;
    }

    get connectedTo() {
        return this.config?.options?.connectedTo?.map((id) => this.toDropListId(id));
    }

    get sortPredicate(): (index: number, item: CdkDrag<FormGroup>) => boolean {
        return (index: number, item: CdkDrag<FormGroup>) => {
            const row = item.data;
            const targetRow = item.dropContainer.getSortedItems()[index]?.data as FormGroup | undefined;
            if (!targetRow || row === targetRow) return true;

            const targetForm = item.dropContainer.data as KlesForm;
            if (targetForm !== this.klesForm) {
                return (row.getRawValue()._depth ?? 0) === 0 && (targetRow.getRawValue()._depth ?? 0) === 0;
            }

            return this.klesForm.canMoveSubtree(row, targetRow);
        };
    }

    get previewComponent() {
        return this.config?.options?.dragPreview?.component;
    }

    get previewMatchSize() {
        return this.config?.options?.dragPreview?.matchSize ?? true;
    }

    get placeholderComponent() {
        return this.config?.options?.dragPlaceholder?.component;
    }

    isDragDisabled(row: FormGroup): boolean {
        return this.config?.options?.dragDisabled?.(row) ?? false;
    }

    componentInjector(row: FormGroup, rowIndex: number): Injector {
        return Injector.create({
            parent: this.injector,
            providers: [
                {
                    provide: KLES_DRAG_DROP_ROW_CONTEXT,
                    useValue: this.rowPayload(row, rowIndex),
                },
            ],
        });
    }

    abstract listDropped(event: CdkDragDrop<KlesForm>): void;

    rowDragStarted(row: FormGroup, rowIndex: number): void {
        this.eventsService.emit('rowDragStart', this.rowPayload(row, rowIndex));
    }

    rowDragMoved(row: FormGroup, rowIndex: number): void {
        this.eventsService.emit('rowDragMove', this.rowPayload(row, rowIndex));
    }

    rowDragEnded(row: FormGroup, rowIndex: number): void {
        this.eventsService.emit('rowDragEnd', this.rowPayload(row, rowIndex));
    }

    protected rowPayload(row: FormGroup, rowIndex: number) {
        return {
            row,
            rowIndex,
            value: row.value,
            rawValue: row.getRawValue(),
        };
    }

    protected reorder(event: CdkDragDrop<KlesForm>): void {
        const row = event.item.data as FormGroup;
        const visibleRows = event.container.getSortedItems().map((item) => item.data as FormGroup);
        const targetRow = visibleRows[event.currentIndex];

        if (!targetRow) {
            return;
        }

        const moved = this.klesForm.moveSubtree(row, targetRow);

        if (moved) {
            this.handleDrop({
                ...this.rowPayload(row, moved.currentIndex),
                previousIndex: moved.previousIndex,
                currentIndex: moved.currentIndex,
                parentId: row.getRawValue()._parentId,
                depth: row.getRawValue()._depth ?? 0,
                previousSiblingIndex: moved.previousSiblingIndex,
                currentSiblingIndex: moved.currentSiblingIndex,
                movedRows: moved.movedRows,
                movedRawValues: moved.movedRows.map((movedRow) => movedRow.getRawValue()),
            });
        }
    }

    protected transfer(event: CdkDragDrop<KlesForm>): void {
        const row = event.item.data as FormGroup;
        const targetRows = event.container.getSortedItems().map((item) => item.data as FormGroup);
        const targetRow = targetRows[event.currentIndex];
        const moved = event.previousContainer.data.transferSubtreeTo(event.container.data, row, targetRow);

        if (moved) {
            this.handleDrop({
                ...this.rowPayload(row, moved.currentIndex),
                previousIndex: moved.previousIndex,
                currentIndex: moved.currentIndex,
                previousContainerId: event.previousContainer.id,
                currentContainerId: event.container.id,
                parentId: row.getRawValue()._parentId,
                depth: row.getRawValue()._depth ?? 0,
                previousSiblingIndex: moved.previousSiblingIndex,
                currentSiblingIndex: moved.currentSiblingIndex,
                movedRows: moved.movedRows,
                movedRawValues: moved.movedRows.map((movedRow) => movedRow.getRawValue()),
            });
        }
    }

    private handleDrop(change: DragDropRowChange<TValue>): void {
        this.eventsService.emit('rowDrop', change);

        const drop = this.config?.options?.drop;
        if (!drop) {
            return;
        }

        defer(() => drop(change))
            .pipe(defaultIfEmpty(undefined), take(1))
            .subscribe({
                next: () => this.eventsService.emit('rowDropSuccess', change),
                error: (error) => this.eventsService.emit('rowDropError', { change, error }),
            });
    }

    private toDropListId(id: string): string {
        return id.endsWith('-rows-drop-list') ? id : `${id}-rows-drop-list`;
    }
}

export class DragDropService<TValue = unknown> extends DragDropBase<TValue> {
    constructor(
        @Optional() @Inject(DRAG_DROP_CONFIG) config: DragDropConfig<TValue> | undefined,
        eventsService: EventsService,
        klesForm: KlesForm,
        injector: Injector,
        tableId?: string,
    ) {
        super(config, eventsService, klesForm, injector, tableId);
    }

    listDropped(event: CdkDragDrop<KlesForm>) {
        if (event.previousContainer === event.container) {
            this.reorder(event);
        } else {
            this.transfer(event);
        }
    }
}

export class DragDropLazyService<TValue = unknown> extends DragDropBase<TValue> {
    constructor(
        @Optional() @Inject(DRAG_DROP_CONFIG) config: DragDropConfig<TValue> | undefined,
        eventsService: EventsService,
        klesForm: KlesForm,
        injector: Injector,
        tableId?: string,
    ) {
        super(config, eventsService, klesForm, injector, tableId);
    }

    listDropped(event: CdkDragDrop<KlesForm>) {
        if (event.previousContainer === event.container) {
            this.reorder(event);
            return;
        }

        this.transfer(event);
    }
}
