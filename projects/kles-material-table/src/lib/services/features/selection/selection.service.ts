import { DestroyRef, inject, Inject, Injectable, Optional, Signal, signal } from '@angular/core';
import { DATASOURCE_SERVICE, LINES_SERVICE, SELECTION_CONFIG } from '../../../token';
import { SelectionConfig } from '../../../core/table/selection-config.interface';
import { KlesSelectionModel } from '../../../core/selection/selection-model';
import { FormGroup } from '@angular/forms';
import { KlesForm } from '../table/form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { auditTime, concatMap, map, merge, of, Subject, switchMap, withLatestFrom } from 'rxjs';
import { SelectionLoaderService } from './selection-loader.service';
import { ScrollbarService } from '../scrollbar/scrollbar.service';
import { LoadingService } from '../loading/loading.service';
import { DatasourceService } from '../datasource/datasource.service';
import { IKlesSelectionModel } from '../../../core/selection/selection-model.interface';
import { KlesSelectionModelState } from '../../../core/selection/selection-state.enum';
import { ILinesService } from '../lines/lines.service';
import { FilterStore } from '../../store/filter-store.service';
import { EventsService } from '../events/events.service';
import { SelectionChangePayload, SelectionErrorPayload } from '../events/event-payloads.model';

export interface ISelectionService {
    key: string;
    selectionMode: boolean;
    register(): void;
    selectionModel?: IKlesSelectionModel<FormGroup>;
    readonly loadingRows: Signal<ReadonlySet<FormGroup>>;
    isLoading(row: FormGroup): boolean;
    onRowClick(event: MouseEvent, row: FormGroup): void;
    count(): Signal<number>;
    disable(): void;
    enable(): void;
}

@Injectable()
export abstract class AbstractSelectionService<T> implements ISelectionService {
    private readonly _loadingRows = signal<ReadonlySet<FormGroup>>(new Set());
    protected readonly rowSelectionRequests = new Subject<{ row: FormGroup; selected: boolean }>();
    public readonly loadingRows = this._loadingRows.asReadonly();

    constructor(
        @Optional() @Inject(SELECTION_CONFIG) protected readonly selectionConfig: SelectionConfig<T> | undefined,
        protected readonly fm: KlesForm,
        protected readonly eventsService: EventsService,
    ) {}

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

    public isLoading(row: FormGroup): boolean {
        return this._loadingRows().has(row);
    }

    public onRowClick(event: MouseEvent, row: FormGroup): void {
        if (!this.selectionConfig?.selectOnRowClick || event.defaultPrevented || this.isInteractiveClick(event)) {
            return;
        }

        const control = row.controls[this.key];
        if (
            control?.disabled ||
            this.isLoading(row) ||
            this.selectionModel.state === KlesSelectionModelState.DISABLED ||
            this.selectionConfig.isDisabled?.(row)
        ) {
            return;
        }

        const selected = !this.selectionModel.isSelected(row);
        if (control) {
            control.setValue(selected);
        } else {
            this.rowSelectionRequests.next({ row, selected });
        }
    }

    protected emitSelectionEvents(
        changed: { added?: FormGroup[]; removed?: FormGroup[]; count: number },
        selectedCount = changed.count,
    ): void {
        const payload = this.selectionPayload(changed.added, changed.removed, selectedCount);
        this.eventsService.emit('selectionChange', payload);

        changed.added?.forEach((row) => this.eventsService.emit('rowSelect', this.rowPayload(row)));
        changed.removed?.forEach((row) => this.eventsService.emit('rowUnselect', this.rowPayload(row)));
    }

    protected emitBulkSelectionEvent(selected: boolean, selectedCount: number): void {
        this.eventsService.emit(selected ? 'selectAll' : 'unselectAll', this.selectionPayload(undefined, undefined, selectedCount));
    }

    protected startRowSelection(row: FormGroup): void {
        this._loadingRows.update((rows) => new Set([...rows, row]));
        row.controls[this.key]?.disable({ emitEvent: false });
    }

    protected stabilizeRowSelection(row: FormGroup, selected: boolean): void {
        row.controls[this.key]?.patchValue(selected, { emitEvent: false });
        this._loadingRows.update((rows) => {
            const next = new Set(rows);
            next.delete(row);
            return next;
        });

        if (this.selectionModel.state === KlesSelectionModelState.DISABLED || this.selectionConfig?.isDisabled?.(row)) {
            row.controls[this.key]?.disable({ emitEvent: false });
        } else {
            row.controls[this.key]?.enable({ emitEvent: false });
        }
    }

