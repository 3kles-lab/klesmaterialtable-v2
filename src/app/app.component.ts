import { Component, computed, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MaterialModule } from './modules/material.module';
import {
    AlignCell,
    KlesColumnConfig,
    KlesMaterialTableModule,
    KlesTableApi,
    KlesTableConfig,
    LiveUpdatesConfig,
    Query,
    TableDataChange,
    linesLazyLoader,
    linesLoader,
    selectionConfig,
    SelectionErrorPayload,
    Span,
} from 'kles-material-table';
import { BehaviorSubject, defer, delay, finalize, map, of, Subject, switchMap, take, throwError, timer } from 'rxjs';
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

type DemoRow = ReturnType<AppComponent['data']>[number];
type DemoTarget = 'selectable' | 'first' | 'last';

function liveLabelColumn(): KlesColumnConfig {
    return {
        columnDef: 'liveLabel',
        sortable: true,
        filterable: true,
        headerCell: { label: 'Libellé', field: { component: KlesFormInputComponent, clearable: true } },
        cell: { field: { component: KlesFormTextComponent } },
    };
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    providers: [],
    standalone: true,
    imports: [MaterialModule, KlesMaterialTableModule, CommonModule],
})
export class AppComponent {
    toto = new BehaviorSubject({ foo: 123, toto: 'aaaa' });
    readonly selectionErrorMessage = signal<string | null>(null);
    readonly localLoads = signal(0);
    readonly lazyLoads = signal(0);
    readonly liveStatus = signal('Aucun événement envoyé.');
    readonly burstRunning = signal(false);
    readonly selectingTarget = signal(false);
    readonly targetMode = signal<DemoTarget>('selectable');

    private readonly destroyRef = inject(DestroyRef);
    private readonly liveEvents = new Subject<TableDataChange<DemoRow>>();
    private readonly collator = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' });
    private readonly liveUpdates: LiveUpdatesConfig<unknown> = {
        events: () => this.liveEvents,
        shouldRefresh: ({ changes }, { sort, filters }) => Object.keys(changes).some((field) =>
            field === 'liveLabel' || (sort?.active === field && !!sort.direction) || !!filters?.[field],
        ),
    };
    readonly data = signal(Array.from({ length: 500 }, (_, key) => this.createDemoRow(key)));
    readonly selectedCount = computed(() => this.data().filter((row) => row['#select']).length);
    readonly targetRow = computed(() => {
        const rows = this.rowsForQuery();
        switch (this.targetMode()) {
            case 'first': return rows[0];
            case 'last': return rows.at(-1);
            case 'selectable': return rows.find((row) => !this.selectionFails(row._id));
        }
    });

    private nextId = this.data().length;
    private nextDetail = 90000;

