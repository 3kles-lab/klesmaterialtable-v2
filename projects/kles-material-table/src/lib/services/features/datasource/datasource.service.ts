import { DestroyRef, inject, Injectable } from '@angular/core';
import { KlesDataSource, KlesLazyDataSource } from '../table/datasource';
import { IKlesDataSource } from '../../../core/datasource/datasource.interface';
import { KlesForm } from '../table/form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

export interface IDatasourceService {
    get datasource(): IKlesDataSource;
    register(): void;
}

@Injectable()
export class DatasourceService implements IDatasourceService {
    private _datasource: KlesDataSource;
    private readonly destroyRef = inject(DestroyRef);

    constructor(private fm: KlesForm) {}

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
        this.fm
            .getRows()
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef), startWith(null))
            .subscribe(() => {
                this._datasource.data = this.fm.rows;
            });
    }
}

@Injectable()
export class DatasourceLazyService implements IDatasourceService {
    private _datasource: KlesLazyDataSource;
    private readonly destroyRef = inject(DestroyRef);

    constructor(private fm: KlesForm) {}

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
        this.fm
            .getRows()
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef), startWith(null))
            .subscribe(() => {
                this._datasource.data = this.fm.rows;
            });
    }
}