    protected emitSelectionError(
        error: unknown,
        requestedSelected: boolean,
        previousSelected: boolean,
        row?: FormGroup,
    ): void {
        const payload: SelectionErrorPayload<T> = {
            error,
            requestedSelected,
            previousSelected,
            ...(row ? this.rowPayload(row) : {}),
        };
        this.eventsService.emit('selectionError', payload);
    }

    private selectionPayload(addedRows?: FormGroup[], removedRows?: FormGroup[], selectedCount = 0): SelectionChangePayload<T> {
        const selectedRows = this.selectionModel.selected.items ?? [];

        return {
            selectedRows,
            selectedValues: selectedRows.map((row) => row.value),
            selectedRawValues: selectedRows.map((row) => row.getRawValue()),
            selectedCount,
            addedRows,
            removedRows,
            allSelected: selectedCount > 0 && selectedCount === this.linesTotal(),
        };
    }

    private rowPayload(row: FormGroup) {
        return {
            row,
            rowIndex: this.fm.getRows().controls.indexOf(row),
            value: row.value,
            rawValue: row.getRawValue(),
        };
    }

    protected abstract linesTotal(): number;

    private isInteractiveClick(event: MouseEvent): boolean {
        const currentTarget = event.currentTarget;
        if (currentTarget instanceof HTMLElement && currentTarget.classList.contains('kles-extra-row')) {
            return true;
        }

        const target = event.target;
        return (
            target instanceof Element &&
            target.closest(
                'button, a, input, select, textarea, [role="button"], [role="checkbox"], [role="link"], [contenteditable]:not([contenteditable="false"])',
            ) !== null
        );
    }
}

@Injectable()
export class SelectionService<T> extends AbstractSelectionService<T> {
    public selectionModel: KlesSelectionModel<FormGroup>;
    private readonly destroyRef = inject(DestroyRef);

