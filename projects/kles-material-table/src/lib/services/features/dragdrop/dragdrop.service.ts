import { Inject, Injectable, Optional } from '@angular/core';
import { CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { IDragDropConfig } from '../../../core/table/config.interface';
import { IKlesDataSource } from '../../../core/datasource/datasource.interface';
import { FormArray } from '@angular/forms';
import { PaginatorStore } from '../../store/paginator-store.service';
import { DRAG_DROP_CONFIG } from '../../../token';

export abstract class DragDropBase {
    constructor(protected config: IDragDropConfig) {}

    get enable() {
        return this.config?.enable || false;
    }

    get autoScrollStep() {
        return this.config?.options?.autoScrollStep;
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
        return this.config.options?.dragPreview?.matchSize || true;
    }

    abstract listDropped(event: CdkDragDrop<IKlesDataSource>): void;
}

@Injectable()
export class DragDropService extends DragDropBase {
    constructor(@Optional() @Inject(DRAG_DROP_CONFIG) protected config: IDragDropConfig, @Optional() private paginatorStore: PaginatorStore | null) {
        super(config);
    }

    listDropped(event: CdkDragDrop<IKlesDataSource>) {
        if (event.previousContainer === event.container) {
            const faRows = event.container.data.form.get('rows') as FormArray;
            const previousIndex = faRows.controls.findIndex((c) => c.value._id === event.item.data.value._id);

            const currentIndex = event.currentIndex + (this.paginatorStore?.snapshot().page * this.paginatorStore?.snapshot().perPage || 0);

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
    constructor(@Optional() @Inject(DRAG_DROP_CONFIG) protected config: IDragDropConfig) {
        super(config);
    }

    listDropped(event: CdkDragDrop<IKlesDataSource>) {
        console.log('lazy');
        // TODO appeler un observable + refresh tableau
    }
}
