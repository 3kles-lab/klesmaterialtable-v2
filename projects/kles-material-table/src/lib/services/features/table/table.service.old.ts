// import { DestroyRef, Inject, inject, Injectable, Optional } from '@angular/core';
// import { FilterStore } from '../../store/filter-store.service';
// import { PaginatorStore } from '../../store/paginator-store.service';
// import { SortStore } from '../../store/sort-store.service';
// import { ColumnsService } from '../columns/columns.service';
// import { FilterService } from '../filter/filter.service';
// import { LinesLoaderLazyService, LinesLoaderService } from '../lines/lines-loader.service';
// import { ScrollbarService } from '../scrollbar/scrollbar.service';
// import { SortService } from '../sort/sort.service';
// import { AbstractTableService } from './abstract-table.service';
// import { KlesDataSource, KlesLazyDataSource } from './datasource';
// import { KlesForm } from './form';
// import { RowFormFactory } from './row-factory.service';
// import { FormGroup } from '@angular/forms';
// import { KlesSelectionModel } from '../../../core/selection/selection-model';
// import { SelectionLoaderService } from '../selection/selection-loader.service';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { LoadingService } from '../loading/loading.service';
// import { HeaderService } from '../header/header.service';
// import { IDatasourceService } from '../datasource/datasource.service';
// import { DATASOURCE_SERVICE, LINES_SERVICE, LINESLOADER_SERVICE, SELECTION_SERVICE } from '../../../token';
// import { PaginatorService } from '../paginator/paginator.service';
// import { ISelectionService } from '../selection/selection.service';
// import { ILinesService } from '../lines/lines.service';

// @Injectable()
// export class TableService extends AbstractTableService<KlesDataSource> {
//     private selectionModel: KlesSelectionModel<FormGroup>;
//     protected readonly destroyRef = inject(DestroyRef);

//     constructor(
//         columnsService: ColumnsService,
//         @Inject(DATASOURCE_SERVICE) datasourceService: IDatasourceService,
//         fm: KlesForm,
//         headerService: HeaderService,
//         loadingService: LoadingService,
//         rowFactory: RowFormFactory,
//         @Inject(LINES_SERVICE) linesService: ILinesService,
//         @Inject(LINESLOADER_SERVICE) loader: LinesLoaderService<any, any>,
//         scrollbarService: ScrollbarService,
//         paginatorService: PaginatorService,
//         @Inject(SELECTION_SERVICE) selectionService: ISelectionService,
//         selectionLoaderService: SelectionLoaderService<any>,
//         @Optional() paginatorStore: PaginatorStore | null,
//         @Optional() sortStore: SortStore | null,
//         @Optional() filterStore: FilterStore | null,
//     ) {
//         super(
//             columnsService,
//             datasourceService,
//             fm,
//             headerService,
//             loadingService,
//             rowFactory,
//             linesService,
//             loader,
//             scrollbarService,
//             paginatorService,
//             selectionLoaderService,
//             paginatorStore,
//             sortStore,
//             filterStore,
//         );
//         this.selectionModel = new KlesSelectionModel<FormGroup>(selectionService.selectionMode);
//         this.listenSelection();
//     }


//     protected afterSelectAll(selected: boolean, footer?: any) {
//         // if (selected) {
//         //     if (this.selectionModel.isMultipleSelection()) {
//         //         this.selectionModel.select(this.dataSource.filteredData);
//         //     } else {
//         //         this.selectionModel.select(this.dataSource.filteredData?.[0] ?? []);
//         //     }
//         // } else {
//         //     this.selectionModel.deselect(this.dataSource.filteredData);
//         // }
//     }

//     protected afterSelect(row: FormGroup, selected: boolean, footer?: any): void {
//         if (selected) {
//             this.selectionModel.select(row);
//         } else {
//             this.selectionModel.deselect(row);
//         }
//     }

//     protected get total(): number {
//         return this.fm.getRows().length;
//     }

//     private listenSelection() {
//         this.selectionModel.changed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((changed) => {
//             changed.removed.forEach((group: FormGroup) => {
//                 group.controls[this.selectionLoaderService.key].patchValue(false, { emitEvent: false });
//             });

//             changed.added.forEach((group: FormGroup) => {
//                 group.controls[this.selectionLoaderService.key].patchValue(true, { emitEvent: false });
//             });

//             // if (this.selectionModel.hasValue()) {
//             //     if (this._dataSource.filteredData.length === this.selectionModel.selected.count) {
//             //         this.columnsService.setHeaderCellIndeterminate(this.selectionLoaderService.key, false);
//             //         this.fm.getHeader().controls[this.selectionLoaderService.key]?.patchValue(true, { emitEvent: false });
//             //     } else {
//             //         this.columnsService.setHeaderCellIndeterminate(this.selectionLoaderService.key, true);
//             //         this.fm.getHeader().controls[this.selectionLoaderService.key]?.patchValue(false, { emitEvent: false });
//             //     }
//             // } else {
//             //     this.columnsService.setHeaderCellIndeterminate(this.selectionLoaderService.key, false);
//             //     this.fm.getHeader().controls[this.selectionLoaderService.key]?.patchValue(false, { emitEvent: false });
//             // }

//             this.fm.getRows().updateValueAndValidity({ emitEvent: false });
//         });
//     }
// }

// @Injectable()
// export class TableLazyService extends AbstractTableService<KlesLazyDataSource> {
//     private _total = 0;

//     constructor(
//         columnsService: ColumnsService,
//         @Inject(DATASOURCE_SERVICE) datasourceService: IDatasourceService,
//         fm: KlesForm,
//         headerService: HeaderService,
//         loadingService: LoadingService,
//         rowFactory: RowFormFactory,
//         @Inject(LINES_SERVICE) linesService: ILinesService,
//         @Inject(LINESLOADER_SERVICE) loader: LinesLoaderLazyService<any, any>,
//         scrollbarService: ScrollbarService,
//         paginatorService: PaginatorService,
//         selectionLoaderService: SelectionLoaderService<any>,
//         @Optional() paginatorStore: PaginatorStore | null,
//         @Optional() sortStore: SortStore | null,
//         @Optional() filterStore: FilterStore | null,
//     ) {
//         super(
//             columnsService,
//             datasourceService,
//             fm,
//             headerService,
//             loadingService,
//             rowFactory,
//             linesService,
//             loader,
//             scrollbarService,
//             paginatorService,
//             selectionLoaderService,
//             paginatorStore,
//             sortStore,
//             filterStore,
//         );
//     }


//     protected afterSelectAll(selected: boolean, footer?: any) {
//         this.fm.getRows().controls.forEach((group) => {
//             group.controls[this.selectionLoaderService.key].patchValue(selected, { emitEvent: false });
//         });
//         this.fm.getRows().updateValueAndValidity({ emitEvent: false });

//         if (footer) {
//             this.fm.getFooter().patchValue(footer, { emitEvent: false });
//         }
//     }

//     protected afterSelect(row: FormGroup, selected: boolean, count: number, footer?: any): void {
//         this.columnsService.setHeaderCellIndeterminate(this.selectionLoaderService.key, count > 0 && this.total > count);

//         if (footer) {
//             this.fm.getFooter().patchValue(footer, { emitEvent: false });
//         }
//     }

//     protected get total(): number {
//         return this._total;
//     }
// }
