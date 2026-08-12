import { DestroyRef, inject, Inject, Injectable, Optional, Signal, signal } from '@angular/core';
import { DATASOURCE_SERVICE, LINES_SERVICE, SELECTION_CONFIG } from '../../../token';
import { SelectionConfig } from '../../../core/table/selection-config.interface';
import { KlesSelectionModel } from '../../../core/selection/selection-model';
import { FormGroup } from '@angular/forms';
import { KlesForm } from '../table/form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { auditTime, concatMap, map, merge, of, switchMap, withLatestFrom } from 'rxjs';
import { SelectionLoaderService } from './selection-loader.service';
import { ScrollbarService } from '../scrollbar/scrollbar.service';
import { LoadingService } from '../loading/loading.service';
import { DatasourceService } from '../datasource/datasource.service';
import { IKlesSelectionModel } from '../../../core/selection/selection-model.interface';
import { KlesSelectionModelState } from '../../../core/selection/selection-state.enum';
import { ILinesService } from '../lines/lines.service';
import { FilterStore } from '../../store/filter-store.service';

export interface ISelectionService {
    key: string;
    selectionMode: boolean;
    register(): void;
    selectionModel?: IKlesSelectionModel<FormGroup>;
    count(): Signal<number>;
    disable(): void;
    enable(): void;
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

    public selectionModel!: IKlesSelectionModel<FormGroup>;

