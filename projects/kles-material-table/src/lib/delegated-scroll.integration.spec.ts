import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, inject, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { KlesFormTextComponent } from '@3kles/kles-material-dynamicforms';
import { delay, firstValueFrom, of, Subject } from 'rxjs';
import { KlesTableConfig } from './core/table/config.interface';
import { linesLazyLoader, linesLoader } from './core/table/loader.interface';
import { KlesTablePaginatorOutletDirective } from './directives/table-paginator-outlet.directive';
import { KlesTableComponent } from './kles-table.component';

const items = Array.from({ length: 13 }, (_, index) => ({ _id: index, name: `Record ${index + 1}`, detail: `Detail ${index + 1}` }));
const pagination = { paginator: true, scrollMode: 'delegated', pageSize: 5, hidePageSize: true, showFirstLastButtons: false } as const;

function paginatedConfig(lazy: boolean): KlesTableConfig {
    const columns = [{ columnDef: 'name', cell: { field: { component: KlesFormTextComponent } } }];
    return lazy
        ? {
              ...pagination,
              columns,
              lazy: true,
              lines: linesLazyLoader({
                  loader: (_params, query) => {
                      const { page, perPage } = query!.pagination!;
                      return of({ total: items.length, items: items.slice(page * perPage, (page + 1) * perPage) }).pipe(delay(20));
                  },
              }),
          }
        : { ...pagination, columns, lines: linesLoader({ loader: () => of({ items }) }) };
}

@Component({
    imports: [KlesTableComponent, KlesTablePaginatorOutletDirective, MatButtonModule, MatDialogModule],
    template: `
        <h2 mat-dialog-title>Review records</h2>
        <mat-dialog-content>
            <p role="alert">Some records contain incomplete information. Review the values in the table before you confirm your selection.</p>
            @if (showTable()) {
                <kles-dynamic-table [tableConfig]="data.config" [paginatorOutlet]="data.fixedPaginator ? footerPaginator : undefined" />
            }
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <ng-template klesTablePaginatorOutlet #footerPaginator="klesTablePaginatorOutlet"></ng-template>
            <button mat-button mat-dialog-close>Cancel</button>
            <button mat-button [mat-dialog-close]="true">Confirm</button>
        </mat-dialog-actions>
    `,
})
class TableDialogComponent {
    readonly data = inject<{ config: KlesTableConfig; fixedPaginator: boolean }>(MAT_DIALOG_DATA);
    readonly showTable = signal(true);
}

