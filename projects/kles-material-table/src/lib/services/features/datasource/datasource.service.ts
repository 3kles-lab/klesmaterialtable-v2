import { DestroyRef, inject, Injectable, signal, Signal } from '@angular/core';
import { KlesDataSource, KlesLazyDataSource } from '../table/datasource';
import { IKlesDataSource } from '../../../core/datasource/datasource.interface';
import { KlesForm } from '../table/form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { ColumnsService } from '../columns/columns.service';
import { CellValueChangeService } from '../cell/cell-valuechange.service';
import { ValidationService } from '../validation/validation.service';

export interface IDatasourceService {
    get datasource(): IKlesDataSource;
    readonly isEmpty: Signal<boolean>;
    register(): void;
}

@Injectable()
export class DatasourceService implements IDatasourceService {
    private _datasource!: KlesDataSource;
    private readonly destroyRef = inject(DestroyRef);

    private readonly _isEmpty = signal(true);
    readonly isEmpty = this._isEmpty.asReadonly();

    constructor(
        private fm: KlesForm,
        private columnsService: ColumnsService,
        private cellValueChangeService: CellValueChangeService,
        private validationService: ValidationService,
    ) {}

    public register() {
        this.createDataSource();
        this.listen();
    }

    get datasource(): KlesDataSource {
        return this._datasource;
    }

    private createDataSource() {
        this._datasource = new KlesDataSource();
    }

    private listen() {
        this.fm.rowsStructureChanged$.pipe(takeUntilDestroyed(this.destroyRef), startWith(void 0)).subscribe(() => {
            this._datasource.data = this.fm.rows;
        });

        this.datasource
            .connect()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((rows) => {
                this._isEmpty.set(rows.length === 0);
                this.cellValueChangeService.listen(rows, this.columnsService.getVisible());
                this.validationService.listen(rows, this.columnsService.getVisible());
            });
    }
}

@Injectable()
export class DatasourceLazyService implements IDatasourceService {
    private _datasource!: KlesLazyDataSource;
    private readonly destroyRef = inject(DestroyRef);

    private readonly _isEmpty = signal(true);
    readonly isEmpty = this._isEmpty.asReadonly();

    constructor(
        private fm: KlesForm,
        private columnsService: ColumnsService,
        private cellValueChangeService: CellValueChangeService,
        private validationService: ValidationService,
    ) {}

    public register() {
        this.createDataSource();
        this.listen();
    }

    get datasource(): KlesLazyDataSource {
        return this._datasource;
    }
    private createDataSource() {
        this._datasource = new KlesLazyDataSource();
    }

    private listen() {
        this.fm.rowsStructureChanged$.pipe(takeUntilDestroyed(this.destroyRef), startWith(void 0)).subscribe(() => {
            this._datasource.data = this.fm.rows;
        });

        this.datasource
            .connect()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((rows) => {
                this._isEmpty.set(rows.length === 0);
                this.cellValueChangeService.listen(rows, this.columnsService.getVisible());
                this.validationService.listen(rows, this.columnsService.getVisible());
            });
    }
}
