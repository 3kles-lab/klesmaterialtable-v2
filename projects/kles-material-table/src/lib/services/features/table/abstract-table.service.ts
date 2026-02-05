import { DestroyRef, Inject, inject, Injectable, Optional, signal, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormGroup } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import * as _ from 'lodash';
import { auditTime, concatMap, distinctUntilChanged, filter, map, merge, pairwise, startWith, switchMap } from 'rxjs';
import { IKlesDataSource } from '../../../core/datasource/datasource.interface';
import { FilterStore } from '../../store/filter-store.service';
import { PaginatorStore } from '../../store/paginator-store.service';
import { SortStore } from '../../store/sort-store.service';
import { ColumnsService } from '../columns/columns.service';
import { ILinesLoader } from '../lines/lines-loader.service';
import { ScrollbarService } from '../scrollbar/scrollbar.service';
import { SelectionLoaderService } from '../selection/selection-loader.service';
import { KlesForm } from './form';
import { RowFormFactory } from './row-factory.service';
import { LoadingService } from '../loading/loading.service';
import { HeaderService } from '../header/header.service';
import { DATASOURCE_SERVICE, LINES_SERVICE, LINESLOADER_SERVICE } from '../../../token';
import { IDatasourceService } from '../datasource/datasource.service';
import { PaginatorService } from '../paginator/paginator.service';
import { ILinesService } from '../lines/lines.service';

// export interface ITableService {
//     readonly form: FormGroup<{
//         header: FormGroup<{}>;
//         rows: FormArray<FormGroup<any>>;
//         footer: FormGroup<{}>;
//     }>;
//     refresh();
//     trackBy: (_: number, row: FormGroup) => any;
// }

// @Injectable()
// export abstract class AbstractTableService<TDs extends IKlesDataSource> implements ITableService {
//     //TODO faire 1 tableservice (cerveau) qui est une composition de service
//     protected readonly destroyRef = inject(DestroyRef);

//     public form: FormGroup<{
//         header: FormGroup<{}>;
//         rows: FormArray<FormGroup<any>>;
//         footer: FormGroup<{}>;
//     }>;

//     trackBy = (_: number, row: FormGroup) => row.get('_id')?.value ?? row;

//     constructor(
//         protected columnsService: ColumnsService,
//         @Inject(DATASOURCE_SERVICE) protected datasourceService: IDatasourceService,
//         protected fm: KlesForm,
//         protected headerService: HeaderService,
//         protected loadingService: LoadingService,
//         protected rowFactory: RowFormFactory,
//         @Inject(LINES_SERVICE) protected linesService: ILinesService,
//         @Inject(LINESLOADER_SERVICE) protected loader: ILinesLoader<any>,
//         protected scrollbarService: ScrollbarService,
//         protected paginatorService: PaginatorService,
//         protected selectionLoaderService: SelectionLoaderService<any>,
//         @Optional() protected paginatorStore: PaginatorStore | null,
//         @Optional() protected sortStore: SortStore | null,
//         @Optional() protected filterStore: FilterStore | null,
//     ) {
//         this.fm.init();
//         this.datasourceService.register();
//         this.headerService.register();
//         this.linesService.register();
//         this.form = this.fm.form;

//         this.listenHeader(); // todo a suppr
//         this.listenRows(); // todo faire un lines service pour gérer les events sur les lignes
      
//     }

//     // --------- ITableService ---------

//     refresh() {
//         this.loader.refresh();
//     }

//     // --------- commun ---------

//     protected listenRows(): void {
//         // this.dataSource
//         //     .connect()
//         //     .pipe(
//         //         takeUntilDestroyed(this.destroyRef),
//         //         auditTime(0),
//         //         switchMap((rows) => merge(...rows.map((row) => row.valueChanges.pipe(map(() => row.getRawValue()))))),
//         //     )
//         //     .subscribe((values) => console.log(values));
//         // this.dataSource
//         //     .connect()
//         //     .pipe(
//         //         takeUntilDestroyed(this.destroyRef),
//         //         auditTime(0),
//         //         switchMap((rows) => {
//         //             return merge(
//         //                 ...rows
//         //                     .map((row) => {
//         //                         return row.controls[this.selectionLoaderService.key]?.valueChanges.pipe(
//         //                             map((value) => {
//         //                                 return { row, selected: !!value };
//         //                             }),
//         //                         );
//         //                     })
//         //                     .filter(Boolean),
//         //             );
//         //         }),
//         //         concatMap(({ row, selected }) => {
//         //             return this.selectionLoaderService.select(row, selected).pipe(
//         //                 map((response) => {
//         //                     return {
//         //                         row,
//         //                         response,
//         //                     };
//         //                 }),
//         //             );
//         //         }),
//         //     )
//         //     .subscribe(({ row, response }) => {
//         //         if (response.loading) {
//         //             //mettre la ligne avec un spinner
//         //         } else {
//         //             //enlever la ligne en spinner
//         //             this.afterSelect(row, response.selected, response.count, response.footer); //hook selection
//         //         }
//         //     });
//     }

   

//     protected listenHeader() {
//         // this.fm
//         //     .getHeader()
//         //     .valueChanges.pipe(
//         //         takeUntilDestroyed(this.destroyRef),
//         //         startWith(this.fm.getHeader().getRawValue()),
//         //         distinctUntilChanged(),
//         //         pairwise(),
//         //         filter(([prev, curr]) => {
//         //             return Object.keys(curr).some((key) => key !== this.selectionLoaderService.key && prev[key] !== curr[key]);
//         //         }),
//         //     )
//         //     .subscribe(() => this.onHeaderChanged());
//         // this.fm
//         //     .getHeader()
//         //     .controls[this.selectionLoaderService.key]?.valueChanges.pipe(
//         //         takeUntilDestroyed(this.destroyRef),
//         //         switchMap((value) => {
//         //             return this.selectionLoaderService.selectAll(!!value, this.fm.getHeader().getRawValue());
//         //         }),
//         //     )
//         //     .subscribe((response) => {
//         //         if (response.loading) {
//         //             this.scrollbarService.toTop('instant');
//         //             this.loadingService.start();
//         //             return;
//         //         } else {
//         //             this.loadingService.stop();
//         //             this.afterSelectAll(response.selected, response.footer);
//         //         }
//         //     });
//     }

//     protected afterLoad(_response: { total?: number }) {}
//     protected afterSelect(row: FormGroup, selected: boolean, count?: number, footer?: any) {}
//     protected afterSelectAll(selected: boolean, footer?: any) {}
//     protected onPaginatorChanged(_event: PageEvent) {}
//     protected onSortChanged(_event: Sort) {}
//     protected abstract get total(): number;
// }
