import { KlesFormInputComponent } from '@3kles/kles-material-dynamicforms';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { KlesTableConfig } from './core/table/config.interface';
import { linesLazyLoader, linesLoader } from './core/table/loader.interface';
import { selectionConfig } from './core/table/selection-config.interface';
import { KlesTableComponent } from './kles-table.component';

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: true,
    imports: [KlesTableComponent],
    template: '<kles-dynamic-table [tableConfig]="config"></kles-dynamic-table>',
})
class KeyboardTableHost {
    config: KlesTableConfig = {
        keyboardNavigation: { enabled: true, ariaLabel: 'Records' },
        columns: [
            { columnDef: 'name', cell: { field: { component: KlesFormInputComponent } } },
            { columnDef: 'other' },
        ],
        selection: selectionConfig({}),
        lines: linesLoader({ loader: () => of({ items: [
            { _id: 1, name: 'First', other: 'A' },
            { _id: 2, name: 'Second', other: 'B' },
        ] }) }),
    };
}

describe('keyboard navigation in a dynamic material table', () => {
    let fixture: ComponentFixture<KeyboardTableHost>;
    const createFixture = (): void => {
        fixture = TestBed.createComponent(KeyboardTableHost);
        document.body.appendChild(fixture.nativeElement);
    };
    const render = (): void => { fixture.detectChanges(); tick(20); fixture.detectChanges(); tick(20); fixture.detectChanges(); };
    const cells = (): HTMLElement[] => [...fixture.nativeElement.querySelectorAll('[data-kles-keyboard-cell]')];
    const table = (): KlesTableComponent => fixture.debugElement.query(By.directive(KlesTableComponent)).componentInstance;
    const key = (element: HTMLElement, name: string): void => {
        element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [KeyboardTableHost] }).compileComponents();
    });
    afterEach(() => { fixture.destroy(); fixture.nativeElement.remove(); });

    it('wires configuration, edits a dynamic field and selects through the normal selection pipeline', fakeAsync(() => {
        createFixture();
        render();
        expect(fixture.nativeElement.querySelector('table').getAttribute('role')).toBe('grid');
        expect(cells().length).toBe(4);
        cells()[0].focus();
        key(cells()[0], 'F2');
        const input = cells()[0].querySelector<HTMLInputElement>('input')!;
        expect(document.activeElement).toBe(input);
        input.value = 'Updated';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        key(input, 'Escape');
        expect(document.activeElement).toBe(cells()[0]);
        expect(table().form.rows.list().at(0).get('name')!.value).toBe('Updated');
        key(cells()[0], ' ');
        tick();
        expect(table().selection.selectionModel!.isSelected(table().form.rows.list().at(0))).toBeTrue();
    }));

    it('reconciles public column visibility changes', fakeAsync(() => {
        createFixture();
        render();
        cells()[1].focus();
        table().column.setVisible('other', false);
        render();
        expect(cells().length).toBe(2);
        expect(document.activeElement).toBe(cells()[0]);
        key(cells()[0], 'ArrowDown');
        expect(document.activeElement).toBe(cells()[1]);
    }));

    it('offers direct entry before the header without traversing its filters', fakeAsync(() => {
        createFixture();
        render();
        const entry = fixture.nativeElement.querySelector('.kles-grid-entry') as HTMLButtonElement;
        const header = fixture.nativeElement.querySelector('thead');
        expect(Boolean(entry.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTrue();
        entry.focus();
        entry.click();
        expect(document.activeElement).toBe(cells()[0]);
        key(cells()[0], 'ArrowDown');
        expect(document.activeElement).toBe(cells()[2]);
    }));

    it('scrolls the first row fully below the sticky header when navigating upwards', fakeAsync(() => {
        createFixture();
        fixture.componentInstance.config.lines = linesLoader({ loader: () => of({ items:
            Array.from({ length: 20 }, (_, index) => ({ _id: index, name: `Row ${index}`, other: index })),
        }) });
        render();
        const form = fixture.nativeElement.querySelector('form') as HTMLElement;
        form.style.height = '240px';
        form.style.flex = '0 0 240px';
        form.style.scrollBehavior = 'auto';
        tick(50);
        fixture.detectChanges();
        const header = fixture.nativeElement.querySelector('tr.mat-mdc-header-row') as HTMLElement;
        expect(form.scrollHeight).toBeGreaterThan(form.clientHeight);
        expect(parseFloat(getComputedStyle(form).scrollPaddingTop)).toBeGreaterThan(0);
        const firstColumn = cells().filter((_, index) => index % 2 === 0);
        firstColumn[5].focus({ preventScroll: true });
        form.scrollTop = 200;
        for (let index = 5; index > 0; index--) key(firstColumn[index], 'ArrowUp');
        expect(document.activeElement).toBe(firstColumn[0]);
        expect(firstColumn[0].getBoundingClientRect().top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom - 1);
        expect(form.scrollTop).toBeLessThanOrEqual(1);
    }));

    it('supports pagination and server selection without requiring row click selection', fakeAsync(() => {
        createFixture();
        const select = jasmine.createSpy('select').and.callFake((_params, _row, selected) => of({ selected, count: selected ? 1 : 0 }));
        fixture.componentInstance.config = {
            columns: fixture.componentInstance.config.columns,
            keyboardNavigation: { enabled: true },
            lazy: true,
            paginator: true,
            pageSize: 2,
            pageSizeOptions: [2],
            selection: selectionConfig({ select }),
            lines: linesLazyLoader({ loader: (_params, query) => of({ total: 4, items: [
                { _id: (query?.pagination?.page ?? 0) * 2 + 1, name: 'First' },
                { _id: (query?.pagination?.page ?? 0) * 2 + 2, name: 'Second' },
            ] }) }),
        };
        render();
        cells()[0].focus();
        key(cells()[0], ' ');
        tick();
        expect(select).toHaveBeenCalledTimes(1);
        expect(table().selection.count()).toBe(1);
        table().pagination!.setPageIndex(1);
        render();
        expect(table().form.rows.list().at(0).get('_id')!.value).toBe(3);
        expect(cells().filter(cell => cell.tabIndex === 0).length).toBe(1);
    }));

    it('does not automatically request another infinite page when pressing Down at the last row', fakeAsync(() => {
        createFixture();
        const loader = jasmine.createSpy('loader').and.returnValue(of({ total: 2, items: [
            { _id: 1, name: 'First' }, { _id: 2, name: 'Second' },
        ] }));
        fixture.componentInstance.config = {
            columns: fixture.componentInstance.config.columns,
            keyboardNavigation: { enabled: true },
            lazy: true,
            infinite: true,
            pageSize: 2,
            lines: linesLazyLoader({ loader }),
        };
        render();
        cells()[2].focus();
        key(cells()[2], 'ArrowDown');
        tick();
        expect(document.activeElement).toBe(cells()[2]);
        expect(loader).toHaveBeenCalledTimes(1);
    }));
});