describe('delegated pagination in a small Material dialog', () => {
    let dialog: MatDialog;
    let frame: HTMLIFrameElement;
    let originalFrameStyle: string;

    beforeEach(() => {
        // Resize the Karma browsing context so viewport units in Material are evaluated at 360 × 400.
        frame = window.frameElement as HTMLIFrameElement;
        originalFrameStyle = frame.style.cssText;
        frame.style.width = '360px';
        frame.style.height = '400px';
        TestBed.configureTestingModule({ imports: [TableDialogComponent] });
        dialog = TestBed.inject(MatDialog);
    });

    afterEach(async () => {
        try {
            const closed = firstValueFrom(dialog.afterAllClosed);
            dialog.closeAll();
            await closed;
        } finally {
            frame.style.cssText = originalFrameStyle;
        }
    });

    function render(ref: MatDialogRef<TableDialogComponent>): void {
        ref.componentRef!.changeDetectorRef.detectChanges();
        tick(50);
        ref.componentRef!.changeDetectorRef.detectChanges();
    }

    function open(config: KlesTableConfig, fixedPaginator = false) {
        const ref = dialog.open(TableDialogComponent, {
            data: { config, fixedPaginator },
            maxHeight: fixedPaginator ? '100dvh' : undefined,
            autoFocus: 'dialog',
            enterAnimationDuration: 0,
            exitAnimationDuration: 0,
        });
        render(ref);
        const overlay = TestBed.inject(OverlayContainer).getContainerElement();
        const content = overlay.querySelector<HTMLElement>('mat-dialog-content')!;
        const actions = overlay.querySelector<HTMLElement>('mat-dialog-actions')!;
        const form = content.querySelector<HTMLFormElement>('kles-table > form')!;
        const paginator = (fixedPaginator ? actions : content).querySelector<HTMLElement>('mat-paginator')!;
        return { ref, content, actions, form, paginator };
    }

    function expectFullyVisible(element: HTMLElement, viewport: HTMLElement): void {
        const bounds = element.getBoundingClientRect();
        const viewportBounds = viewport.getBoundingClientRect();
        expect(bounds.height).toBeGreaterThan(0);
        expect(bounds.width).toBeGreaterThan(0);
        expect(bounds.top).toBeGreaterThanOrEqual(viewportBounds.top - 1);
        expect(bounds.bottom).toBeLessThanOrEqual(viewportBounds.top + viewport.clientHeight + 1);
        expect(bounds.left).toBeGreaterThanOrEqual(viewportBounds.left - 1);
        expect(bounds.right).toBeLessThanOrEqual(viewportBounds.left + viewport.clientWidth + 1);
    }

    function expectClickable(button: HTMLButtonElement): void {
        const bounds = button.getBoundingClientRect();
        const target = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
        expect(button.disabled).toBeFalse();
        expect(button.contains(target))
            .withContext(`${button.textContent?.trim()} at (${Math.round(bounds.x)}, ${Math.round(bounds.y)}): ${target?.tagName ?? 'outside viewport'}`)
            .toBeTrue();
    }

    for (const lazy of [false, true]) {
        it(`keeps rows, page navigation and dialog actions usable with ${lazy ? 'server' : 'local'} pagination`, fakeAsync(() => {
            const { ref, content, actions, form, paginator } = open(paginatedConfig(lazy));
            const warning = content.querySelector<HTMLElement>('[role="alert"]')!;
            const previous = paginator.querySelector<HTMLButtonElement>('.mat-mdc-paginator-navigation-previous')!;
            const next = paginator.querySelector<HTMLButtonElement>('.mat-mdc-paginator-navigation-next')!;
            const range = paginator.querySelector<HTMLElement>('.mat-mdc-paginator-range-label')!;
            const [cancel, confirm] = actions.querySelectorAll('button');
            const firstRow = () => form.querySelector<HTMLElement>('tbody tr')!;
            const scrollToPaginator = () => {
                content.scrollTop = content.scrollHeight;
            };

            expect(window.innerWidth).toBe(360);
            expect(window.innerHeight).toBe(400);
            expectFullyVisible(warning, content);
            expect(warning.getBoundingClientRect().height).toBeGreaterThan(32);
            expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
            expect(form.scrollHeight).toBeLessThanOrEqual(form.clientHeight + 1);
            expect(firstRow().textContent).toContain('Record 1');
            expectClickable(cancel);
            expectClickable(confirm);
            const actionsTop = actions.getBoundingClientRect().top;
            const paginatorTop = paginator.getBoundingClientRect().top;
            expect(paginatorTop).toBeGreaterThan(content.getBoundingClientRect().bottom);

            content.scrollTop = firstRow().getBoundingClientRect().top - content.getBoundingClientRect().top;
            expect(content.scrollTop).toBeGreaterThan(0);
            expectFullyVisible(firstRow(), content);
            expect(paginator.getBoundingClientRect().top).toBeCloseTo(paginatorTop - content.scrollTop, 0);

            scrollToPaginator();
            expectFullyVisible(paginator, content);
            expect(Math.abs(previous.getBoundingClientRect().top - next.getBoundingClientRect().top)).toBeLessThan(1);
            expect(range.getBoundingClientRect().top).toBeLessThan(next.getBoundingClientRect().bottom);
            expect(range.getBoundingClientRect().bottom).toBeGreaterThan(next.getBoundingClientRect().top);
            expectClickable(next);
            next.focus();
            next.click();
            render(ref);
            expect(document.activeElement).toBe(next);
            expect(firstRow().textContent).toContain('Record 6');
            expectFullyVisible(firstRow(), content);
            expect(actions.getBoundingClientRect().top).toBeCloseTo(actionsTop, 0);

            scrollToPaginator();
            expectClickable(next);
            next.click();
            render(ref);
            expect(firstRow().textContent).toContain('Record 11');
            expect(form.querySelectorAll('tbody tr').length).toBe(3);
            expect(next.getAttribute('aria-disabled')).toBe('true');
            expectFullyVisible(firstRow(), content);

            scrollToPaginator();
            expectClickable(previous);
            previous.click();
            render(ref);
            expect(firstRow().textContent).toContain('Record 6');

            scrollToPaginator();
            expectClickable(previous);
            previous.click();
            render(ref);
            expect(firstRow().textContent).toContain('Record 1');
            expectFullyVisible(firstRow(), content);
            expect(previous.getAttribute('aria-disabled')).toBe('true');
            expectClickable(confirm);
            const closed = jasmine.createSpy('closed');
            ref.afterClosed().subscribe(closed);
            confirm.click();
            tick();
            expect(closed).toHaveBeenCalledWith(true);
        }));

        it(`keeps the footer controls visible through consecutive ${lazy ? 'server' : 'local'} page changes`, fakeAsync(() => {
            const { ref, content, actions, form, paginator } = open(paginatedConfig(lazy), true);
            const previous = paginator.querySelector<HTMLButtonElement>('.mat-mdc-paginator-navigation-previous')!;
            const next = paginator.querySelector<HTMLButtonElement>('.mat-mdc-paginator-navigation-next')!;
            const range = paginator.querySelector<HTMLElement>('.mat-mdc-paginator-range-label')!;
            const [cancel, confirm] = actions.querySelectorAll<HTMLButtonElement>(':scope > button');
            const firstRow = () => form.querySelector<HTMLElement>('tbody tr')!;

            expect(window.innerWidth).toBe(360);
            expect(window.innerHeight).toBe(400);
            expectFullyVisible(content.querySelector<HTMLElement>('[role="alert"]')!, content);
            expect(content.querySelector('mat-paginator')).toBeNull();
            expect(actions.querySelectorAll('mat-paginator').length).toBe(1);
            expectFullyVisible(paginator, actions);
            expectClickable(next);
            expectClickable(cancel);
            expectClickable(confirm);
            expect(Math.abs(previous.getBoundingClientRect().top - next.getBoundingClientRect().top)).toBeLessThan(1);
            expect(range.getBoundingClientRect().top).toBeLessThan(next.getBoundingClientRect().bottom);
            expect(range.getBoundingClientRect().bottom).toBeGreaterThan(next.getBoundingClientRect().top);

            const paginatorTop = paginator.getBoundingClientRect().top;
            content.scrollTop = firstRow().getBoundingClientRect().top - content.getBoundingClientRect().top;
            expectFullyVisible(firstRow(), content);
            content.scrollTop = content.scrollHeight;
            expect(content.scrollTop).toBeGreaterThan(0);
            expect(paginator.getBoundingClientRect().top).toBeCloseTo(paginatorTop, 0);
            expectClickable(next);
            next.focus({ preventScroll: true });
            next.click();
            render(ref);
            expect(firstRow().textContent).toContain('Record 6');
            expectFullyVisible(firstRow(), content);
            expect(document.activeElement).toBe(next);
            expectClickable(next);

            next.click();
            render(ref);
            expect(firstRow().textContent).toContain('Record 11');
            expect(next.getAttribute('aria-disabled')).toBe('true');
            expectClickable(previous);
            previous.click();
            render(ref);
            expect(firstRow().textContent).toContain('Record 6');
            expectClickable(previous);
            previous.click();
            render(ref);
            expect(firstRow().textContent).toContain('Record 1');
            expect(previous.getAttribute('aria-disabled')).toBe('true');
            expectClickable(cancel);
            expectClickable(confirm);

            const closed = jasmine.createSpy('closed');
            ref.afterClosed().subscribe(closed);
            confirm.click();
            tick();
            expect(closed).toHaveBeenCalledWith(true);
        }));
    }

    it('removes the external paginator when its table is removed and restores a single working paginator on return', fakeAsync(() => {
        const { ref, actions, content, paginator } = open(paginatedConfig(false), true);
        ref.componentInstance.showTable.set(false);
        render(ref);
        expect(paginator.isConnected).toBeFalse();
        expect(actions.querySelector('mat-paginator')).toBeNull();

        ref.componentInstance.showTable.set(true);
        render(ref);
        expect(actions.querySelectorAll('mat-paginator').length).toBe(1);
        const next = actions.querySelector<HTMLButtonElement>('.mat-mdc-paginator-navigation-next')!;
        expectClickable(next);
        next.click();
        render(ref);
        expect(content.querySelector('tbody tr')!.textContent).toContain('Record 6');
    }));

    it('scrolls to a focused row vertically and keeps wide columns scrollable horizontally', fakeAsync(() => {
        const { content, form, paginator } = open({
            ...pagination,
            columns: [{ columnDef: 'name', minWidth: '220px' }, { columnDef: 'detail', minWidth: '220px' }],
            keyboardNavigation: { enabled: true },
            lines: linesLoader({ loader: () => of({ items }) }),
        });
        const cells = form.querySelectorAll<HTMLElement>('tbody tr td:first-child');
        cells[0].focus();
        for (let index = 0; index < cells.length - 1; index++) {
            cells[index].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
        }
        expect(document.activeElement).toBe(cells[cells.length - 1]);
        expectFullyVisible(cells[cells.length - 1], content);
        expect(content.scrollTop).toBeGreaterThan(0);
        expect(form.scrollTop).toBe(0);
        expect(form.scrollWidth).toBeGreaterThan(form.clientWidth);

        const paginatorLeft = paginator.getBoundingClientRect().left;
        form.scrollLeft = form.scrollWidth;
        expect(form.scrollLeft).toBeGreaterThan(0);
        expect(content.scrollLeft).toBe(0);
        expect(paginator.getBoundingClientRect().left).toBe(paginatorLeft);
    }));

    it('keeps the empty state available while the first page loads and when it is empty', fakeAsync(() => {
        const response = new Subject<{ items: typeof items }>();
        const { ref, content, form, paginator } = open({
            ...pagination,
            columns: [{ columnDef: 'name' }],
            emptyState: true,
            lines: linesLoader({ loader: () => response }),
        });
        const loading = content.querySelector<HTMLElement>('.table-overlay')!;
        expect(loading.getBoundingClientRect().height).toBeGreaterThan(0);

        response.next({ items: [] });
        response.complete();
        render(ref);
        expect(content.querySelector('.table-overlay')).toBeNull();
        const refresh = content.querySelector<HTMLButtonElement>('.empty-state__refresh')!;
        content.scrollTop = refresh.getBoundingClientRect().top - content.getBoundingClientRect().top;
        expectFullyVisible(refresh, content);
        expectClickable(refresh);
        expect(form.scrollTop).toBe(0);
        content.scrollTop = content.scrollHeight;
        expectFullyVisible(paginator, content);
    }));
});
