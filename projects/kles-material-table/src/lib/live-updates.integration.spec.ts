import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { KlesFormCheckboxComponent, KlesFormTextComponent } from '@3kles/kles-material-dynamicforms';
import { Subject } from 'rxjs';
import { TableComponent } from './components/table/table.component';
import { Query } from './core/query/query.interface';
import { KlesTableConfig } from './core/table/config.interface';
import { LiveUpdatesConfig, TableDataChange } from './core/table/live-updates.interface';
import { linesLazyLoader, linesLoader } from './core/table/loader.interface';
import { selectionConfig } from './core/table/selection-config.interface';
import { KlesTableComponent } from './kles-table.component';

type Row = { _id: number; name: string; comment: string };
type Response = { items: Row[]; total: number };

@Component({
    imports: [KlesTableComponent],
    template: '<kles-dynamic-table [tableConfig]="config"></kles-dynamic-table>',
})
class LiveUpdatesHost {
    config!: KlesTableConfig<unknown, Row>;
    readonly changes = new Subject<TableDataChange<Row>>();
    readonly requests: { query?: Query; result: Subject<Response> }[] = [];

    configure(lazy: boolean, shouldRefresh?: LiveUpdatesConfig<Row>['shouldRefresh']): void {
        const load = (_params: unknown, query?: Query) => {
            const result = new Subject<Response>();
            this.requests.push({ query, result });
            return result;
        };
        this.config = {
            columns: [
                {
                    columnDef: '#select',
                    headerCell: { field: { component: KlesFormCheckboxComponent } },
                    cell: { field: { component: KlesFormCheckboxComponent } },
                },
                { columnDef: 'name' },
                { columnDef: 'comment', cell: { field: { component: KlesFormTextComponent } } },
            ],
            paginator: true,
            pageSize: 2,
            sortConfig: { active: 'name', direction: 'asc' },
            selection: selectionConfig({ selectionMode: true }),
            liveUpdates: { events: () => this.changes, shouldRefresh },
            ...(lazy ? { lazy: true, lines: linesLazyLoader({ loader: load }) } : { lines: linesLoader({ loader: load }) }),
        };
    }

    respond(items: Row[], total = items.length): void {
        const { result } = this.requests[this.requests.length - 1];
        result.next({ items, total });
        result.complete();
    }
}

