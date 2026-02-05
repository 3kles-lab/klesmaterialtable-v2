import { DestroyRef, inject, Inject, Injectable, Optional, Signal, signal } from '@angular/core';
import { DATASOURCE_SERVICE, SELECTION_CONFIG } from '../../../token';
import { SelectionConfig } from '../../../core/table/selection-config.interface';
import { KlesSelectionModel } from '../../../core/selection/selection-model';
import { FormGroup } from '@angular/forms';
import { KlesForm } from '../table/form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { auditTime, concatMap, map, merge, switchMap } from 'rxjs';
import { SelectionLoaderService } from './selection-loader.service';
import { ScrollbarService } from '../scrollbar/scrollbar.service';
import { LoadingService } from '../loading/loading.service';
import { DatasourceService } from '../datasource/datasource.service';
import { ColumnsService } from '../columns/columns.service';
import { IKlesSelectionModel } from '../../../core/selection/selection-model.interface';

export interface ISelectionService {
    key: string;
    selectionMode: boolean;
    register(): void;
    selectionModel?: IKlesSelectionModel<FormGroup>;
    count(): Signal<number>;
}

@Injectable()
export abstract class AbstractSelectionService<T> implements ISelectionService {
    constructor(@Optional() @Inject(SELECTION_CONFIG) protected readonly selectionConfig: SelectionConfig<T> | undefined) {}

    public get key() {
        return this.selectionConfig?.key || '#select';
    }

    public get selectionMode(): boolean {
        return this.selectionConfig?.selectionMode || false;
    }

    public selectionModel: IKlesSelectionModel<FormGroup>;

    abstract register(): void;
    abstract count(): Signal<number>;
}

@Injectable()
export class SelectionService<T> extends AbstractSelectionService<T> {
    public selectionModel: KlesSelectionModel<FormGroup>;
    private readonly destroyRef = inject(DestroyRef);

    constructor(
        @Optional() @Inject(SELECTION_CONFIG) selectionConfig: SelectionConfig<T> | undefined,
        private fm: KlesForm,
        private selectionLoaderService: SelectionLoaderService<T>,
        private scrollbarService: ScrollbarService,
        private loadingService: LoadingService,
        private columnsService: ColumnsService,
        @Inject(DATASOURCE_SERVICE) private datasourceService: DatasourceService,
    ) {
        super(selectionConfig);
        this.selectionModel = new KlesSelectionModel<FormGroup>(selectionConfig.selectionMode);
    }

    public register(): void {
        this.listenSelection();
        this.listenRowSelection();
        this.listenHeaderSelection();
    }

    public count(): Signal<number> {
        return this.selectionModel.count;
    }

    private listenHeaderSelection(): void {
        this.fm
            .getHeader()
            .controls[this.key].valueChanges.pipe(
                takeUntilDestroyed(this.destroyRef),
                switchMap((value) => {
                    return this.selectionLoaderService.selectAll(!!value, this.fm.getHeader().getRawValue());
                }),
            )
            .subscribe((response) => {
                if (response.loading) {
                    this.scrollbarService.toTop('instant');
                    this.loadingService.start();
                    return;
                } else {
                    this.loadingService.stop();
                    if (response.selected) {
                        if (this.selectionModel.isMultipleSelection()) {
                            this.selectionModel.select(this.datasourceService.datasource.filteredData);
                        } else {
                            this.selectionModel.select(this.datasourceService.datasource.filteredData?.[0] ?? []);
                        }
                    } else {
                        this.selectionModel.deselect(this.datasourceService.datasource.filteredData);
                    }
                }
            });
    }

    private listenRowSelection(): void {
        this.datasourceService.datasource
            .connect()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                auditTime(0),
                switchMap((rows) => {
                    return merge(
                        ...rows
                            .map((row) => {
                                return row.controls[this.selectionLoaderService.key]?.valueChanges.pipe(
                                    map((value) => {
                                        return { row, selected: !!value };
                                    }),
                                );
                            })
                            .filter(Boolean),
                    );
                }),
                concatMap(({ row, selected }) => {
                    return this.selectionLoaderService.select(row, selected).pipe(
                        map((response) => {
                            return {
                                row,
                                response,
                            };
                        }),
                    );
                }),
            )

            .subscribe(({ row, response }) => {
                if (response.loading) {
                    //mettre la ligne avec un spinner
                } else {
                    if (response.selected) {
                        this.selectionModel.select(row);
                    } else {
                        this.selectionModel.deselect(row);
                    }
                    //enlever la ligne en spinner
                }
            });
    }

    private listenSelection(): void {
        this.selectionModel.changed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((changed) => {
            changed.removed.forEach((group: FormGroup) => {
                group.controls[this.selectionLoaderService.key].patchValue(false, { emitEvent: false });
            });

            changed.added.forEach((group: FormGroup) => {
                group.controls[this.selectionLoaderService.key].patchValue(true, { emitEvent: false });
            });

            if (this.selectionModel.hasValue()) {
                if (this.datasourceService.datasource.filteredData.length === this.selectionModel.selected.count) {
                    this.columnsService.setHeaderCellIndeterminate(this.selectionLoaderService.key, false);
                    this.fm.getHeader().controls[this.selectionLoaderService.key]?.patchValue(true, { emitEvent: false });
                } else {
                    this.columnsService.setHeaderCellIndeterminate(this.selectionLoaderService.key, true);
                    this.fm.getHeader().controls[this.selectionLoaderService.key]?.patchValue(false, { emitEvent: false });
                }
            } else {
                this.columnsService.setHeaderCellIndeterminate(this.selectionLoaderService.key, false);
                this.fm.getHeader().controls[this.selectionLoaderService.key]?.patchValue(false, { emitEvent: false });
            }

            this.fm.getRows().updateValueAndValidity({ emitEvent: false });
        });
    }
}

@Injectable()
export class SelectionLazyService<T> extends AbstractSelectionService<T> {
    private readonly destroyRef = inject(DestroyRef);
    private _count = signal(0);

    constructor(
        @Optional() @Inject(SELECTION_CONFIG) selectionConfig: SelectionConfig<T> | undefined,
        private fm: KlesForm,
        private selectionLoaderService: SelectionLoaderService<T>,
        private scrollbarService: ScrollbarService,
        private loadingService: LoadingService,
    ) {
        super(selectionConfig);
    }

    public register(): void {
        this.listenHeaderSelection();
    }

    public count(): Signal<number> {
        return this._count.asReadonly();
    }

    private listenHeaderSelection(): void {
        this.fm
            .getHeader()
            .controls[this.key].valueChanges.pipe(
                takeUntilDestroyed(this.destroyRef),
                switchMap((value) => {
                    return this.selectionLoaderService.selectAll(!!value, this.fm.getHeader().getRawValue());
                }),
            )
            .subscribe((response) => {
                if (response.loading) {
                    this.scrollbarService.toTop('instant');
                    this.loadingService.start();
                    return;
                } else {
                    this.loadingService.stop();
                    this._count.set(response.count ?? 0);
                    this.fm.getRows().controls.forEach((group) => {
                        group.controls[this.selectionLoaderService.key].patchValue(response.selected, { emitEvent: false });
                    });
                    this.fm.getRows().updateValueAndValidity({ emitEvent: false });

                    // if (response.footer) {
                    //     this.fm.getFooter().patchValue(response.footer, { emitEvent: false });
                    // }
                }
            });
    }
}
