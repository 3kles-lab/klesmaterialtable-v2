import { signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ExtraRowConfig } from '../../../core/table/config.interface';
import { ExpandedRowStore } from '../../store/expanded-row-store.service';
import { ExtraRowService } from './extra-row.service';

describe('ExtraRowService', () => {
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
