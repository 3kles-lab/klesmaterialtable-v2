import { DestroyRef, EventEmitter, Inject, inject, Injectable, Optional, Signal, signal } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { PaginatorStore } from '../../store/paginator-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DATASOURCE_SERVICE, PAGINATOR_CONFIG } from '../../../token';
import { IDatasourceService } from '../datasource/datasource.service';
import { IPaginatorConfig } from '../../../core/table/config.interface';

@Injectable()
export class PaginatorService {
    private _paginator: MatPaginator;
    private _disabled = signal(false);
    private _pageChanged = new EventEmitter<PageEvent>();
    private readonly destroyRef = inject(DestroyRef);

    constructor(
        @Optional() @Inject(PAGINATOR_CONFIG) private config: IPaginatorConfig,
        @Optional() protected paginatorStore: PaginatorStore | null,
        @Inject(DATASOURCE_SERVICE) private datasourceService: IDatasourceService,
    ) {}

    public register(paginator: MatPaginator) {
        this._paginator = paginator;
        this.datasourceService.datasource.paginator = this._paginator;

        if (this._paginator) {
            this._paginator.pageIndex = this.paginatorStore?.snapshot().page ?? this._paginator.pageIndex;
            this._paginator.pageSize = this.paginatorStore?.snapshot().perPage ?? this._paginator.pageSize;
            this._paginator.pageSizeOptions = this.config?.pageSizeOptions ?? [5, 10, 20, 25, 50];
            this._paginator.selectConfig = this.config?.selectConfig ?? {};
            this._paginator.showFirstLastButtons = this.config?.showFirstLastButtons ?? true;

            this._paginator.page.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
                this.paginatorStore?.setPage({ page: event.pageIndex, perPage: event.pageSize });
                this._pageChanged.next(event);
            });
        }
    }

    public get paginator(): MatPaginator {
        return this._paginator;
    }

    public pageChanged(): EventEmitter<PageEvent> {
        return this._pageChanged;
    }

    public setPageIndex(index: number): void {
        if (!this._paginator) {
            return;
        }

        this.setSizeIndex(this._paginator.pageSize, index);
    }

    public setPageSize(size: number): void {
        if (!this._paginator) {
            return;
        }
        this.setSizeIndex(size, 0);
    }

    public setPageSizeOptions(option: number[]): void {
        this._paginator.pageSizeOptions = option;
    }

    public setlength(length: number) {
        if (this._paginator) {
            this._paginator.length = length;
        }
    }

    public firstPage(): void {
        this._paginator?.firstPage();
    }

    public lastPage(): void {
        this._paginator?.lastPage();
    }

    public disabled(): Signal<boolean> {
        return this._disabled.asReadonly();
    }

    public disable(): void {
        this._disabled.set(true);
    }

    public enable(): void {
        this._disabled.set(false);
    }

    private setSizeIndex(size: number, index: number): void {
        const prev = this._paginator.pageIndex;
        this._paginator.pageSize = size;
        this._paginator.pageIndex = index;
        this._paginator.page.emit({
            pageIndex: this._paginator.pageIndex,
            pageSize: this._paginator.pageSize,
            length: this._paginator.length,
            previousPageIndex: prev,
        });
    }
}
