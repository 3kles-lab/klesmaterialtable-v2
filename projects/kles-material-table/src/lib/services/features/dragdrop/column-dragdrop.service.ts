import { CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ColumnDragDropConfig } from '../../../core/table/config.interface';
import { KlesColumnConfig } from '../../../core/table/column.interface';
import { ColumnsService } from '../columns/columns.service';

type ColumnGroup = 'sticky-start' | 'standard' | 'sticky-end';

export class ColumnDragDropService {
    readonly enable: boolean;

    constructor(
        private readonly config: ColumnDragDropConfig | undefined,
        private readonly columnsService: ColumnsService,
    ) {
        this.enable = config?.enable ?? false;
    }

    readonly sortPredicate = (index: number, drag: CdkDrag<KlesColumnConfig>): boolean => {
        const target = this.visibleColumns()[index];
        return target === undefined || this.isSameGroup(drag.data, target);
    };

    visibleColumns(): KlesColumnConfig[] {
        return this.columnsService.columns().filter((column) => column.visibleWhen?.() ?? column.visible !== false);
    }

    isDragDisabled(column: KlesColumnConfig): boolean {
        return !this.enable || (this.config?.options?.dragDisabled?.(column) ?? false);
    }

    listDropped(event: CdkDragDrop<KlesColumnConfig[]>): void {
        if (!this.enable || event.previousIndex === event.currentIndex) return;

        const source = event.item.data;
        const target = event.container.data[event.currentIndex];

        if (!source || !target || !this.isSameGroup(source, target)) return;

        const targetIndex = this.columnsService.columns().findIndex((column) => column.columnDef === target.columnDef);
        if (targetIndex < 0) return;

        this.columnsService.setColumnPosition(source.columnDef, targetIndex);
    }

    private isSameGroup(source: KlesColumnConfig, target: KlesColumnConfig): boolean {
        return this.groupOf(source) === this.groupOf(target);
    }

    private groupOf(column: KlesColumnConfig): ColumnGroup {
        if (column.sticky === true) return 'sticky-start';
        if (column.stickyEnd === true) return 'sticky-end';
        return 'standard';
    }
}
