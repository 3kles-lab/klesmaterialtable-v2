import { DestroyRef, EventEmitter, inject, Inject, Injectable } from '@angular/core';
import { LOADER_SERVICE } from '../../../token';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingService } from '../loading/loading.service';
import { ScrollbarService } from '../scrollbar/scrollbar.service';
import { KlesForm } from '../table/form';
import { RowFormFactory } from '../table/row-factory.service';
import { ColumnsService } from '../columns/columns.service';
import { PaginatorService } from '../paginator/paginator.service';
import { Subject } from 'rxjs';
import { LoaderLazyService, LoaderService } from '../loader/loader.service';

export interface ILinesService {
    register(): void;
    total(): number;
    loaded(): EventEmitter<void>;
}

@Injectable()
export class LinesService implements ILinesService {
    private readonly destroyRef = inject(DestroyRef);
    private _loaded = new EventEmitter<void>();

    private _total: number;

    constructor(
        @Inject(LOADER_SERVICE) private loader: LoaderService<any, any>,
        private fm: KlesForm,
        private columnsService: ColumnsService,
        private rowFactory: RowFormFactory,
        private loadingService: LoadingService,
        private scrollbarService: ScrollbarService,
    ) {}

    public register() {
        this.load();
    }

    public total() {
        return this._total;
    }

    public loaded(): EventEmitter<void> {
        return this._loaded;
    }

    private load() {
        this.loader
            .load()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (response.loading) {
                    this.scrollbarService.toTop('instant');
                    this.loadingService.start();
                    return;
                }

                this.loadingService.stop();

                this.fm.setRows(
                    this.rowFactory.createRows(
                        this.columnsService.columns().map((col) => ({ ...col.cell, name: col.columnDef })),
                        response.items,
                    ),
                );
                this._total = response.items.length;
                this._loaded.next();
            });
    }
}

@Injectable()
export class LinesLazyService implements ILinesService {
    private readonly destroyRef = inject(DestroyRef);
    private _refresh$ = new Subject<void>();
    private _total: number;
    private _loaded = new EventEmitter<void>();

    constructor(
        @Inject(LOADER_SERVICE) private loader: LoaderLazyService<any, any>,
        private fm: KlesForm,
        private columnsService: ColumnsService,
        private rowFactory: RowFormFactory,
        private loadingService: LoadingService,
        private scrollbarService: ScrollbarService,
        private paginatorService: PaginatorService,
    ) {}

    public register() {
        this.load();
    }

    public total() {
        return this._total;
    }

    public loaded(): EventEmitter<void> {
        return this._loaded;
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
                    this.scrollbarService.toTop('instant');
                    this.loadingService.start();
                    return;
                }

                this.loadingService.stop();

                this.fm.setRows(
                    this.rowFactory.createRows(
                        this.columnsService.columns().map((col) => ({ ...col.cell, name: col.columnDef })),
                        response.items,
                    ),
                );
                this.paginatorService.setlength(response.total ?? 0);
                this._total = response.total ?? 0;
                this._loaded.next();
            });
    }
}
