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

@Injectable({ providedIn: 'root' })
export class RowFormFactory {
    createControl(field: IKlesFieldConfig, value?: any): { control: AbstractControl; ui: AbstractUiState } {
        let control: AbstractControl;
        let ui: AbstractUiState;

        if (field.type) {
            control =
                componentMapper.find((c) => c.type === field.type)?.factory({ ...field, value }) || klesFieldControlFactory({ ...field, value });
            ui = componentMapper.find((c) => c.type === field.type)?.ui({ ...field, value }) || klesFieldUiFactory({ ...field, value });
        } else {
            control =
                componentMapper.find((c) => c.component === field.component)?.factory({ ...field, value }) ||
                klesFieldControlFactory({ ...field, value });
            ui = componentMapper.find((c) => c.component === field.component)?.ui({ ...field, value }) || klesFieldUiFactory({ ...field, value });
        }
        return { control, ui };
    }

    createRow(fields: IKlesFieldConfig[], record: any): { formGroup: FormGroup; groupUi: GroupUiState } {
        const data = { _id: crypto.randomUUID(), ...record };

        const controls: Record<string, any> = {
            _id: new FormControl(data._id),
        };

        const uis: Record<string, any> = {};

        for (const field of fields) {
            const { control, ui } = this.createControl(field, data?.[field.name] ?? undefined);
            controls[field.name] = control;
            uis[field.name] = ui;
        }
        return { formGroup: new FormGroup<any>(controls), groupUi: new GroupUiState(uis) };
    }

    createRows(fields: IKlesFieldConfig[], records: any[]): { formGroup: FormGroup; groupUi: GroupUiState }[] {
        return records.map((r) => this.createRow(fields, r));
    }
}
