import { DestroyRef, inject, Inject, Injectable } from '@angular/core';
import { LinesLoaderLazyService, LinesLoaderService } from './lines-loader.service';
import { LINESLOADER_SERVICE } from '../../../token';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingService } from '../loading/loading.service';
import { ScrollbarService } from '../scrollbar/scrollbar.service';
import { KlesForm } from '../table/form';
import { RowFormFactory } from '../table/row-factory.service';
import { ColumnsService } from '../columns/columns.service';
import { PaginatorService } from '../paginator/paginator.service';
import { auditTime, combineLatest, map, startWith, Subject, switchMap } from 'rxjs';

export interface ILinesService {
    register(): void;
    refresh(): void;
}

@Injectable()
export class LinesService implements ILinesService {
    private readonly destroyRef = inject(DestroyRef);
    private _refresh$ = new Subject<void>();

    constructor(
        @Inject(LINESLOADER_SERVICE) private loader: LinesLoaderService<any, any>,
        private fm: KlesForm,
        private columnsService: ColumnsService,
        private rowFactory: RowFormFactory,
        private loadingService: LoadingService,
        private scrollbarService: ScrollbarService,
    ) {}

    public register() {
        this.load();
    }

    public refresh() {
        console.log('refresh');
        this._refresh$.next();
    }

    private load() {
        this._refresh$
            .pipe(startWith(void 0))
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                auditTime(0),
                switchMap(() => {
                    return this.loader.load();
                }),
            )
            .subscribe((response) => {
                console.log(response);
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
            });
        // this.loader
        //     .load()
        //     .pipe(takeUntilDestroyed(this.destroyRef))
        //     .subscribe((response) => {
        //         if (response.loading) {
        //             this.scrollbarService.toTop('instant');
        //             this.loadingService.start();
        //             return;
        //         }

        //         this.loadingService.stop();

        //         this.fm.setRows(
        //             this.rowFactory.createRows(
        //                 this.columnsService.columns().map((col) => ({ ...col.cell, name: col.columnDef })),
        //                 response.items,
        //             ),
        //         );
        //     });
    }
}

@Injectable()
export class LinesLazyService implements ILinesService {
    private readonly destroyRef = inject(DestroyRef);
    private _refresh$ = new Subject<void>();

    constructor(
        @Inject(LINESLOADER_SERVICE) private loader: LinesLoaderLazyService<any, any>,
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
            });
    }
}
