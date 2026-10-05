import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { delay, of } from 'rxjs';
import { KlesTableConfig } from './core/table/config.interface';
import { linesLoader } from './core/table/loader.interface';
import { KlesTableFooterStartDirective } from './directives/table-footer-start.directive';
import { KlesTableComponent } from './kles-table.component';
import { selectionConfig } from './core/table/selection-config.interface';
import { KlesTableEmptyStateComponent } from './components/empty-state/empty-state.component';

const tableConfig: KlesTableConfig = {
    columns: [],
    paginator: true,
    lines: linesLoader({ loader: () => of({ items: [] }) }),
};

@Component({
    standalone: true,
    imports: [KlesTableComponent, KlesTableFooterStartDirective],
    template: `
        <kles-dynamic-table [tableConfig]="tableConfig">
            <div klesTableFooterStart data-testid="footer-start">12 éléments sélectionnés</div>
        </kles-dynamic-table>
    `,
})
class WithFooterStartHostComponent {
    readonly tableConfig = tableConfig;
}

@Component({
    standalone: true,
    imports: [KlesTableComponent],
    template: '<kles-dynamic-table [tableConfig]="tableConfig"></kles-dynamic-table>',
})
class WithoutFooterStartHostComponent {
    readonly tableConfig = tableConfig;
}

@Component({
    selector: 'test-empty-state-refresh-host',
    standalone: true,
    imports: [KlesTableComponent],
    template: '<kles-dynamic-table [tableConfig]="tableConfig"></kles-dynamic-table>',
})
class EmptyStateRefreshHostComponent {
    readonly loader = jasmine.createSpy('loader').and.returnValue(of({ items: [] }));
    readonly tableConfig: KlesTableConfig = {
        columns: [{ columnDef: 'name' }],
        lines: linesLoader({ loader: () => this.loader() }),
    };
}

@Component({
    selector: 'test-row-click-selection-host',
    standalone: true,
    imports: [KlesTableComponent],
    template: '<kles-dynamic-table [tableConfig]="tableConfig"></kles-dynamic-table>',
})
class RowClickSelectionHostComponent {
    readonly tableConfig: KlesTableConfig = {
        columns: [{ columnDef: 'name' }],
        lines: linesLoader({ loader: () => of({ items: [{ _id: 1, name: 'First row' }] }) }),
        selection: selectionConfig({ selectOnRowClick: true }),
    };
}

@Component({
    selector: 'test-column-drag-drop-host',
    standalone: true,
    imports: [KlesTableComponent],
    template: '<kles-dynamic-table [tableConfig]="tableConfig"></kles-dynamic-table>',
})
class ColumnDragDropHostComponent {
    readonly tableConfig: KlesTableConfig = {
        columns: [{ columnDef: 'first' }, { columnDef: 'second' }],
        lines: linesLoader({ loader: () => of({ items: [] }) }),
        dragDropColumns: { enable: true },
    };
}