    abstract register(): void;
    abstract count(): Signal<number>;
    abstract disable(): void;
    abstract enable(): void;
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
        @Inject(DATASOURCE_SERVICE) private datasourceService: DatasourceService,
        @Inject(LINES_SERVICE) private linesService: ILinesService,
    ) {
        super(selectionConfig);
        this.selectionModel = new KlesSelectionModel<FormGroup>(selectionConfig?.selectionMode);
    }

    public register(): void {
        this.listenSelection();
        this.setSelection();
        this.listenDatasource();
        this.listenRowSelection();
        this.listenHeaderSelection();
    }

    public count(): Signal<number> {
        return this.selectionModel.count;
    }

    public disable(): void {
        this.selectionModel.disable();
    }

    public enable(): void {
        this.selectionModel.enable();
    }

    private setSelection() {
        this.linesService
            .loaded()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.fm.getRows().controls.forEach((group) => {
                    if (group.controls[this.selectionLoaderService.key]?.value === true) {
                        this.selectionModel.select(group, { emitEvent: false }); // event false to avoid multiple send event
                    } else if (this.selectionConfig?.isSelected != undefined && this.selectionConfig.isSelected(group)) {
                        this.selectionModel.select(group, { emitEvent: false }); // event false to avoid multiple send event
                        group.controls[this.selectionLoaderService.key]?.patchValue(true, { emitEvent: false });
                    } else {
                        this.selectionModel.deselect(group, { emitEvent: false }); // event false to avoid multiple send event
                    }
                    if (this.selectionConfig?.isDisabled && this.selectionConfig.isDisabled(group)) {
                        group.controls[this.selectionLoaderService.key]?.disable({ emitEvent: false });
                    }
                });
                this.updateHeader();
            });
    }

    private listenHeaderSelection(): void {
        this.fm
            .getHeader()
            .controls[this.key]?.valueChanges.pipe(
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
                            this.selectionModel.select(
                                this.datasourceService.datasource.filteredData?.filter((g) => g.controls[this.selectionLoaderService.key]?.enabled) ??
                                    [],
                            );
                        } else {
                            this.selectionModel.select(
                                this.datasourceService.datasource.filteredData?.filter(
                                    (g) => g.controls[this.selectionLoaderService.key]?.enabled,
                                )[0] ?? [],
                            );
                        }
                    } else {
                        this.selectionModel.deselect(
                            this.datasourceService.datasource.filteredData?.filter((g) => g.controls[this.selectionLoaderService.key]?.enabled),
                        );
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
            changed.removed?.forEach((group: FormGroup) => {
                group.controls[this.selectionLoaderService.key].patchValue(false, { emitEvent: false });
            });

            changed.added?.forEach((group: FormGroup) => {
                group.controls[this.selectionLoaderService.key].patchValue(true, { emitEvent: false });
            });
            this.fm.getRows().updateValueAndValidity({ emitEvent: false });
            this.updateHeader();
        });

        this.selectionModel.stateChanged.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
            if (state === KlesSelectionModelState.ENABLED) {
                this.fm.getHeader().controls[this.key].enable({ emitEvent: false });
                this.fm.getRows().controls.forEach((group) => {
                    group.controls[this.key].enable({ emitEvent: false });
                });
            } else {
                this.fm.getHeader().controls[this.key].disable({ emitEvent: false });
                this.fm.getRows().controls.forEach((group) => {
                    group.controls[this.key].disable({ emitEvent: false });
                });
            }
        });
    }

    private listenDatasource(): void {
        this.datasourceService.datasource
            .connect()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.updateHeader();
            });
    }

    private updateHeader() {
        if (this.selectionModel.hasValue()) {
            if (
                this.datasourceService.datasource.filteredData
                    .filter((group) => group.controls[this.selectionLoaderService.key]?.enabled)
                    .every((group) => this.selectionModel.isSelected(group))
            ) {
                this.fm.getUiHeader().get(this.selectionLoaderService.key)?.patchValue({ indeterminate: false });
                this.fm.getHeader().controls[this.selectionLoaderService.key]?.patchValue(true, { emitEvent: false });
            } else {
                this.fm.getUiHeader().get(this.selectionLoaderService.key)?.patchValue({ indeterminate: true });
                this.fm.getHeader().controls[this.selectionLoaderService.key]?.patchValue(false, { emitEvent: false });
            }
        } else {
            this.fm.getUiHeader().get(this.selectionLoaderService.key)?.patchValue({ indeterminate: false });
            this.fm.getHeader().controls[this.selectionLoaderService.key]?.patchValue(false, { emitEvent: false });
        }
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
        @Inject(DATASOURCE_SERVICE) private datasourceService: DatasourceService,
        @Inject(LINES_SERVICE) private linesService: ILinesService,
        @Optional() private filterStore: FilterStore | null,
    ) {
        super(selectionConfig);
    }

    public register(): void {
        this.setSelection();
        this.listenHeaderSelection();
        this.listenRowSelection();
    }

    public count(): Signal<number> {
        return this._count.asReadonly();
    }

    public disable(): void {
        this.fm.getHeader().controls[this.key].disable({ emitEvent: false });
    }

    public enable(): void {
        this.fm.getHeader().controls[this.key].enable({ emitEvent: false });
    }

    private listenHeaderSelection(): void {
        this.fm
            .getHeader()
            .controls[this.key]?.valueChanges.pipe(
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
                    this.fm
                        .getRows()
                        .controls.filter((group) => group.controls[this.key]?.enabled)
                        .forEach((group) => {
                            group.controls[this.selectionLoaderService.key].patchValue(response.selected, { emitEvent: false });
                        });
                    this.fm.getRows().updateValueAndValidity({ emitEvent: false });

                    // if (response.footer) {
                    //     this.fm.getFooter().patchValue(response.footer, { emitEvent: false });
                    // }
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
                                        return {
                                            row,
                                            selected: !!value,
                                        };
                                    }),
                                );
                            })
                            .filter(Boolean),
                    );
                }),

                withLatestFrom(this.filterStore?.filters$ ?? of({})),

                concatMap(([{ row, selected }, filters]) => {
                    return this.selectionLoaderService.select(row, selected, filters).pipe(
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
                    this.fm
                        .getUiHeader()
                        .get(this.selectionLoaderService.key)
                        ?.patchValue({
                            indeterminate: response.count != undefined ? response.count > 0 && this.linesService.total() > response.count : false,
                        });

                    //         if (footer) {
                    //             this.fm.getFooter().patchValue(footer, { emitEvent: false });
                    //         }
                }
            });
    }

    private setSelection() {
        this.linesService
            .loaded()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.fm.getRows().controls.forEach((group) => {
                    if (this.selectionConfig?.isSelected != undefined && this.selectionConfig.isSelected(group)) {
                        group.controls[this.selectionLoaderService.key]?.patchValue(true, { emitEvent: false });
                    }
                    if (this.selectionConfig?.isDisabled && this.selectionConfig.isDisabled(group)) {
                        group.controls[this.selectionLoaderService.key]?.disable({ emitEvent: false });
                    }
                });
                // this.updateHeader();
            });
    }
}
