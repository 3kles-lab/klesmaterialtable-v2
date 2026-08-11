import { Inject, Injectable, Optional } from '@angular/core';
import { CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { DragDropConfig } from '../../../core/table/config.interface';
import { PaginatorStore } from '../../store/paginator-store.service';
import { DRAG_DROP_CONFIG } from '../../../token';
import { FormArray, FormGroup } from '@angular/forms';

export abstract class DragDropBase {
    constructor(protected config?: DragDropConfig) {}

    get enable() {
        return this.config?.enable || false;
    }

    get autoScrollStep() {
        return this.config?.options?.autoScrollStep ?? true;
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
}

@Injectable()
export class DragDropService extends DragDropBase {
    constructor(
        @Optional() @Inject(DRAG_DROP_CONFIG) protected config?: DragDropConfig,
        @Optional() private paginatorStore?: PaginatorStore | null,
    ) {
        super(config);
    }

    listDropped(event: CdkDragDrop<FormArray<FormGroup>>) {
        if (event.previousContainer === event.container) {
            const faRows = event.container.data;

            const currentIndex = event.currentIndex + (this.paginatorStore?.snapshot().page ?? 0) * (this.paginatorStore?.snapshot().perPage ?? 0);
            const previousIndex = event.previousIndex + (this.paginatorStore?.snapshot().page ?? 0) * (this.paginatorStore?.snapshot().perPage ?? 0);

            if (previousIndex >= 0) {
                const ctrl = faRows.at(previousIndex);
                faRows.removeAt(previousIndex, { emitEvent: false });
                faRows.insert(currentIndex, ctrl, { emitEvent: false });
                faRows.updateValueAndValidity({ emitEvent: true });
            }
        } else {
            //TODO
        }
    }
}

@Injectable()
export class DragDropLazyService extends DragDropBase {
    constructor(@Optional() @Inject(DRAG_DROP_CONFIG) protected config?: DragDropConfig) {
        super(config);
    }

    listDropped(event: CdkDragDrop<FormArray<FormGroup>>) {
        
        // TODO appeler un observable + refresh tableau
    }
}
