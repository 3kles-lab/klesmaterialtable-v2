import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from './modules/material.module';
import {
    AlignCell,
    KlesMaterialTableModule,
    KlesTableApi,
    KlesTableConfig,
    linesLazyLoader,
    linesLoader,
    selectionConfig,
    Span,
} from 'kles-material-table';
import { BehaviorSubject, delay, of, throwError } from 'rxjs';
import {
    ArrayUiState,
    KlesFormCheckboxComponent,
    KlesFormInputComponent,
    KlesFormSelectComponent,
    KlesFormTextComponent,
} from '@3kles/kles-material-dynamicforms';
import { FormControlStatus, FormGroup, Validators } from '@angular/forms';
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
            '#select': key % 2 === 0,
            _id: `${key}`,
            name: key,
            test: { a: `${key}` },
            aa: 'ligne 1 expand key:' + key,
            c: '1565',
            d: '87887',
            e: 'ceci est une phrase',
            ddd: 'ligne 2 expand key: ' + key,
            eee: 'ceci est une phrase dans une extra row qui prend le maximum de place dispo',
        };
    });

    config: KlesTableConfig = {
        columnSeparator: false/*{
            width: '4px',
            style: 'double',
            color: '#c4c6d0',
            header: false,
            body: true,
            footer: false,
        }*/,
        columns: [
            {
                columnDef: '#select',
                sortable: false,
                sticky: true,
                // canExpand: true,
                headerCell: {
                    field: {
                        component: KlesFormCheckboxComponent,
                    },
                },
                cell: {
                    field: {
                        component: KlesFormCheckboxComponent,
                    },
                },
            },
            {
                columnDef: '_id',
                sortable: true,
                resizable: true,
                visible: true,
                // filterable: true,
                sortArrowPosition: 'before',

                // minWidth: '500%',
                headerCell: {
                    label: '_id',
                    tooltip: 'aaaa',
                    filterClearable: true,

                    // field: {
                    //     component: KlesFormInputComponent,
                    //     label: 'toto'
                    // },
                },
                cell: {
                    field: {
                        component: KlesFormTextComponent,
                    },

                    // style: {
                    //     ngStyle: (value: string, status: FormControlStatus, row: Record<string, any>, rowStatus: FormControlStatus) => {
                    //         return {
                    //             background: row.name === 'remy' ? 'blue' : 'green',
                    //             'font-weight': 1000,
                    //             color: 'white',
                    //         };
                    //     },
                    // },
                },
                footerCell: {
                    field: { component: KlesFormTextComponent, value: 'ceci est un footer' },
                    // style: {
                    //     ngStyle: (value: string, status: FormControlStatus, row: Record<string, any>, rowStatus: FormControlStatus) => {
                    //         return {
                    //             background: 'yellow',
                    //             'font-weight': 1000,
                    //             color: 'black',
                    //         };
                    //     },
                    // },
                },
            },
            {
                columnDef: 'name',
                sortable: true,
                filterable: true,
                visible: true,
                align: AlignCell.RIGHT,
                // maxWidth: '350px',
                // minWidth: '350px',
                // width: '950px',
                resizable: true,

                headerCell: {
                    label: 'Name',
                    field: {
                        component: KlesFormInputComponent,
                        // clearable: true,
                        // label: 'toto',
                    },

                    style: {
                        // ngStyle: {
                        //     background: 'blue',
                        // },
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
                    field: {
                        component: KlesFormTextComponent,
                        // clearable: true,
                        validations: [
                            {
                                validator: Validators.required,
                                name: 'required',
                                message: 'aaaa',
                            },
                        ],
                    },
                    // style: {
                    //     ngStyle: (value: number, status: FormControlStatus, row: Record<string, any>, rowStatus: FormControlStatus) => {
                    //         return {
                    //             background: value === 1 ? 'blue' : 'red',
                    //         };
                    //     },
                    // },
                },
            },

            {
                columnDef: 'c',
                sortable: true,

                filterable: true,
                visible: true,
                width: '800px',
                canExpand: true,
                // canExpandNode: true,
                align: AlignCell.LEFT,
                headerCell: {
                    label: 'Colonne C',
                    filterClearable: true,
                    field: {
                        component: KlesFormInputComponent,
                        // clearable: true,
                    },
                },
                cell: {
                    field: {
                        component: KlesFormTextComponent,
                    },
                },
            },
            {
                columnDef: 'd',
                sortable: true,
                align: AlignCell.RIGHT,
                filterable: true,
                visible: true,
                headerCell: {
                    label: 'D',
                    field: {
                        component: KlesFormInputComponent,
                        clearable: true,
                    },
                },
                cell: {
                    field: {
                        component: KlesFormInputComponent,
                        clearable: true,
                        validations: [
                            {
                                validator: Validators.required,
                                name: 'required',
                            },
                        ],
                    },
                },
            },
            {
                columnDef: 'e',
                sortable: true,

                filterable: true,
                visible: true,
                headerCell: {
                    label: 'E',
                    field: {
                        component: KlesFormInputComponent,
                        clearable: true,
                    },
                },
                cell: {
                    field: {
                        component: KlesFormTextComponent,
                    },
                },
            },
            {
                columnDef: 'test',
                sortable: true,
                filterable: true,
                // width: '800px',
                // stickyEnd:true,
                headerCell: {
                    label: 'Test',
                    field: {
                        component: KlesFormSelectComponent,
                        options: ['2'],
                        multiple: true,
                        clearable: true,
                    },
                },
                cell: {
                    field: {
                        property: 'a',
                        component: KlesFormTextComponent,
                    },
                },
            },
        ],
        paginator: true,
        footer: true,

        lines: linesLoader({
            params: () => this.toto,
            loader: (params) => {
                console.log('normal load');
                // return throwError(() => new Error('Une erreur est survenue'));
                return of({
                    items: this.data,
                }).pipe(delay(100));
            },
            // hasChildren: (parent, depth) => {
            //     return parent.value._id === '1';
            // },
            // childrens: (params, parent, depth) => {
            //     console.log(parent);
            //     return of({
            //         items: [{ c: 'treetable value' }],
            //     });
            // },
        }),
        dragDropRows: {
            enable: false,
        },
        selection: selectionConfig({
            selectionMode: true,
            // isSelected: (row) => {
            //     return row.value._id === '1';
            // },
            isDisabled: (row) => {
                return +row.value._id % 2 !== 0;
            },
            // select: (params, row, selected, filters) => {
            //     return of({ indeterminate: true, selected: false }).pipe(delay(1000));
            // },
            // selectAll: (params, selected, filters) => {
            //     return of({ indeterminate: true, selected: false }).pipe(delay(1000));
            // },
        }),

        // extraRows: [
        //     {
        //         mode: 'expand',
        //         cells: [{ columnDef: 'aa', field: { component: KlesFormTextComponent }, colspan: Span.MAX }],
        //     },

        //     {
        //         mode: 'always',
        //         cells: [
        //             // { columnDef: 'ddd', component: KlesFormTextComponent, colspan: Span.MAX },
        //             { columnDef: 'eee', field: { component: KlesFormTextComponent }, colspan: Span.MAX },
        //         ],
        //         // when: (index, rowData) => {
        //         //     return true;
        //         // },
        //     },
        //     {
        //         mode: 'expand',
        //         cells: [{ columnDef: 'ddd', field: { component: KlesFormTextComponent }, colspan: Span.MAX }],
        //     },
        // ],
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
                    field: {
                        component: KlesFormCheckboxComponent,
                    },
                },
                cell: {
                    field: {
                        component: KlesFormCheckboxComponent,
                    },
                },
            },
            {
                columnDef: 'name',
                sortable: true,
                filterable: true,
                canExpandNode: true,
                align: AlignCell.LEFT,
                headerCell: {
                    label: 'Name',
                    field: {
                        label: 'aaa',
                        component: KlesFormInputComponent,
                        clearable: true,
                    },
                },
                cell: {
                    field: {
                        component: KlesFormTextComponent,
                    },
                },
            },
            {
                columnDef: 'test',
                filterable: true,
                headerCell: {
                    label: 'Test',
                    field: {
                        component: KlesFormInputComponent,
                        clearable: true,
                    },
                },
                cell: {
                    field: {
                        component: KlesFormInputComponent,
                        clearable: true,
                    },
                },
            },
        ],

        lazy: true,
        // infinite:true,
        paginator: true,
        lines: linesLazyLoader({
            params: () => this.toto,
            loader: (params, query) => {
                console.log('lazy load', query);
                return of({
                    items: this.data.slice(
                        (query?.pagination?.page ?? 0) * (query?.pagination?.perPage ?? 0),
                        (query?.pagination?.page ?? 0) * (query?.pagination?.perPage ?? 50) + (query?.pagination?.perPage ?? 50),
                    ),
                    total: this.data.length,
                    header: { test: 'blalblaba' },
                }).pipe(delay(1000));
            },
            hasChildren: (parent, depth) => {
                return depth === 0;
            },
            // childrens: (params, parent, depth, query) => {
            //     console.log(parent);
            //     return of({
            //         items: [{ name: 'treetable value' }],
            //         total: 1,
            //     });
            // },
        }),
        selection: selectionConfig({
            key: 'bb',
            params: () => {
                return this.toto;
            },
            selectAll: (params, selected, filters) => {
                console.log('all', filters);
                return of({ selected: true }).pipe(delay(100));
            },
            select: (params, row, selected, filters) => {
                console.log('select !!', row);
                console.log('filters !!', filters);
                return of({ selected: selected, count: selected ? 1 : 0 });
            },
            // isDisabled: (row) => {
            //     return +row.value.test % 2 !== 0;
            // },
        }),
        dragDropRows: {
            enable: true,
        },
    };

    @ViewChild('table') klesTable!: KlesTableApi;
    @ViewChild('lazyTable') klesLazyTable!: KlesTableApi;

    constructor() {}

    ngOnInit() {}

    ngAfterViewInit(): void {
        //sort api
        // this.klesTable.sort.sortChange().subscribe((value) => console.log(value))
        // console.log(this.klesLazyTable.selection.selectionModel)
    }

    add() {
        // this.toto.next({foo:5454, toto:'fsfds'})
        /** */
        // table api
        // this.klesTable.refresh();
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
        /** */
        // selection api
        // this.klesTable.selection?.disable();
        // this.klesTable.selection.enable();
        // console.log(this.klesTable.selection.count());
        // console.log(this.klesTable.selection.selectionModel?.selected)
        // this.klesTable.selection.selectionModel?.select(this.klesTable.form.rows.get('0') as FormGroup)
        /** */
        // footer api
        // this.klesTable.footer.show();
        /** */
        // form header api
        // this.klesTable.form.header.clear();
        // this.klesTable.form.header.get();
        // this.klesTable.form?.header.patchValue({name: 'aaaa'});
        // form rows api
        // this.klesTable.form.rows.update('id', {});
        // this.klesTable.form.rows.create({_id: 5555, test:{ a: 'bbbbb'}}, 2);
        // this.klesTable.form.rows.patch('1', { test: { a: 'bbbbb' } });
        // console.log(this.klesTable.form?.rows.get('1'));
        // console.log(this.klesTable.form?.rows.list());
        // this.klesTable.form?.rows.remove('0')
        // this.klesTable.form.rows.delete('id');
        // form footer api
        // this.klesTable.form.footer.clear();
        // this.klesTable.form?.footer.get();
        // this.klesTable.form.footer.set({});
        // (this.klesTable.ui.get('rows') as ArrayUiState).at(0).get('#select')?.patchValue({ indeterminate: true });
    }

    del() {
        // this.klesTable.footer.hide();
    }
}