    constructor(
        @Optional() @Inject(SELECTION_CONFIG) selectionConfig: SelectionConfig<T> | undefined,
        fm: KlesForm,
        private selectionLoaderService: SelectionLoaderService<T>,
        private scrollbarService: ScrollbarService,
        private loadingService: LoadingService,
        @Inject(DATASOURCE_SERVICE) private datasourceService: DatasourceService,
        @Inject(LINES_SERVICE) private linesService: ILinesService,
        eventsService: EventsService,
    ) {
        super(selectionConfig, fm, eventsService);
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

    protected linesTotal(): number {
        return this.linesService.total();
    }

    private setSelection() {
        this.linesService
            .loaded()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                // Build the initial model silently, then update the header once.
                this.fm.getRows().controls.forEach((group) => {
                    if (group.controls[this.selectionLoaderService.key]?.value === true) {
                        this.selectionModel.select(group, { emitEvent: false });
                    } else if (this.selectionConfig?.isSelected != undefined && this.selectionConfig.isSelected(group)) {
                        this.selectionModel.select(group, { emitEvent: false });
                        group.controls[this.selectionLoaderService.key]?.patchValue(true, { emitEvent: false });
                    } else {
                        this.selectionModel.deselect(group, { emitEvent: false });
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
                    const requestedSelected = !!value;
                    const previousSelected = this.areAllFilteredRowsSelected();
                    return this.selectionLoaderService
                        .selectAll(requestedSelected, this.fm.getHeader().getRawValue())
                        .pipe(map((response) => ({ response, requestedSelected, previousSelected })));
                }),
            )
            .subscribe(({ response, requestedSelected, previousSelected }) => {
                if (response.loading) {
                    this.scrollbarService.toTop('instant');
                    this.loadingService.start();
                    return;
                }

                this.loadingService.stop();
                if (!response.success || response.selected === undefined) {
                    this.updateHeader();
                    this.emitSelectionError(
                        response.error ?? new Error('The bulk selection response is invalid.'),
                        requestedSelected,
                        previousSelected,
                    );
                    return;
                }

                if (response.selected) {
                    if (this.selectionModel.isMultipleSelection()) {
                        this.selectionModel.select(
                            this.datasourceService.datasource.filteredData?.filter((g) => g.controls[this.selectionLoaderService.key]?.enabled) ??
                                [],
                        );
                    } else {
                        const row = this.datasourceService.datasource.filteredData?.filter(
                            (g) => g.controls[this.selectionLoaderService.key]?.enabled,
                        )[0];
                        if (row) {
                            this.selectionModel.select(row);
                        }
                    }
                } else {
                    this.selectionModel.deselect(
                        this.datasourceService.datasource.filteredData?.filter((g) => g.controls[this.selectionLoaderService.key]?.enabled),
                    );
                }
                this.emitBulkSelectionEvent(response.selected, this.selectionModel.selected.count);
            });
    }

    private areAllFilteredRowsSelected(): boolean {
        const rows = this.datasourceService.datasource.filteredData.filter(
            (group) => group.controls[this.selectionLoaderService.key]?.enabled,
        );
        return rows.length > 0 && rows.every((group) => this.selectionModel.isSelected(group));
    }

    private listenRowSelection(): void {
        this.datasourceService.datasource
            .connect()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                auditTime(0),
                switchMap((rows) => {
                    return merge(
                        this.rowSelectionRequests,
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
                    const previousSelected = this.selectionModel.isSelected(row);
                    return this.selectionLoaderService.select(row, selected).pipe(
                        map((response) => {
                            return {
                                row,
                                selected,
                                previousSelected,
                                response,
                            };
                        }),
                    );
                }),
            )

            .subscribe(({ row, selected, previousSelected, response }) => {
                if (response.loading) {
                    this.startRowSelection(row);
                    return;
                }

                if (!response.success || response.selected === undefined) {
                    this.stabilizeRowSelection(row, previousSelected);
                    this.emitSelectionError(
                        response.error ?? new Error('The row selection response is invalid.'),
                        selected,
                        previousSelected,
                        row,
                    );
                    return;
                }

                this.stabilizeRowSelection(row, response.selected);
                if (response.selected) {
                    this.selectionModel.select(row);
                } else {
                    this.selectionModel.deselect(row);
                }
            });
    }

    private listenSelection(): void {
        this.selectionModel.changed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((changed) => {
            changed.removed?.forEach((group: FormGroup) => {
                group.controls[this.selectionLoaderService.key]?.patchValue(false, { emitEvent: false });
            });

            changed.added?.forEach((group: FormGroup) => {
                group.controls[this.selectionLoaderService.key]?.patchValue(true, { emitEvent: false });
            });
            this.fm.getRows().updateValueAndValidity({ emitEvent: false });
            this.updateHeader();
            this.emitSelectionEvents(changed);
        });

        this.selectionModel.stateChanged.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
            if (state === KlesSelectionModelState.ENABLED) {
                this.fm.getHeader().controls[this.key]?.enable({ emitEvent: false });
                this.fm.getRows().controls.forEach((group) => {
                    if (!this.isLoading(group) && !this.selectionConfig?.isDisabled?.(group)) {
                        group.controls[this.key]?.enable({ emitEvent: false });
                    }
                });
            } else {
                this.fm.getHeader().controls[this.key]?.disable({ emitEvent: false });
                this.fm.getRows().controls.forEach((group) => {
                    group.controls[this.key]?.disable({ emitEvent: false });
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
    public selectionModel: KlesSelectionModel<FormGroup>;

    private readonly destroyRef = inject(DestroyRef);
    private _count = signal(0);

    constructor(
        @Optional() @Inject(SELECTION_CONFIG) selectionConfig: SelectionConfig<T> | undefined,
        fm: KlesForm,
        private selectionLoaderService: SelectionLoaderService<T>,
        private scrollbarService: ScrollbarService,
        private loadingService: LoadingService,
        @Inject(DATASOURCE_SERVICE) private datasourceService: DatasourceService,
        @Inject(LINES_SERVICE) private linesService: ILinesService,
        @Optional() private filterStore: FilterStore | null,
        eventsService: EventsService,
    ) {
        super(selectionConfig, fm, eventsService);

        this.selectionModel = new KlesSelectionModel<FormGroup>(selectionConfig?.selectionMode);
    }

    public register(): void {
        this.listenSelection();
        this.setSelection();
        this.listenHeaderSelection();
        this.listenRowSelection();
    }

    public count(): Signal<number> {
        return this._count.asReadonly();
    }

    public disable(): void {
        this.selectionModel.disable();
    }

    public enable(): void {
        this.selectionModel.enable();
    }

    protected linesTotal(): number {
        return this.linesService.total();
    }

    private listenHeaderSelection(): void {
        this.fm
            .getHeader()
            .controls[this.key]?.valueChanges.pipe(
                takeUntilDestroyed(this.destroyRef),
                switchMap((value) => {
                    const requestedSelected = !!value;
                    const previousSelected = this._count() > 0 && this._count() === this.linesService.total();
                    return this.selectionLoaderService
                        .selectAll(requestedSelected, this.fm.getHeader().getRawValue())
                        .pipe(map((response) => ({ response, requestedSelected, previousSelected })));
                }),
            )
            .subscribe(({ response, requestedSelected, previousSelected }) => {
                if (response.loading) {
                    this.scrollbarService.toTop('instant');
                    this.loadingService.start();
                    return;
                }

                this.loadingService.stop();
                if (!response.success || response.selected === undefined) {
                    this.updateHeader();
                    this.emitSelectionError(
                        response.error ?? new Error('The bulk selection response is invalid.'),
                        requestedSelected,
                        previousSelected,
                    );
                    return;
                }

                this._count.set(response.count ?? 0);
                const rows = this.fm.getRows().controls.filter((group) => group.controls[this.selectionLoaderService.key]?.enabled);

                if (response.selected) {
                    if (this.selectionModel.isMultipleSelection()) {
                        this.selectionModel.select(rows);
                    } else {
                        const row = rows[0];

                        if (row) {
                            this.selectionModel.select(row);
                        }
                    }
                } else {
                    this.selectionModel.deselect(rows);
                }

                this.fm.getRows().updateValueAndValidity({
                    emitEvent: false,
                });
                this.emitBulkSelectionEvent(response.selected, this._count());
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
                        this.rowSelectionRequests,
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
                    const previousSelected = this.selectionModel.isSelected(row);
                    return this.selectionLoaderService.select(row, selected, filters).pipe(
                        map((response) => {
                            return {
                                row,
                                selected,
                                previousSelected,
                                response,
                            };
                        }),
                    );
                }),
            )
            .subscribe(({ row, selected, previousSelected, response }) => {
                if (response.loading) {
                    this.startRowSelection(row);
                    return;
                }

                if (!response.success || response.selected === undefined) {
                    this.stabilizeRowSelection(row, previousSelected);
                    this.emitSelectionError(
                        response.error ?? new Error('The row selection response is invalid.'),
                        selected,
                        previousSelected,
                        row,
                    );
                    return;
                }

                this._count.set(response.count ?? 0);
                this.stabilizeRowSelection(row, response.selected);

                if (response.selected) {
                    this.selectionModel.select(row);
                } else {
                    this.selectionModel.deselect(row);
                }

                this.updateHeader(this._count());
            });
    }

    private listenSelection(): void {
        this.selectionModel.changed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((changed) => {
            changed.removed?.forEach((group) => {
                group.controls[this.selectionLoaderService.key]?.patchValue(false, { emitEvent: false });
            });

            changed.added?.forEach((group) => {
                group.controls[this.selectionLoaderService.key]?.patchValue(true, { emitEvent: false });
            });

            this.fm.getRows().updateValueAndValidity({
                emitEvent: false,
            });
            this.emitSelectionEvents(changed, this._count());
        });

        this.selectionModel.stateChanged.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
            if (state === KlesSelectionModelState.ENABLED) {
                this.fm.getHeader().controls[this.key]?.enable({ emitEvent: false });

                this.fm.getRows().controls.forEach((group) => {
                    if (!this.isLoading(group) && !this.selectionConfig?.isDisabled?.(group)) {
                        group.controls[this.key]?.enable({
                            emitEvent: false,
                        });
                    }
                });

                return;
            }

            this.fm.getHeader().controls[this.key]?.disable({ emitEvent: false });

            this.fm.getRows().controls.forEach((group) => {
                group.controls[this.key]?.disable({
                    emitEvent: false,
                });
            });
        });
    }

    private setSelection(): void {
        this.linesService
            .loaded()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                const selectedRows = this.fm.getRows().controls.filter((group) => {
                    const selected =
                        group.controls[this.selectionLoaderService.key]?.value === true || this.selectionConfig?.isSelected?.(group) === true;

                    if (selected) {
                        group.controls[this.selectionLoaderService.key]?.patchValue(true, {
                            emitEvent: false,
                        });
                    }

                    if (this.selectionConfig?.isDisabled?.(group)) {
                        group.controls[this.selectionLoaderService.key]?.disable({
                            emitEvent: false,
                        });
                    }

                    return selected;
                });

                this.selectionModel.reset(selectedRows, {
                    emitEvent: false,
                });

                this.updateHeader(this._count());
            });
    }

    private updateHeader(count = this._count()): void {
        const total = this.linesService.total();

        this.fm
            .getUiHeader()
            .get(this.selectionLoaderService.key)
            ?.patchValue({
                indeterminate: count > 0 && count < total,
            });

        this.fm.getHeader().controls[this.selectionLoaderService.key]?.patchValue(count > 0 && count === total, {
            emitEvent: false,
        });
    }
}
