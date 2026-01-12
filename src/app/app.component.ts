import { AfterViewInit, Component, OnInit, signal, Signal, ViewChild } from '@angular/core';
import { MaterialModule } from './modules/material.module';
import {
    AlignCell,
    KlesFormDynamicHeaderFilterComponent,
    KlesMaterialTableModule,
    KlesTableComponent,
    KlesTableConfig,
    KlesTableService,
    linesLazyLoader,
    linesLoader,
} from 'kles-material-table';
import { BehaviorSubject, delay, Observable, of } from 'rxjs';
import { KlesFormInputComponent, KlesFormTextComponent } from '@3kles/kles-material-dynamicforms';
import { FormControlStatus, FormGroup } from '@angular/forms';

// import { ResourceLineLoaderParams } from 'projects/kles-material-table/src/lib/interfaces/resource-loader.interface';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    providers: [],
    standalone: true,
    imports: [MaterialModule, KlesMaterialTableModule],
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
                columnDef: '_id',
                sortable: true,
                filterable: true,
                width: '500px',
                minWidth: '250px',
                maxWidth: '500px',
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
                    filterComponent: KlesFormInputComponent,
                    // style: {
                    //     ngStyle: (value: string, status: FormControlStatus, row: Record<string, any>, rowStatus: FormControlStatus) => {
                    //         return {
                    //             background: 'white',
                    //         };
                    //     },
                    // },
                },
                cell: {
                    component: KlesFormTextComponent,
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
                }).pipe(delay(1000));
            },
        }),
        dragDropRows: {
            enable: true,
        },
        // sortConfig: {
        //     active: 'name',
        //     direction: 'desc',
        // },
    };

    lazyConfig: KlesTableConfig = {
        columns: [
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
                    component: KlesFormTextComponent,
                },
            },
        ],
        lazy: true,
        // infinite:true,
        paginator: true,
        lines: linesLazyLoader({
            params: () => this.toto,
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
        dragDropRows: {
            enable: true,
        },
    };

    @ViewChild('table') klesTable: KlesTableComponent;
    @ViewChild('lazyTable') klesLazyTable: KlesTableComponent;

    constructor() {}

    ngOnInit() {}

    ngAfterViewInit(): void {}

    add() {
        console.log('add');

        this.klesTable.tableService.scrollToTop()

        // this.klesTable.tableService.addRecord({ name: 'blabla', toto: 'dfsssdf' }, { index: 1 });
        // this.klesTable.tableService.toggleColumnVisibility('name');
    }
}