describe('live updates in a dynamic material table', () => {
    const alice: Row = { _id: 1, name: 'Alice', comment: 'Original' };
    const bruno: Row = { _id: 2, name: 'Bruno', comment: '' };
    let fixture: ComponentFixture<LiveUpdatesHost>;
    let host: LiveUpdatesHost;
    let table: KlesTableComponent<unknown, Row>;

    function setup(lazy: boolean, shouldRefresh?: LiveUpdatesConfig<Row>['shouldRefresh']): void {
        fixture = TestBed.createComponent(LiveUpdatesHost);
        host = fixture.componentInstance;
        host.configure(lazy, shouldRefresh);
        fixture.detectChanges();
        table = fixture.debugElement.query(By.directive(KlesTableComponent)).componentInstance;
        tick(0);
        host.respond([alice, bruno]);
        fixture.detectChanges();
    }

    afterEach(() => fixture?.destroy());

    it('keeps one silent lazy request in flight and groups subsequent events into one refresh', fakeAsync(() => {
        setup(true);
        host.changes.next({ type: 'created' });
        host.changes.next({ type: 'updated', id: 1, changes: { name: 'Alix' } });
        host.changes.next({ type: 'invalidate' });
        tick(0);

        expect(host.requests.length).toBe(2);
        expect(table.loading.active()).toBeFalse();
        expect(table.form.rows.get(1)).toBeDefined();
        host.changes.next({ type: 'deleted', id: 2 });
        host.changes.next({ type: 'invalidate' });
        tick(0);
        expect(host.requests.length).toBe(2);
        expect(host.requests[1].result.observed).toBeTrue();

        host.respond([alice]);
        tick(0);
        expect(host.requests.length).toBe(3);
        expect(host.requests[2].query?.pagination).toEqual({ page: 0, perPage: 2 });
        expect(table.loading.active()).toBeFalse();
        host.respond([alice]);
        tick(0);
        expect(host.requests.length).toBe(3);

        fixture.destroy();
        expect(host.changes.observed).toBeFalse();
    }));

    it('passes the lazy query to shouldRefresh and retains a patch across an in-flight response', fakeAsync(() => {
        const shouldRefresh = jasmine.createSpy<NonNullable<LiveUpdatesConfig<Row>['shouldRefresh']>>('shouldRefresh').and.returnValue(false);
        setup(true, shouldRefresh);
        host.changes.next({ type: 'invalidate' });
        tick(0);

        const update = { type: 'updated', id: 1, changes: { comment: 'Live' } } as const;
        host.changes.next(update);
        expect(shouldRefresh).toHaveBeenCalledOnceWith(update, host.requests[1].query!);
        expect(table.form.rows.get(1)?.get('comment')?.value).toBe('Live');
        tick(0);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('td.cdk-column-comment').textContent.trim()).toBe('Live');

        host.respond([alice, bruno]);
        tick(0);
        expect(table.form.rows.get(1)?.get('comment')?.value).toBe('Live');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('td.cdk-column-comment').textContent.trim()).toBe('Live');
        expect(host.requests.length).toBe(2);

        host.changes.next({ type: 'updated', id: 99, changes: { comment: 'Other page' } });
        tick(0);
        expect(table.form.rows.get(99)).toBeUndefined();
        expect(host.requests.length).toBe(2);
    }));

    it('reapplies local sorting for a patch and reloads ordering from the backend when requested', fakeAsync(() => {
        setup(false, (event, query) => !query.sort?.direction && 'name' in event.changes);
        const innerTable: TableComponent = fixture.debugElement.query(By.directive(TableComponent)).componentInstance;
        let rendered: number[] = [];
        const renderedRows = innerTable.dataSource.connect().subscribe((rows) => {
            rendered = rows.map((row) => row.getRawValue()._id);
        });

        const existingRow = table.form.rows.get(2);
        expect(rendered).toEqual([1, 2]);
        host.changes.next({ type: 'updated', id: 2, changes: { name: 'Aaron' } });
        tick(0);
        expect(table.form.rows.get(2)).toBe(existingRow);
        expect(rendered).toEqual([2, 1]);
        expect(host.requests.length).toBe(1);

        table.sort.setDirection('');
        host.changes.next({ type: 'updated', id: 2, changes: { name: 'Alex' } });
        tick(0);
        expect(host.requests.length).toBe(2);
        expect(table.loading.active()).toBeFalse();
        host.respond([{ ...bruno, name: 'Alex' }, alice]);
        tick(0);
        expect(rendered).toEqual([2, 1]);
        renderedRows.unsubscribe();
    }));

    it('keeps the displayed rows and processes pending invalidations after a failed refresh', fakeAsync(() => {
        setup(false);
        host.changes.next({ type: 'invalidate' });
        tick(0);
        host.changes.next({ type: 'invalidate' });
        host.requests[1].result.error(new Error('Request failed'));
        tick(0);

        expect(host.requests.length).toBe(3);
        expect(table.form.rows.get(1)).toBeDefined();
        expect(table.loading.active()).toBeFalse();
        host.respond([bruno]);
        tick(0);
        expect(table.form.rows.get(1)).toBeUndefined();
        expect(table.form.rows.get(2)).toBeDefined();
    }));

    it('clears the non-lazy header checkbox when a live deletion removes the only selection', fakeAsync(() => {
        setup(false);
        tick(0);
        const container: HTMLElement = fixture.nativeElement;
        const headerCheckbox = container.querySelector<HTMLInputElement>('thead input[type="checkbox"]')!;
        container.querySelector<HTMLInputElement>('tbody input[type="checkbox"]')!.click();
        tick(0);
        fixture.detectChanges();

        expect(table.selection.count()).toBe(1);
        expect(headerCheckbox.indeterminate).toBeTrue();

        host.changes.next({ type: 'deleted', id: alice._id });
        tick(0);
        host.respond([bruno]);
        tick(0);
        fixture.detectChanges();

        expect(table.form.rows.get(alice._id)).toBeUndefined();
        expect(table.selection.count()).toBe(0);
        expect(headerCheckbox.indeterminate).toBeFalse();
        expect(headerCheckbox.checked).toBeFalse();
    }));
});
