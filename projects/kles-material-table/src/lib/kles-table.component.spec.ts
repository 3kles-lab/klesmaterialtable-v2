import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { KlesTableConfig } from './core/table/config.interface';
import { linesLoader } from './core/table/loader.interface';
import { KlesTableFooterStartDirective } from './directives/table-footer-start.directive';
import { KlesTableComponent } from './kles-table.component';
import { selectionConfig } from './core/table/selection-config.interface';

const tableConfig: KlesTableConfig = {
    columns: [],
    paginator: true,
    lines: linesLoader({ loader: () => of({ items: [] }) }),
};

@Component({
    standalone: true,
    imports: [KlesTableComponent, KlesTableFooterStartDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
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
    changeDetection: ChangeDetectionStrategy.Eager,
    template: '<kles-dynamic-table [tableConfig]="tableConfig"></kles-dynamic-table>',
})
class WithoutFooterStartHostComponent {
    readonly tableConfig = tableConfig;
}

@Component({
    selector: 'test-row-click-selection-host',
    standalone: true,
    imports: [KlesTableComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
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
    changeDetection: ChangeDetectionStrategy.Eager,
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
            ],
        }).compileComponents();
    });

    it('keeps the paginator when footerStart is not provided', () => {
        const fixture = TestBed.createComponent(WithoutFooterStartHostComponent);
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('[klesTableFooterStart]'))).toBeNull();
        expect(fixture.debugElement.query(By.css('mat-paginator'))).not.toBeNull();
    });

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
