import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from './modules/material.module';
import {
    KlesFormDynamicHeaderFilterComponent,
    KlesMaterialTableModule,
    KlesTableApi,
    KlesTableConfig,
    linesLazyLoader,
    linesLoader,
    selectionConfig,
} from 'kles-material-table';
import { BehaviorSubject, delay, of } from 'rxjs';
import { KlesFormCheckboxComponent, KlesFormInputComponent, KlesFormTextComponent } from '@3kles/kles-material-dynamicforms';
import { FormControlStatus } from '@angular/forms';
import { CommonModule } from '@angular/common';

// import { ResourceLineLoaderParams } from 'projects/kles-material-table/src/lib/interfaces/resource-loader.interface';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    providers: [],
    standalone: true,
    imports: [MaterialModule, KlesMaterialTableModule, CommonModule],
})
export class AppComponent implements OnInit, AfterViewInit {
    toto = new BehaviorSubject({ foo: 123, toto: 'aaaa' });

    data = Array.from(Array(500).keys()).map((key) => {
        return {
            _id: `${key}`,
            name: key,
            test: `${key}`,
            aa: 'bbb',
            c: '1565',
            d: '87887',
            e: 'ceci est une phrase',
        };
    });

    config: KlesTableConfig = {
        columns: [
            {
                columnDef: '#select',
                sortable: false,
                headerCell: {
                    component: KlesFormCheckboxComponent,
                },
                cell: {
                    component: KlesFormCheckboxComponent,
                },
            },
            {
                columnDef: '_id',
                sortable: true,
                // filterable: true,

                minWidth: '500%',
                headerCell: {
                    label: '_id',
                    component: KlesFormDynamicHeaderFilterComponent,
                },
                cell: {
                    component: KlesFormTextComponent,
                    style: {
                        ngStyle: (value: string, status: FormControlStatus, row: Record<string, any>, rowStatus: FormControlStatus) => {
                            return {
                                background: row.name === 'remy' ? 'blue' : 'green',
                                'font-weight': 1000,
                                color: 'white',
                            };
                        },
                    },
                },
            },
            {
                columnDef: 'name',
                sortable: true,
                filterable: true,
                visible: true,
                // align: AlignCell.LEFT,
                // maxWidth: '350px',
                // minWidth: '350px',
                // width: '950px',
                resizable: true,

                headerCell: {
                    label: 'Name',
                    component: KlesFormDynamicHeaderFilterComponent,
                    // filterComponent: KlesFormInputComponent,
                    style: {
                        ngStyle: {
                            background: 'blue',
                        },
                    },
                    // style: {
                    //     ngStyle: (value: string, status: FormControlStatus, row: Record<string, any>, rowStatus: FormControlStatus) => {
                    //         return {
                    //             background: 'white',
                    //         };
                    //     },
                    // },
                },
                cell: {
                    component: KlesFormInputComponent,
                    style: {
                        ngStyle: (value: number, status: FormControlStatus, row: Record<string, any>, rowStatus: FormControlStatus) => {
                            return {
                                background: value === 1 ? 'blue' : 'red',
                            };
                        },
                    },
                },
            },
            {
                columnDef: 'aa',
                sortable: true,
                // width: '800px',
                filterable: true,
                visible: true,
                headerCell: {
                    label: 'aa',
                    component: KlesFormDynamicHeaderFilterComponent,
                    filterComponent: KlesFormInputComponent,
                },
                cell: {
                    component: KlesFormInputComponent,
                },
            },
            {
                columnDef: 'c',
                sortable: true,

                filterable: true,
                visible: true,
                width: '800px',

                headerCell: {
                    label: 'C',
                    component: KlesFormDynamicHeaderFilterComponent,
                    filterComponent: KlesFormInputComponent,
                },
                cell: {
                    component: KlesFormTextComponent,
                },
            },
            {
                columnDef: 'd',
                sortable: true,

                filterable: true,
                visible: true,
                headerCell: {
                    label: 'D',
                    component: KlesFormDynamicHeaderFilterComponent,
                    filterComponent: KlesFormInputComponent,
                },
                cell: {
                    component: KlesFormTextComponent,
                },
            },
            {
                columnDef: 'e',
                sortable: true,

                filterable: true,
                visible: true,
                headerCell: {
                    label: 'E',
                    component: KlesFormDynamicHeaderFilterComponent,
                    filterComponent: KlesFormInputComponent,
                },
                cell: {
                    component: KlesFormTextComponent,
                },
            },
            {
                columnDef: 'test',
                sortable: true,
                // width: '800px',
                // stickyEnd:true,
                headerCell: {
                    label: 'Test',
                    component: KlesFormDynamicHeaderFilterComponent,
                },
                cell: {
                    component: KlesFormTextComponent,
                },
            },
        ],
        paginator: true,

        lines: linesLoader({
            params: () => this.toto,
            loader: (params) => {
                return of({
                    items: this.data,
                }).pipe(delay(200));
            },
        }),
        dragDropRows: {
            enable: true,
        },
        selection: selectionConfig({
            selectionMode: true,
            // select: (params, row, selected, filters) => {
            //     return of({ indeterminate: true, selected: false }).pipe(delay(1000));
            // },
            // selectAll: (params, selected, filters) => {
            //     return of({ indeterminate: true, selected: false }).pipe(delay(1000));
            // },
        }),
        // sortConfig: {
        //     active: 'name',
        //     direction: 'desc',
        // },
    };

