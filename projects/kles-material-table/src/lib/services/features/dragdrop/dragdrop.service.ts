import { Inject, Injector, Optional } from '@angular/core';
import { CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { DragDropConfig, DragDropRowChange } from '../../../core/table/config.interface';
import { DRAG_DROP_CONFIG, KLES_DRAG_DROP_ROW_CONTEXT } from '../../../token';
import { FormGroup } from '@angular/forms';
import { EventsService } from '../events/events.service';
import { KlesForm } from '../table/form';
import { defaultIfEmpty, defer, take } from 'rxjs';

export abstract class DragDropBase {
    private static nextDropListId = 0;
    readonly dropListId: string;

    constructor(
        protected config: DragDropConfig | undefined,
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

    get autoScrollStep(): number {
        return this.config?.options?.autoScrollStep ?? 8;
    }

    get connectedTo() {
        return this.config?.options?.connectedTo?.map((id) => this.toDropListId(id));
    }

    get sortPredicate(): (index: number, item: CdkDrag<number>) => boolean {
        return (index: number, item: CdkDrag<number>) => {
            return true;
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

        const moved = this.klesForm.moveRow(row, targetRow);

        if (moved) {
            this.handleDrop({
                ...this.rowPayload(row, moved.currentIndex),
                previousIndex: moved.previousIndex,
                currentIndex: moved.currentIndex,
            });
        }
    }

    protected transfer(event: CdkDragDrop<KlesForm>): void {
        const row = event.item.data as FormGroup;
        const targetRows = event.container.getSortedItems().map((item) => item.data as FormGroup);
        const targetRow = targetRows[event.currentIndex];
        const moved = event.previousContainer.data.transferRowTo(event.container.data, row, targetRow);

        if (moved) {
            this.handleDrop({
                ...this.rowPayload(row, moved.currentIndex),
                previousIndex: moved.previousIndex,
                currentIndex: moved.currentIndex,
                previousContainerId: event.previousContainer.id,
                currentContainerId: event.container.id,
            });
        }
    }

    private handleDrop(change: DragDropRowChange): void {
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

export class DragDropService extends DragDropBase {
    constructor(
        @Optional() @Inject(DRAG_DROP_CONFIG) config: DragDropConfig | undefined,
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

export class DragDropLazyService extends DragDropBase {
    constructor(
        @Optional() @Inject(DRAG_DROP_CONFIG) config: DragDropConfig | undefined,
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
