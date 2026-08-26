import { Inject, Injectable, Optional } from '@angular/core';
import { CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { DragDropConfig } from '../../../core/table/config.interface';
import { DRAG_DROP_CONFIG } from '../../../token';
import { FormArray, FormGroup } from '@angular/forms';
import { EventsService } from '../events/events.service';
import { KlesForm } from '../table/form';

export abstract class DragDropBase {
    constructor(
        protected config: DragDropConfig | undefined,
        protected readonly eventsService: EventsService,
        protected readonly klesForm: KlesForm,
    ) {}

    get enable() {
        return this.config?.enable || false;
    }

    get autoScrollStep(): number {
        return this.config?.options?.autoScrollStep ?? 8;
    }

    get connectedTo() {
        return this.config?.options?.connectedTo;
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
        return this.config?.options?.dragPreview?.matchSize || true;
    }

    abstract listDropped(event: CdkDragDrop<FormArray<FormGroup>>): void;

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

    protected reorder(event: CdkDragDrop<FormArray<FormGroup>>): void {
        const row = event.item.data as FormGroup;
        const visibleRows = event.container.getSortedItems().map((item) => item.data as FormGroup);
        const targetRow = visibleRows[event.currentIndex];

        if (!targetRow) {
            return;
        }

        const moved = this.klesForm.moveRow(row, targetRow);

        if (moved) {
            this.eventsService.emit('rowDrop', {
                ...this.rowPayload(row, moved.currentIndex),
                previousIndex: moved.previousIndex,
                currentIndex: moved.currentIndex,
            });
        }
    }
}

@Injectable()
export class DragDropService extends DragDropBase {
    constructor(
        @Optional() @Inject(DRAG_DROP_CONFIG) config: DragDropConfig | undefined,
        eventsService: EventsService,
        klesForm: KlesForm,
    ) {
        super(config, eventsService, klesForm);
    }

    listDropped(event: CdkDragDrop<FormArray<FormGroup>>) {
        if (event.previousContainer === event.container) {
            this.reorder(event);
        } else {
            const row = event.item.data as FormGroup;
            this.eventsService.emit('rowDrop', {
                ...this.rowPayload(row, event.currentIndex),
                previousIndex: event.previousIndex,
                currentIndex: event.currentIndex,
                previousContainerId: event.previousContainer.id,
                currentContainerId: event.container.id,
            });
        }
    }
}

@Injectable()
export class DragDropLazyService extends DragDropBase {
    constructor(
        @Optional() @Inject(DRAG_DROP_CONFIG) config: DragDropConfig | undefined,
        eventsService: EventsService,
        klesForm: KlesForm,
    ) {
        super(config, eventsService, klesForm);
    }

    listDropped(event: CdkDragDrop<FormArray<FormGroup>>) {
        if (event.previousContainer === event.container) {
            this.reorder(event);
            return;
        }

        const row = event.item.data as FormGroup;
        this.eventsService.emit('rowDrop', {
            ...this.rowPayload(row, event.currentIndex),
            previousIndex: event.previousIndex,
            currentIndex: event.currentIndex,
            previousContainerId: event.previousContainer.id,
            currentContainerId: event.container.id,
        });
        // TODO appeler un observable + refresh tableau
    }
}
