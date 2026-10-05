import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ValidatorFn } from '@angular/forms';
import { timer, map } from 'rxjs';
import { RowFormFactory } from './row-factory.service';
import { ROW_VALIDATION_CONFIG } from '../../../token';

const order: ValidatorFn = (row) => row.get('start')!.value <= row.get('end')!.value ? null : { order: true };
const fields = [{ name: 'start' }, { name: 'end' }];
const factory = (config = {}): RowFormFactory => {
    return new RowFormFactory(config);
};

describe('RowFormFactory row validation', () => {
    it('validates across fields on creation and every edit, including child rows', () => {
        const rows = factory({ lineValidations: [order, () => ({ businessRule: true })] })
            .createRows(fields, [{ start: 3, end: 1 }], { depth: 1, parentId: 'parent' });
        const row = rows[0].formGroup;
        expect(row.errors).toEqual({ order: true, businessRule: true });
        row.patchValue({ end: 5 });
        expect(row.errors).toEqual({ businessRule: true });
        expect(row.get('_parentId')!.value).toBe('parent');
    });

    it('revalidates patches and resets and preserves the default without configuration', () => {
        const row = factory({ lineValidations: [order] }).createRow(fields, { start: 3, end: 1 }).formGroup;
        row.patchValue({ end: 4 });
        expect(row.valid).toBeTrue();
        row.reset({ start: 5, end: 2 });
        expect(row.errors).toEqual({ order: true });
        expect(factory().createRow(fields, { start: 3, end: 1 }).formGroup.valid).toBeTrue();
    });

    it('runs async validation only after sync validation and cancels stale results', fakeAsync(() => {
        const asyncValidator = jasmine.createSpy('asyncValidator').and.callFake((row) => {
            const end = row.get('end').value;
            return timer(30).pipe(map(() => end === 4 ? { unavailable: true } : null));
        });
        const row = factory({ lineValidations: [order], lineAsyncValidations: [asyncValidator] })
            .createRow(fields, { start: 3, end: 1 }).formGroup;
        expect(asyncValidator).not.toHaveBeenCalled();
        row.patchValue({ end: 4 });
        expect(row.pending).toBeTrue();
        tick(10);
        row.patchValue({ end: 5 });
        tick(20);
        expect(row.pending).toBeTrue();
        tick(10);
        expect(row.valid).toBeTrue();
        row.patchValue({ end: 4 });
        tick(30);
        expect(row.errors).toEqual({ unavailable: true });
    }));

    it('resolves a table-specific factory without changing the root factory', () => {
        TestBed.configureTestingModule({ providers: [RowFormFactory, { provide: ROW_VALIDATION_CONFIG, useValue: { lineValidations: [() => ({ configured: true })] } }] });
        expect(TestBed.inject(RowFormFactory).createRow([], {}).formGroup.errors).toEqual({ configured: true });
        expect(new RowFormFactory().createRow([], {}).formGroup.valid).toBeTrue();
    });
});
