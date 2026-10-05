import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { map, of, timer } from 'rxjs';
import { KlesTableConfig } from './core/table/config.interface';
import { linesLoader } from './core/table/loader.interface';
import { KlesTableComponent } from './kles-table.component';

@Component({
    standalone: true,
    changeDetection: ChangeDetectionStrategy.Default,
    imports: [KlesTableComponent],
    template: '<kles-dynamic-table [tableConfig]="config"/><kles-dynamic-table [tableConfig]="plainConfig"/>',
})
class ValidationTableHost {
    config: KlesTableConfig = {
        columns: [{ columnDef: 'start' }, { columnDef: 'end' }],
        lineValidations: [(row) => row.get('start')!.value <= row.get('end')!.value ? null : { order: true }],
        lineAsyncValidations: [(row) => {
            const end = row.get('end')!.value;
            return timer(100).pipe(map(() => end === 9 ? { unavailable: true } : null));
        }],
        lines: linesLoader({
            loader: () => of({ items: [{ _id: 1, start: 3, end: 1 }] }),
            hasChildren: () => true,
            childrens: () => of({ items: [{ _id: 2, start: 4, end: 2 }] }),
        }),
    };
    plainConfig: KlesTableConfig = { ...this.config, lineValidations: undefined, lineAsyncValidations: undefined };
}

describe('row validation in dynamic tables', () => {
    let fixture: ComponentFixture<ValidationTableHost>;
    const render = () => { fixture.detectChanges(); tick(20); fixture.detectChanges(); tick(20); fixture.detectChanges(); };
    beforeEach(async () => { await TestBed.configureTestingModule({ imports: [ValidationTableHost] }).compileComponents(); });
    afterEach(() => fixture?.destroy());

    it('applies validators to loaded, created and child rows without leaking between tables', fakeAsync(() => {
        fixture = TestBed.createComponent(ValidationTableHost);
        render();
        const tables = fixture.debugElement.queryAll(By.directive(KlesTableComponent)).map((element) => element.componentInstance as KlesTableComponent);
        const [table, plain] = tables;
        const events = jasmine.createSpy('validationEvent');
        const subscription = table.events.listen().subscribe(events);
        expect(table.form.rows.list().at(0).errors).toEqual({ order: true });
        expect(plain.form.rows.list().at(0).valid).toBeTrue();
        expect(table.form.header.get().hasValidator(fixture.componentInstance.config.lineValidations![0])).toBeFalse();
        const created = table.form.rows.create({ _id: 3, start: 3, end: 1 });
        expect(created.errors).toEqual({ order: true });
        table.form.rows.patch(3, { end: 9 });
        expect(created.pending).toBeTrue();
        tick(100);
        expect(created.errors).toEqual({ unavailable: true });
        expect(events).toHaveBeenCalledWith(jasmine.objectContaining({
            type: 'rowValidationError',
            payload: jasmine.objectContaining({ row: created, errors: { unavailable: true }, controlsErrors: {} }),
        }));
        table.form.rows.patch(3, { end: 10 });
        tick(100);
        expect(created.valid).toBeTrue();
        table.tree.expand(1);
        render();
        expect(table.tree.getChildren(1)[0].errors).toEqual({ order: true });
        table.refresh();
        render();
        expect(table.form.rows.list().at(0).errors).toEqual({ order: true });
        subscription.unsubscribe();
    }));
});
