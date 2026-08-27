import { AfterViewInit, Component, ElementRef, signal, ViewChild } from '@angular/core';
import { MaterialModule } from './modules/material.module';
import {
    AlignCell,
    KlesMaterialTableModule,
    KlesTableApi,
    KlesTableConfig,
    linesLazyLoader,
    linesLoader,
    selectionConfig,
    SelectionErrorPayload,
    Span,
} from 'kles-material-table';
import { BehaviorSubject, delay, of, switchMap, throwError, timer } from 'rxjs';
import {
    IKlesFieldActionEvent,
    KlesFormActionMenuComponent,
    KlesFormCheckboxComponent,
    KlesFormCurrencyComponent,
    KlesFormGroupComponent,
    KlesFormIconButtonComponent,
    KlesFormInputComponent,
    KlesFormStatusComponent,
    KlesFormTextComponent,
    KlesFormTileComponent,
} from '@3kles/kles-material-dynamicforms';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomTableIntl } from './table-intl';
import { NestedTableFieldComponent } from './nested-table-field.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    providers: [],
    standalone: true,
    imports: [MaterialModule, KlesMaterialTableModule, CommonModule],
})
export class AppComponent implements AfterViewInit {
    toto = new BehaviorSubject({ foo: 123, toto: 'aaaa' });
    readonly selectionErrorMessage = signal<string | null>(null);

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
            details: [
                { label: 'Identifiant', value: `${key}` },
                { label: 'Fournisseur', value: key % 3 ? 'Google Workspace' : 'Microsoft EntraId' },
                { label: 'État', value: key % 3 ? 'Actif' : 'Désactivé' },
            ],
            provider: {
                enabled: key % 3,
                label: key % 3 ? 'Google Workspace' : 'Microsoft EntraId',
                hint: key % 3 ? 'SSO for Google Workspace' : 'SSO for Microsoft EntraId',
                imageUrl:
                    key % 3
                        ? 'https://www.gstatic.com/marketing-cms/assets/images/97/37/bbe70068407199f1ada4b3f6b9f8/g-about-gatg.png=n-w64-h65-fcrop64=1,00000367fffffd72-rw'
                        : 'https://www.techofficesolutions.be/wp-content/uploads/2024/11/microsoft-entra-id-logo-png_seeklogo-523357.png',
                imageAlt: key % 3 ? 'Google Workspace' : 'Microsoft EntraId',
                tooltip: key % 3 ? 'Configurer Google Workspace' : 'Configurer Microsoft EntraId',
            },
        };
    });

    config: KlesTableConfig = {
        columnSeparator: false,
        columns: [
            {
                columnDef: '#select',
                sortable: false,
                sticky: true,
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
                sortArrowPosition: 'before',
                headerCell: {
                    label: '_id',
                    tooltip: 'aaaa',
                    filterClearable: true,
                },
                footerCell: {
                    field: { component: KlesFormTextComponent, value: 'ceci est un footer' },
                },
            },
            {
                columnDef: 'name',
                sortable: true,
                filterable: true,
                visible: true,
                resizable: true,
                headerCell: {
                    label: 'Name',
                    field: {
                        component: KlesFormInputComponent,
                    },
                },
                cell: {
                    field: {
                        component: KlesFormTileComponent,
                        resolveUi: (event) => {
                            const context = event.context as any;
                            return {
                                label: context.source.provider.label,
                                hint: event.group.get('c')?.disabled ? 'desactivé' : 'aaaaa',
                                imageUrl: context.source.provider.imageUrl,
                                imageAlt: context.source.provider.imageAlt,
                                tooltip: context.source.provider.tooltip,
                            };
                        },
                    },
                },
            },
            {
                columnDef: 'c',
                sortable: true,

                filterable: true,
                visible: true,
                canExpand: true,
                align: AlignCell.LEFT,
                headerCell: {
                    label: 'Colonne C',
                    filterClearable: true,
                    field: {
                        component: KlesFormInputComponent,
                    },
                },
                cell: {
                    field: {
                        component: KlesFormCurrencyComponent,

                        label: 'Montant',
                        placeholder: '0,00 €',
                        min: 0,
                        max: 1000000,
                        currencyOptions: {
                            code: 'EUR',
                            locale: 'fr-FR',
                            display: 'symbol',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                            useGrouping: false,
                            allowNegative: false,
                        },
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
                        component: KlesFormTextComponent,
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
                align: AlignCell.LEFT,
                headerCell: {
                    label: 'Test',
                },
                cell: {
                    field: {
                        property: 'a',
                        component: KlesFormTextComponent,
                    },
                },
            },
            {
                columnDef: 'provider',
                headerCell: {
                    label: 'Statuts',
                },
                cell: {
                    field: {
                        component: KlesFormStatusComponent,
                        statusOptions: {
                            showDot: false,
                            resolve: (value, context) => {
                                if (!value) {
                                    return null;
                                }

                                if (!value.enabled) {
                                    return {
                                        label: 'Désactivé',
                                        tone: 'neutral',
                                    };
                                }

                                return {
                                    label: 'Actif',
                                    tone: 'success',
                                };
                            },
                        },
                    },
                },
            },
            {
                columnDef: 'actions',
                headerCell: {},
                stickyEnd: true,
                cell: {
                    field: {
                        component: KlesFormGroupComponent,
                        direction: 'row',
                        wrap: false,
                        collections: [
                            {
                                component: KlesFormIconButtonComponent,
                                icon: 'edit',
                                name: 'edit',
                                onAction: (event: IKlesFieldActionEvent<any, any>) => {
                                    console.log(event);
                                },
                            },
                            {
                                component: KlesFormIconButtonComponent,
                                icon: 'edit',
                                name: 'toto',
                                onAction: (event: IKlesFieldActionEvent<any, any>) => {
                                    console.log(event);
                                },
                            },
                            {
                                component: KlesFormIconButtonComponent,
                                icon: 'edit',
                                name: 'titi',
                                onAction: (event: IKlesFieldActionEvent<any, any>) => {
                                    console.log(event);
                                },
                            },
                            {
                                component: KlesFormActionMenuComponent,
                                icon: 'more_vert',
                                name: 'more',
                                options: [
                                    {
                                        id: 'edit',
                                        label: 'Modifier',
                                        icon: 'edit',

                                        disabled: () => true,
                                    },
                                    {
                                        id: 'duplicate',
                                        label: 'Dupliquer',
                                        icon: 'content_copy',
                                    },
                                    {
                                        id: 'delete',
                                        label: 'Supprimer',
                                        icon: 'delete',
                                        color: 'warn',
                                        dividerBefore: true,

                                    },
                                ],

                                onAction: ({ actionId, context, value, group }) => {
                                    console.log('Actionid', actionId);
                                    console.log('Action sélectionnée', value);
                                    console.log('context', context);
                                    console.log('Valeurs de la ligne', group.getRawValue());
                                },
                            },
                        ],
                    },
                },
            },
        ],
        paginator: true,
        footer: false,
        lines: linesLoader({
            params: () => this.toto,
            loader: (_params) => {
                console.log('normal load');
                return of({
                    items: this.data,
                }).pipe(delay(500));
            },
        }),
        dragDropRows: {
            enable: true,
            options: {
                handleOnly: true,
            },
        },
        selection: selectionConfig({
            selectionMode: true,
            isDisabled: (row) => {
                return +row.value._id % 2 !== 0;
            },
            select: (_params, row, selected) => {
                const rowId = Number(row.getRawValue()._id);

                // Demo: rows 0, 10, 20, etc. simulate a backend failure after 800 ms.
                if (rowId % 10 === 0) {
                    return timer(800).pipe(
                        switchMap(() => throwError(() => new Error(`Demo backend error for row ${rowId}.`))),
                    );
                }

                return of({ selected }).pipe(delay(800));
            },
            selectAll: (_params, selected) => {
                return of({ selected }).pipe(delay(800));
            },
        }),
        extraRows: [
            {
                mode: 'expand',
                cells: [
                    {
                        columnDef: 'details',
                        colspan: Span.MAX,
                        field: {
                            component: NestedTableFieldComponent,
                        },
                    },
                ],
            },
        ],
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
            {
                columnDef: 'c',
                sortable: true,

                filterable: true,
                visible: true,
                canExpand: true,
                align: AlignCell.LEFT,
                headerCell: {
                    label: 'Colonne C',
                    filterClearable: true,
                    field: {
                        component: KlesFormInputComponent,
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
                        component: KlesFormTextComponent,
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
        ],

        lazy: true,
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
                }).pipe(delay(1000));
            },
            hasChildren: (parent, depth) => {
                return depth < 2;
            },
            childrens: (_params, parent, depth) => {
                const parentId = parent.getRawValue()._id;
                const items = Array.from({ length: 3 }, (_, index) => {
                    const childId = `${parentId}.${index + 1}`;
                    return {
                        bb: false,
                        _id: childId,
                        name: `Niveau ${depth + 1} — ${childId}`,
                        test: `Enfant de ${parentId}`,
                        c: `${1565 + index}`,
                        d: `${87887 + index}`,
                        e: `Ligne enfant ${index + 1}`,
                    };
                });
                return of({ items, total: items.length }).pipe(delay(300));
            },
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
        }),
        dragDropRows: {
            enable: true,
        },
    };

    @ViewChild('table') klesTable!: KlesTableApi;
    @ViewChild('lazyTable') klesLazyTable!: KlesTableApi;

    constructor() {}

    onSelectionError(event: SelectionErrorPayload): void {
        const errorMessage = event.error instanceof Error ? event.error.message : String(event.error);
        const rawValue = event.rawValue as { _id?: unknown } | undefined;
        const target = event.row ? `row ${rawValue?._id ?? event.rowIndex}` : 'all rows';

        this.selectionErrorMessage.set(`Remote selection failed for ${target}: ${errorMessage} The checkbox was rolled back.`);
        console.error('Remote selection error', event);
    }

    ngAfterViewInit(): void {
        console.log(this.klesLazyTable.selection.selectionModel);
    }

    add() {
        console.log(this.klesLazyTable.selection.count());
        this.klesTable.form.rows.list().disable();
    }
}
