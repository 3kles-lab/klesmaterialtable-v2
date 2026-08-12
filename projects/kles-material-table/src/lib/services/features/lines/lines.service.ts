import { DestroyRef, EventEmitter, inject, Inject, Injectable } from '@angular/core';
import { LOADER_SERVICE } from '../../../token';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KlesForm } from '../table/form';
import { RowFormFactory } from '../table/row-factory.service';
import { ColumnsService } from '../columns/columns.service';
import { PaginatorService } from '../paginator/paginator.service';
import { Subject } from 'rxjs';
import { LoaderLazyService, LoaderService } from '../loader/loader.service';
import { ExtraRowService } from '../extra-row/extra-row.service';
import { EventsService } from '../events/events.service';

export interface ILinesService {
    register(): void;
    total(): number;
    loaded(): EventEmitter<void>;
    loading(): EventEmitter<void>;
}

@Injectable()
export class LinesService implements ILinesService {
    private readonly destroyRef = inject(DestroyRef);
    private _loaded = new EventEmitter<void>();
    private _loading = new EventEmitter<void>();

    private _total: number | undefined;

    constructor(
        @Inject(LOADER_SERVICE) private loader: LoaderService<any, any>,
        private fm: KlesForm,
        private columnsService: ColumnsService,
        private rowFactory: RowFormFactory,
        private extraRowService: ExtraRowService,
        private readonly eventsService: EventsService,
    ) {}

    public register() {
        this.load();
    }

    public total() {
        return this._total ?? 0;
    }

    public loaded(): EventEmitter<void> {
        return this._loaded;
    }

    public loading(): EventEmitter<void> {
        return this._loading;
    }

    private load() {
        this.loader
            .load()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (response.loading) {
                    this.eventsService.emit('loadStart');
                    this._loading.next();
                } else {
                    if (response.error) {
                        this.eventsService.emit('loadError', {
                            error: response.error,
                            message: response.error?.message,
                        });
                    } else {
                        this.fm.setRows(
                            this.rowFactory.createRows(
                                this.columnsService
                                    .columns()
                                    .map((col) => ({ ...col.cell.field, name: col.columnDef }))
                                    .concat(this.extraRowService.extraColumns().map((col) => ({ ...col, name: col.columnDef }))),
                                response.items ?? [],
                            ),
                        );
                        this._total = response.items?.length ?? 0;
                        this._loaded.next();

                        this.eventsService.emit('loadSuccess', {
                            total: this._total,
                            values: response.items,
                            rawValues: this.fm.getRows().getRawValue(),
                            rows: this.fm.getRows().controls,
                        });
                    }
                }
            });
    }
}

@Injectable()
export class LinesLazyService implements ILinesService {
    private readonly destroyRef = inject(DestroyRef);
    private _refresh$ = new Subject<void>();
    private _total?: number;
    private _loaded = new EventEmitter<void>();
    private _loading = new EventEmitter<void>();

    constructor(
        @Inject(LOADER_SERVICE) private loader: LoaderLazyService<any, any>,
        private fm: KlesForm,
        private columnsService: ColumnsService,
        private rowFactory: RowFormFactory,
        private extraRowService: ExtraRowService,
        private paginatorService: PaginatorService,
        private readonly eventsService: EventsService,
    ) {}

    public register() {
        this.load();
    }

    public total() {
        return this._total ?? 0;
    }

    public loaded(): EventEmitter<void> {
        return this._loaded;
    }

    public loading(): EventEmitter<void> {
        return this._loading;
    }

    public refresh() {
        this._refresh$.next();
    }

    private load() {
        this.loader
            .load()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (response.loading) {
                    this._loading.next();
                    this.eventsService.emit('loadStart');
                } else {
                    if (response.error) {
                        this.eventsService.emit('loadError', {
                            error: response.error,
                            message: response.error?.message,
                        });
                    } else {
                        this.fm.setRows(
                            this.rowFactory.createRows(
                                this.columnsService
                                    .columns()
                                    .map((col) => ({ ...col.cell.field, name: col.columnDef }))
                                    .concat(this.extraRowService.extraColumns().map((col) => ({ ...col, name: col.columnDef }))),
                                response.items,
                            ),
                        );
                        this.paginatorService.setlength(response.total ?? 0);
                        this._total = response.total ?? 0;
                        this._loaded.next();

                        this.eventsService.emit('loadSuccess', {
                            total: this._total ?? 0,
                            values: response.items,
                            rawValues: this.fm.getRows().getRawValue(),
                            rows: this.fm.getRows().controls,
                        });
                    }
                }
            });
    }
}
