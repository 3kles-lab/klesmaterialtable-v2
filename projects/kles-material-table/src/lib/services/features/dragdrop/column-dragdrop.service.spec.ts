import { CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { signal } from '@angular/core';
import { KlesColumnConfig } from '../../../core/table/column.interface';
import { ColumnsService } from '../columns/columns.service';
import { ColumnDragDropService } from './column-dragdrop.service';

describe('ColumnDragDropService', () => {
    const column = (columnDef: string, config: Partial<KlesColumnConfig> = {}): KlesColumnConfig => ({ columnDef, ...config });

    function createService(columns: KlesColumnConfig[], enable = true, dragDisabled?: (column: KlesColumnConfig) => boolean) {
        const eventsService = jasmine.createSpyObj('EventsService', ['emit']);
        const columnsService = new ColumnsService(signal(columns), eventsService);
        columnsService.register();

        return {
            columnsService,
            eventsService,
            service: new ColumnDragDropService({ enable, options: { dragDisabled } }, columnsService),
        };
    }

    function dropEvent(source: KlesColumnConfig, columns: KlesColumnConfig[], previousIndex: number, currentIndex: number) {
        return {
            previousIndex,
            currentIndex,
            item: { data: source },
            container: { data: columns },
        } as unknown as CdkDragDrop<KlesColumnConfig[]>;
    }

    it('reorders visible columns through ColumnsService and keeps hidden columns supported', () => {
        const first = column('first');
        const hidden = column('hidden', { visible: false });
        const last = column('last');
        const { service, columnsService, eventsService } = createService([first, hidden, last]);

        service.listDropped(dropEvent(first, [first, last], 0, 1));

        expect(columnsService.columns().map(({ columnDef }) => columnDef)).toEqual(['hidden', 'last', 'first']);
        expect(eventsService.emit).toHaveBeenCalledWith('columnOrderChange', {
            previousIndex: 0,
            currentIndex: 2,
            columns: ['last', 'first'],
        });
    });

    it('does not move a column across sticky groups', () => {
        const sticky = column('sticky', { sticky: true });
        const standard = column('standard');
        const { service, columnsService } = createService([sticky, standard]);

        service.listDropped(dropEvent(standard, [sticky, standard], 1, 0));

        expect(columnsService.columns()).toEqual([sticky, standard]);
        expect(service.sortPredicate(0, { data: standard } as CdkDrag<KlesColumnConfig>)).toBeFalse();
    });

    it('honours the disabled state and the per-column predicate', () => {
        const locked = column('locked');
        const unlocked = column('unlocked');
        const { service } = createService([locked, unlocked], true, (current) => current === locked);

        expect(service.isDragDisabled(locked)).toBeTrue();
        expect(service.isDragDisabled(unlocked)).toBeFalse();
        expect(createService([unlocked], false).service.isDragDisabled(unlocked)).toBeTrue();
    });
});
