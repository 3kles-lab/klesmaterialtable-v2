import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import {
    AbstractUiState,
    componentMapper,
    GroupUiState,
    IKlesFieldConfig,
    klesFieldControlFactory,
    klesFieldUiFactory,
} from '@3kles/kles-material-dynamicforms';
import { KlesRowContext } from '../../../core/table/row-context.interface';

export interface KlesCreatedRow<TSource = unknown> {
    formGroup: FormGroup;
    groupUi: GroupUiState;
    context: KlesRowContext<TSource>;
}

@Injectable({ providedIn: 'root' })
export class RowFormFactory {
    createControl(field: IKlesFieldConfig, value?: any): { control: AbstractControl; ui: AbstractUiState } {
        let control: AbstractControl;
        let ui: AbstractUiState;

        if (field.type) {
            control =
                componentMapper.find((c) => c.type === field.type)?.factory({ ...field, value }) || klesFieldControlFactory({ ...field, value });
            ui = componentMapper.find((c) => c.type === field.type)?.ui?.({ ...field, value }) || klesFieldUiFactory({ ...field, value });
        } else {
            control =
                componentMapper.find((c) => c.component === field.component)?.factory({ ...field, value }) ||
                klesFieldControlFactory({ ...field, value });
            ui = componentMapper.find((c) => c.component === field.component)?.ui?.({ ...field, value }) || klesFieldUiFactory({ ...field, value });
        }
        return { control, ui };
    }

    createRow<TSource extends Record<string, any>>(
        fields: IKlesFieldConfig[],
        record: TSource,
        meta: { depth: number; parentId: string | null } = { depth: 0, parentId: null },
    ): KlesCreatedRow<TSource> {
        const data = { _id: crypto.randomUUID(), ...record };

        const controls: Record<string, any> = {
            _id: new FormControl(data._id, { nonNullable: true }),
            _depth: new FormControl(meta.depth),
            _parentId: new FormControl(meta.parentId),
        };

        const uis: Record<string, any> = {};

        for (const field of fields) {
            const { control, ui } = this.createControl(field, data?.[field.name] ?? undefined);
            controls[field.name] = control;
            uis[field.name] = ui;
        }
        return {
            formGroup: new FormGroup<any>(controls),
            groupUi: new GroupUiState(uis),
            context: {
                source: record,
                _id: data._id,
                meta,
            },
        };
    }

    createRows<TSource extends Record<string, any>>(
        fields: IKlesFieldConfig[],
        records: TSource[],
        meta: { depth: number; parentId: string | null } = { depth: 0, parentId: null },
    ): KlesCreatedRow<TSource>[] {
        return records.map((r) => this.createRow(fields, r, meta));
    }
}