describe('KlesTableComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                WithFooterStartHostComponent,
                WithoutFooterStartHostComponent,
                RowClickSelectionHostComponent,
                ColumnDragDropHostComponent,
                EmptyStateRefreshHostComponent,
                KlesTableEmptyStateComponent,
            ],
        }).compileComponents();
    });

    it('keeps the paginator when footerStart is not provided', () => {
        const fixture = TestBed.createComponent(WithoutFooterStartHostComponent);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('[klesTableFooterStart]'))).toBeNull();
        expect(fixture.debugElement.query(By.css('mat-paginator'))).not.toBeNull();
    });

    it('refreshes from the empty state and hides the button during loading and after data arrives', fakeAsync(() => {
        const fixture = TestBed.createComponent(EmptyStateRefreshHostComponent);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        const button = fixture.nativeElement.querySelector('.empty-state__refresh') as HTMLButtonElement;
        const table = fixture.debugElement.query(By.directive(KlesTableComponent)).componentInstance as KlesTableComponent;
        const refresh = jasmine.createSpy('refresh');
        const subscription = table.events.listen().subscribe(event => { if (event.type === 'refresh') refresh(); });
        expect(button).not.toBeNull();
        expect(fixture.nativeElement.querySelector('kles-table-empty-state').contains(button)).toBeTrue();
        expect(button.textContent).toContain('Refresh');
        expect(button.type).toBe('button');
        expect(fixture.componentInstance.loader).toHaveBeenCalledTimes(1);
        fixture.componentInstance.loader.and.returnValue(of({ items: [{ _id: 1, name: 'Loaded' }] }).pipe(delay(20)));
        button.click();
        tick(0);
        fixture.detectChanges();
        expect(refresh).toHaveBeenCalledTimes(1);
        expect(fixture.componentInstance.loader).toHaveBeenCalledTimes(2);
        expect(fixture.nativeElement.querySelector('.empty-state__refresh')).toBeNull();
        expect(table.loading.active()).toBeTrue();
        tick(20);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        expect(table.form.rows.list().at(0).get('name')!.value).toBe('Loaded');
        expect(fixture.nativeElement.querySelector('.table-empty-state-overlay')).toBeNull();
        subscription.unsubscribe();
        fixture.destroy();
    }));

    it('emits a refresh request from the standalone empty state without depending on a table', () => {
        const fixture = TestBed.createComponent(KlesTableEmptyStateComponent);
        const refreshRequested = jasmine.createSpy('refreshRequested');
        fixture.componentInstance.refreshRequested.subscribe(refreshRequested);
        fixture.detectChanges();
        (fixture.nativeElement.querySelector('.empty-state__refresh') as HTMLButtonElement).click();
        expect(refreshRequested).toHaveBeenCalledTimes(1);
        fixture.destroy();
    });

    it('uses a smaller vertical illustration and keeps refresh visible in short narrow tables', fakeAsync(() => {
        const fixture = TestBed.createComponent(EmptyStateRefreshHostComponent);
        document.body.appendChild(fixture.nativeElement);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        const overlay = fixture.nativeElement.querySelector('.table-empty-state-overlay') as HTMLElement;
        overlay.style.height = '160px';
        overlay.style.bottom = 'auto';
        overlay.style.width = '350px';
        const visual = overlay.querySelector('.empty-state__visual') as HTMLElement;
        const description = overlay.querySelector('.empty-state__description') as HTMLElement;
        const button = overlay.querySelector('.empty-state__refresh') as HTMLButtonElement;
        expect(getComputedStyle(visual).display).not.toBe('none');
        expect(visual.getBoundingClientRect().height).toBe(3 * parseFloat(getComputedStyle(document.documentElement).fontSize));
        expect(visual.getBoundingClientRect().bottom).toBeLessThanOrEqual(button.getBoundingClientRect().top);
        expect(button.getBoundingClientRect().top).toBeGreaterThanOrEqual(description.getBoundingClientRect().bottom);
        expect(button.getBoundingClientRect().bottom).toBeLessThanOrEqual(overlay.getBoundingClientRect().bottom);
        expect(overlay.scrollHeight).toBeLessThanOrEqual(overlay.clientHeight);
        const panel = overlay.querySelector('.empty-state__panel') as HTMLElement;
        expect(getComputedStyle(panel).flexDirection).toBe('column');
        for (const width of [320, 280]) {
            overlay.style.width = `${width}px`;
            expect(visual.getBoundingClientRect().height).toBe(48);
            expect(button.getBoundingClientRect().bottom).toBeLessThanOrEqual(overlay.getBoundingClientRect().bottom);
            expect(overlay.scrollHeight).toBeLessThanOrEqual(overlay.clientHeight);
        }
        overlay.style.width = '700px';
        expect(getComputedStyle(panel).flexDirection).toBe('row');
        expect(visual.getBoundingClientRect().height).toBe(72);
        // For heights too small to fit the original icon and button, scrolling remains available.
        overlay.style.height = '80px';
        expect(overlay.scrollHeight).toBeGreaterThan(overlay.clientHeight);
        overlay.scrollTop = overlay.scrollHeight;
        expect(button.getBoundingClientRect().top).toBeGreaterThanOrEqual(overlay.getBoundingClientRect().top);
        expect(button.getBoundingClientRect().bottom).toBeLessThanOrEqual(overlay.getBoundingClientRect().bottom);
        fixture.destroy();
        fixture.nativeElement.remove();
    }));

    it('projects footerStart before the paginator through the dynamic table loader', () => {
        const fixture: ComponentFixture<WithFooterStartHostComponent> = TestBed.createComponent(WithFooterStartHostComponent);
        fixture.detectChanges();

        const content = fixture.debugElement.query(By.css('[data-testid="footer-start"]'));
        const paginator = fixture.debugElement.query(By.css('mat-paginator'));

        expect(content.nativeElement.textContent.trim()).toBe('12 éléments sélectionnés');
        expect(
            Boolean(content.nativeElement.compareDocumentPosition(paginator.nativeElement) & Node.DOCUMENT_POSITION_FOLLOWING),
        ).toBeTrue();
    });

    it('selects a row on click without requiring a checkbox column', fakeAsync(() => {
        const fixture = TestBed.createComponent(RowClickSelectionHostComponent);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const table = fixture.debugElement.query(By.directive(KlesTableComponent)).componentInstance as KlesTableComponent;
        const rowElement = fixture.debugElement.query(By.css('tr.mat-mdc-row'));
        const row = table.form.rows.list().at(0);

        rowElement.triggerEventHandler('click', new MouseEvent('click', { bubbles: true }));
        tick();

        expect(row.get('#select')).toBeNull();
        expect(table.selection.selectionModel?.isSelected(row)).toBeTrue();
        fixture.detectChanges();
        expect(rowElement.nativeElement.classList.contains('kles-row-selected')).toBeTrue();
    }));

    it('renders one column drag handle per movable column', () => {
        const fixture = TestBed.createComponent(ColumnDragDropHostComponent);
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.css('.column-drag-handle')).length).toBe(2);
    });

    it('attaches header drags to the horizontal header list when row drag also exists on the table', fakeAsync(() => {
        const fixture = TestBed.createComponent(ColumnDragDropHostComponent);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const headerListElement = fixture.debugElement.query(By.css('.kles-column-drop-list'));
        const headerList = headerListElement.injector.get(CdkDropList);
        const headerElements = fixture.debugElement.queryAll(By.css('th.cdk-drag'));
        const headerDrags = headerElements.map((element) => element.injector.get(CdkDrag));

        expect(headerDrags.length).toBe(2);
        expect(headerDrags.every((drag) => drag.dropContainer === headerList)).toBeTrue();
        expect(headerList.autoScrollDisabled).toBeTrue();
    }));
});
