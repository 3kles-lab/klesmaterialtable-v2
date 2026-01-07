import { AfterViewInit, Component, OnInit, signal, Signal } from '@angular/core';
import { MaterialModule } from './modules/material.module';
import { KlesFormDynamicHeaderFilterComponent, KlesMaterialTableModule, KlesTableConfig, linesLazyLoader, linesLoader } from 'kles-material-table';
import { BehaviorSubject, delay, Observable, of } from 'rxjs';
import { KlesFormInputComponent, KlesFormTextComponent } from '@3kles/kles-material-dynamicforms';
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

    data = Array.from(Array(50).keys()).map((key) => {
        return {
            // _id: `${key}`,
            name: `aa${key}`,
            test: `${key}`,
        };
    });

    config: KlesTableConfig = {
        columns: [
            {
                columnDef: '_id',
                sortable: true,
                filterable: true,
                headerCell: {
                    label: '_id',
                    component: KlesFormDynamicHeaderFilterComponent,
                    filterComponent: KlesFormInputComponent,
                },
                cell: {
                    component: KlesFormTextComponent,
                },
            },
            {
                columnDef: 'name',
                sortable: true,
                filterable: true,
                headerCell: {
                    label: 'Name',
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
                });
            },
        }),
        dragDropRows: {
            enable: true,
        },
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

    constructor() {}

    ngOnInit() {}

    ngAfterViewInit(): void {}
}