    lazyConfig: KlesTableConfig = {
        columns: [
            {
                columnDef: 'bb',
                sortable: false,
                headerCell: {
                    component: KlesFormCheckboxComponent,
                },
                cell: {
                    component: KlesFormCheckboxComponent,
                },
            },
            {
                columnDef: 'name',
                sortable: true,
                headerCell: {
                    label: 'Name',
                    component: KlesFormDynamicHeaderFilterComponent,
                },
                cell: {
                    component: KlesFormTextComponent,
                },
            },
            {
                columnDef: 'test',
                headerCell: {
                    label: 'Test',
                    component: KlesFormDynamicHeaderFilterComponent,
                    filterComponent: KlesFormInputComponent,
                },
                cell: {
                    component: KlesFormInputComponent,
                },
            },
        ],
        lazy: true,
        // infinite:true,
        paginator: true,
        lines: linesLazyLoader({
            params: () => of({ _id: 'aaaaa' }),
            loader: (params, query) => {
                console.log(query);
                return of({
                    items: this.data.slice(
                        query.pagination?.page * query.pagination?.perPage || 0,
                        query.pagination?.page * query.pagination?.perPage + query.pagination?.perPage || 50,
                    ),
                    total: this.data.length,
                }).pipe(delay(500));
            },
        }),
        selection: selectionConfig({
            key: 'bb',
            params: () => {
                return of({ toto: 1 });
            },
            selectAll: (params, selected, filters) => {
                return of({ selected: true }).pipe(delay(100));
            },
            select: (params, row, selected, filters) => {
                return of({ selected: selected, count: selected ? 1 : 0 });
            },
        }),
        dragDropRows: {
            enable: true,
        },
    };

    @ViewChild('table') klesTable: KlesTableApi;
    @ViewChild('lazyTable') klesLazyTable: KlesTableApi;

    constructor() {}

    ngOnInit() {}

    ngAfterViewInit(): void {
        //sort api
        // this.klesTable.sort.sortChange().subscribe((value) => console.log(value))
    }

    add() {
        /** */
        // table api
        // this.klesTable.refresh()
        /** */
        // scrollbar api
        // this.klesTable.scrollbar.toTop('smooth')
        // this.klesTable.scrollbar.toLeft()
        // this.klesTable.scrollbar.toBottom();
        // this.klesTable.scrollbar.to(50, 50);
        // this.klesTable.scrollbar.toRight()
        /** */
        // column api
        // this.klesTable.column.toggleVisible('name')
        // this.klesTable.column.setVisible('name', false)
        // this.klesTable.column.changeWidth('name', { minWidth: '500px' });
        // this.klesTable.column.setResizable('name', false);
        // this.klesTable.column.toggleResizable('name');
        // this.klesTable.column.setColumnPosition('name', 5);
        // this.klesTable.column.setSticky('test', { stickyEnd: true });
        // this.klesTable.column.setSticky('name', { sticky: true });
        // console.log(this.klesTable.column.columns())
        /** */
        // pagination api
        // this.klesTable.pagination?.setPageIndex(2);
        // this.klesTable.pagination?.setPageSize(10);
        // this.klesTable.pagination?.disable();
        // this.klesTable.pagination?.setPageSizeOptions([7, 12]);
        // this.klesTable.pagination?.lastPage()
        // this.klesTable.pagination?.firstPage()
        /** */
        // sort api
        // this.klesTable.sort.setDirection('asc')
        // this.klesTable.sort.setActive('name')
        /** */
        // loading api
        // this.klesTable.loading.start()
        // this.klesTable.loading.stop()
    }
}
