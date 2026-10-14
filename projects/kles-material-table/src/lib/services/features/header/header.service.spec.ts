import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { of } from 'rxjs';
import { DATASOURCE_SERVICE, LOADER_SERVICE, PAGINATOR_CONFIG } from '../../../token';
import { FilterStore } from '../../store/filter-store.service';
import { PaginatorStore } from '../../store/paginator-store.service';
import { ColumnsService } from '../columns/columns.service';
import { EventsService } from '../events/events.service';
import { LoaderLazyService } from '../loader/loader.service';
import { PaginatorService } from '../paginator/paginator.service';
import { KlesDataSource, KlesLazyDataSource } from '../table/datasource';
import { KlesForm } from '../table/form';
import { HeaderLazyService, HeaderService } from './header.service';

for (const lazy of [false, true]) {
    describe(lazy ? 'HeaderLazyService pagination' : 'HeaderService pagination', () => {
        let header: FormGroup;
        let paginator: MatPaginator;
        let paginatorStore: PaginatorStore;
        let filterStore: FilterStore;
        let datasource: KlesDataSource | KlesLazyDataSource;
        let loader: jasmine.Spy;
        let renderedRows: FormGroup[];

        beforeEach(fakeAsync(() => {
            header = new FormGroup({ name: new FormControl('') });
            datasource = lazy ? new KlesLazyDataSource() : new KlesDataSource();
            if (datasource instanceof KlesDataSource) {
                datasource.filterPredicate = (row, filters) => row.value.name.includes(JSON.parse(filters).name);
                datasource.data = Array.from({ length: 100 }, (_, index) =>
                    new FormGroup({ name: new FormControl(index % 2 === 0 ? 'match' : 'other') }),
                );
            }
            loader = jasmine.createSpy('loader').and.returnValue(of({ total: 100, items: [] }));

            TestBed.configureTestingModule({
                imports: [MatPaginator],
                providers: [
                    HeaderService,
                    HeaderLazyService,
                    PaginatorService,
                    PaginatorStore,
                    FilterStore,
                    EventsService,
                    { provide: PAGINATOR_CONFIG, useValue: { pageSize: 10 } },
                    { provide: KlesForm, useValue: { getHeader: () => header } },
                    { provide: ColumnsService, useValue: { columns: () => [{ columnDef: 'name', filterable: true }] } },
                    { provide: DATASOURCE_SERVICE, useValue: { datasource } },
                    {
                        provide: LOADER_SERVICE,
                        useFactory: (pages: PaginatorStore, filters: FilterStore, events: EventsService) =>
                            lazy
                                ? new LoaderLazyService({ lines: { loader } } as any, pages, null, filters, events)
                                : { load: () => of({ loading: false, items: [], total: 100 }) },
                        deps: [PaginatorStore, FilterStore, EventsService],
                    },
                ],
            });

            paginatorStore = TestBed.inject(PaginatorStore);
            filterStore = TestBed.inject(FilterStore);
            paginatorStore.setPage({ page: 9, perPage: 10 });

            const fixture = TestBed.createComponent(MatPaginator);
            paginator = fixture.componentInstance;
            paginator.length = 100;
            TestBed.inject(PaginatorService).register(paginator);
            fixture.detectChanges();
            datasource.connect().subscribe((rows) => (renderedRows = rows));
            const service = lazy ? TestBed.inject(HeaderLazyService) : TestBed.inject(HeaderService);
            service.register();
            tick();
            loader.calls.reset();
        }));

        afterEach(() => datasource.disconnect());

        it('returns from the last page to the first page when a header filter changes', fakeAsync(() => {
            expect(paginator.pageIndex).toBe(9);
            header.get('name')!.setValue('match');
            tick(300);

            expect(paginator.pageIndex).toBe(0);
            expect(paginatorStore.snapshot()).toEqual({ page: 0, perPage: 10 });
            if (lazy) {
                expect(loader.calls.count()).toBe(1);
                expect(loader.calls.mostRecent().args[1]).toEqual({
                    filters: { name: 'match' },
                    pagination: { page: 0, perPage: 10 },
                    sort: undefined,
                });
            } else {
                expect(renderedRows.length).toBe(10);
                expect(renderedRows.every((row) => row.value.name === 'match')).toBeTrue();
            }
        }));

        it('also returns to the first page when the filter is cleared', fakeAsync(() => {
            header.get('name')!.setValue('match');
            tick(300);
            TestBed.inject(PaginatorService).setPageIndex(3);
            tick();

            header.get('name')!.setValue('');
            tick(300);

            expect(paginator.pageIndex).toBe(0);
            expect(paginatorStore.snapshot()).toEqual({ page: 0, perPage: 10 });
            let filters: Record<string, unknown> | undefined;
            filterStore.filters$.subscribe((value) => (filters = value)).unsubscribe();
            expect(filters).toEqual({ name: '' });
        }));
    });
}
