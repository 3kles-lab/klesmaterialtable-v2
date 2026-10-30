import { signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ExtraRowConfig } from '../../../core/table/config.interface';
import { ExpandedRowStore } from '../../store/expanded-row-store.service';
import { ExtraRowService } from './extra-row.service';

describe('ExtraRowService', () => {
    it('uses the same predicate for expansion eligibility and extra-row visibility', () => {
        const configs = signal<ExtraRowConfig[]>([{ mode: 'expand', cells: [],
            when: (index, row) => index === 2 && Number(row.getRawValue().versionCount) > 1 }]);
        const store = new ExpandedRowStore();
        const service = new ExtraRowService(configs, store);
        const row = new FormGroup({ _id: new FormControl('template'), versionCount: new FormControl(1) });
        store.expand('template');
        expect(service.canExpand(2, row)).toBeFalse();
        expect(service.rows()[0].when?.(2, row)).toBeFalse();
        row.controls.versionCount.setValue(2);
        expect(service.canExpand(2, row)).toBeTrue();
        expect(service.canExpand(0, row)).toBeFalse();
        expect(service.rows()[0].when?.(2, row)).toBeTrue();
        store.collapse('template');
        expect(service.rows()[0].when?.(2, row)).toBeFalse();
    });

    it('ignores always-visible extra rows and allows any matching expandable row', () => {
        const configs = signal<ExtraRowConfig[]>([{ mode: 'always', cells: [] },
            { mode: 'expand', cells: [], when: () => false }]);
        const service = new ExtraRowService(configs, new ExpandedRowStore());
        const row = new FormGroup({});
        expect(service.canExpand(0, row)).toBeFalse();
        configs.update(rows => [...rows, { mode: 'expand', cells: [] }]);
        expect(service.canExpand(0, row)).toBeTrue();
    });

    it('preserves the dynamic field configuration of extra cells', () => {
        const configs = signal<ExtraRowConfig[]>([
            {
                cells: [
                    {
                        columnDef: 'details',
                        field: {
                            disabled: true,
                            nonNullable: true,
                            updateOn: 'blur',
                        },
                    },
                ],
            },
        ]);
        const service = new ExtraRowService(configs, new ExpandedRowStore());

        expect(service.extraFields()).toEqual([
            {
                name: 'details',
                disabled: true,
                nonNullable: true,
                updateOn: 'blur',
            },
        ]);
    });

    it('uses the raw row id when the id control is disabled', () => {
        const configs = signal<ExtraRowConfig[]>([
            {
                mode: 'expand',
                cells: [{ columnDef: 'details' }],
            },
        ]);
        const store = new ExpandedRowStore();
        const service = new ExtraRowService(configs, store);
        const row = new FormGroup({
            _id: new FormControl('row-1', { nonNullable: true }),
        });
        row.controls._id.disable();
        store.expand('row-1');

        expect(service.rows()[0].when?.(0, row)).toBeTrue();
    });
});
