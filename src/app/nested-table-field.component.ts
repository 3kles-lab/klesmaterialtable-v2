import { Component, ChangeDetectionStrategy } from '@angular/core';
import { KlesFieldAbstract, KlesFormTextComponent } from '@3kles/kles-material-dynamicforms';
import { KlesTableComponent, KlesTableConfig, linesLoader } from 'kles-material-table';
import { of } from 'rxjs';

interface NestedRow {
    label: string;
    value: string;
}

@Component({
    selector: 'app-nested-table-field',
    standalone: true,
    imports: [KlesTableComponent],
    template: `
        <div class="nested-table">
            <kles-dynamic-table [tableConfig]="nestedTableConfig"></kles-dynamic-table>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: `
        .nested-table {
            width: 100%;
            padding: 12px 16px;
            box-sizing: border-box;
        }
    `,
})
export class NestedTableFieldComponent extends KlesFieldAbstract {
    readonly nestedTableConfig: KlesTableConfig<unknown, NestedRow> = {
        id: `nested-table-${this.group.getRawValue()._id}`,
        columns: [
            {
                columnDef: 'label',
                headerCell: {
                    label: 'Libellé',
                },
                cell: {
                    field: {
                        component: KlesFormTextComponent,
                    },
                },
            },
            {
                columnDef: 'value',
                headerCell: {
                    label: 'Valeur',
                },
                cell: {
                    field: {
                        component: KlesFormTextComponent,
                    },
                },
            },
        ],
        paginator: false,
        lines: linesLoader({
            loader: () =>
                of({
                    items: (this.group.getRawValue().details ?? []) as NestedRow[],
                }),
        }),
    };
}