    private createDemoRow(key: number) {
        return {
            '#select': false,
            _id: `${key}`,
            name: key,
            liveLabel: `Ligne ${String(key).padStart(3, '0')}`,
            test: { a: `test ${key}` },
            aa: 'ligne 1 expand key:' + key,
            c: '1565',
            d: '87887',
            e: 'ceci est une phrase ceci est une phrase ceci est une phrase ceci est une phrase ceci est une phrase',
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
    }

    config: KlesTableConfig = {
        keyboardNavigation: { enabled: true, ariaLabel: 'Tableau de démonstration' },
        liveUpdates: this.liveUpdates,
        columnSeparator: false,
        // rowStyle: (_row, _status, _index, context) => {
        //     const provider = (context.source as { provider?: { enabled?: boolean | number } }).provider;

        //     return provider && !provider.enabled
        //         ? { background: 'color-mix(in srgb, var(--mat-sys-error) 10%, var(--mat-sys-surface))' }
        //         : {};
        // },
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
                cell:{
                    field: {
                        component: KlesFormTextComponent
                    }
                },
                footerCell: {
                    field: { component: KlesFormTextComponent, value: 'ceci est un footer' },
                },
            },
            liveLabelColumn(),
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
                align: AlignCell.LEFT,
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
                this.localLoads.update((count) => count + 1);
                return of({ items: this.rowsForQuery() }).pipe(delay(500));
            },
        }),
        dragDropRows: {
            enable: true,
            options: {
                handleOnly: true,
            },
        },
        dragDropColumns: {
            enable: true,
            options: {
                dragDisabled: (column) => column.columnDef === 'actions' || column.columnDef === '#select',
            },
        },
        selection: selectionConfig({
            selectionMode: true,
            selectOnRowClick: true,
            select: (_params, row, selected) => this.selectDemoRow(row.getRawValue()._id, selected),
            selectAll: (_params, selected, filters) => timer(400).pipe(map(() => {
                const { '#select': _checkbox, ...activeFilters } = filters ?? {};
                const matchingIds = new Set(this.rowsForQuery({ filters: activeFilters }).map((row) => row._id));
                this.saveSelection(matchingIds, selected);
                return { selected };
            })),
        }),
        extraRows: [
            {
                mode: 'expand',
                width: 'viewport',
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
        liveUpdates: this.liveUpdates,
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
            liveLabelColumn(),
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
                        component: KlesFormTextComponent,
                        property: 'a',
                        clearable: true,
                    },
                },
            },
            {
                columnDef: 'c',
                sortable: true,

                filterable: true,
                visible: true,

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
        // infinite: true,
        paginator: true,
        pageSize: 20,
        // scrollThreshold: 160,
        lines: linesLazyLoader({
            params: () => this.toto,
            loader: (_params, query) => {
                this.lazyLoads.update((count) => count + 1);
                const rows = this.rowsForQuery(query);
                const pagination = query?.pagination;
                const start = pagination ? pagination.page * pagination.perPage : 0;
                const items = pagination ? rows.slice(start, start + pagination.perPage) : rows;
                return of({ items, total: rows.length }).pipe(delay(400));
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
                        liveLabel: `Enfant de ${parentId}`,
                        test: { a: `Enfant de ${parentId}` },
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

    onSelectionError(event: SelectionErrorPayload): void {
        const errorMessage = event.error instanceof Error ? event.error.message : String(event.error);
        const rawValue = event.rawValue as { _id?: unknown } | undefined;
        const target = event.row ? `la ligne ${rawValue?._id ?? event.rowIndex}` : 'toutes les lignes';

        this.selectionErrorMessage.set(`Échec de la sélection pour ${target}. ${errorMessage}`);
        console.error('Remote selection error', event);
    }

    setTarget(value: string): void {
        if (value === 'selectable' || value === 'first' || value === 'last') {
            this.targetMode.set(value);
        }
    }

    toggleTargetSelection(): void {
        const target = this.targetRow();
        if (!target) return;
        if (!this.klesTable.form.rows.get(target._id)) {
            this.liveStatus.set('Le tableau non-lazy charge encore cette ligne.');
            return;
        }

        this.selectionErrorMessage.set(null);
        this.selectingTarget.set(true);
        this.selectDemoRow(target._id, !target['#select'])
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.selectingTarget.set(false)))
            .subscribe({
                next: ({ selected }) => {
                    const row = this.klesTable.form.rows.get(target._id);
                    if (!row) return;
                    const selection = this.klesTable.selection.selectionModel;
                    if (selected) {
                        selection?.select(row);
                    } else {
                        selection?.deselect(row);
                    }
                    this.liveStatus.set(`« ${target.liveLabel} » ${selected ? 'sélectionnée' : 'désélectionnée'} dans le tableau non-lazy.`);
                },
                error: (error: Error) => this.selectionErrorMessage.set(error.message),
            });
    }

    simulateDetailUpdate(): void {
        const row = this.targetRow();
        if (row) {
            const d = String(this.nextDetail++);
            this.updateDemoRow(row, { d });
            this.liveStatus.set(`Mise à jour de D sur « ${row.liveLabel} » (${d}).`);
        }
    }

    simulateRename(): void {
        const row = this.targetRow();
        if (row) {
            const liveLabel = row.liveLabel.startsWith('Renommée') ? `Déplacée ${row._id}` : `Renommée ${row._id}`;
            this.updateDemoRow(row, { liveLabel });
            this.liveStatus.set(`« ${row.liveLabel} » devient « ${liveLabel} ». Le serveur recalcule l’ordre.`);
        }
    }

    simulateCreate(): void {
        const row = this.createDemoRow(this.nextId++);
        row.liveLabel = `Ajout ${row._id}`;
        this.data.update((rows) => [...rows, row]);
        this.liveEvents.next({ type: 'created', row });
        this.liveStatus.set(`« ${row.liveLabel} » ajoutée au serveur simulé.`);
    }

    simulateDelete(): void {
        const row = this.targetRow();
        if (row) {
            this.data.update((rows) => rows.filter(({ _id }) => _id !== row._id));
            this.liveEvents.next({ type: 'deleted', id: row._id });
            this.liveStatus.set(`« ${row.liveLabel} » supprimée du serveur simulé.`);
        }
    }

    simulateInvalidation(): void {
        this.liveEvents.next({ type: 'invalidate' });
        this.liveStatus.set('Invalidation envoyée, comme après une reconnexion.');
    }

    simulateBurst(): void {
        this.burstRunning.set(true);
        this.liveStatus.set('Rafale de six invalidations à 50 ms d’intervalle.');
        timer(0, 50)
            .pipe(take(6), takeUntilDestroyed(this.destroyRef), finalize(() => this.burstRunning.set(false)))
            .subscribe(() => this.liveEvents.next({ type: 'invalidate' }));
    }

    private updateDemoRow(row: DemoRow, changes: Partial<DemoRow>): void {
        this.data.update((rows) => rows.map((item) => item._id === row._id ? { ...item, ...changes } : item));
        this.liveEvents.next({ type: 'updated', id: row._id, changes });
    }

    private selectDemoRow(id: string, selected: boolean) {
        return defer(() => {
            if (this.selectionFails(id)) {
                return timer(800).pipe(switchMap(() => throwError(() => new Error(`Erreur simulée pour la ligne ${id}.`))));
            }

            this.saveSelection(new Set([id]), selected);
            return of({ selected });
        });
    }

    private saveSelection(ids: ReadonlySet<string>, selected: boolean): void {
        this.data.update((rows) => rows.map((row) => ids.has(row._id) && row['#select'] !== selected ? { ...row, '#select': selected } : row));
    }

    private selectionFails(id: string): boolean {
        return Number(id) % 10 === 0;
    }

    private rowsForQuery(query?: Query): DemoRow[] {
        const filters = Object.entries(query?.filters ?? {});
        const sort = query?.sort;
        const sortField = sort?.direction ? sort.active : 'liveLabel';
        const direction = sort?.direction === 'desc' ? -1 : 1;

        return this.data()
            .filter((row) => filters.every(([field, value]) => {
                const search = String(value ?? '').trim().toLocaleLowerCase('fr');
                return this.queryValue(row, field).toLocaleLowerCase('fr').includes(search);
            }))
            .sort((left, right) => {
                const comparison = this.collator.compare(this.queryValue(left, sortField), this.queryValue(right, sortField));
                return comparison * direction || this.collator.compare(left._id, right._id);
            });
    }

    private queryValue(row: DemoRow, field: string): string {
        return String((field === 'test' ? row.test.a : row[field as keyof DemoRow]) ?? '');
    }
}
