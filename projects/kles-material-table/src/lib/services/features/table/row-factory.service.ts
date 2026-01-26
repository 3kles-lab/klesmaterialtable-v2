import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { componentMapper, IKlesFieldConfig, klesFieldControlFactory } from '@3kles/kles-material-dynamicforms';

@Injectable({ providedIn: 'root' })
export class RowFormFactory {
    createControl(field: IKlesFieldConfig, value?: any): AbstractControl {
        if (field.type) {
            return componentMapper.find((c) => c.type === field.type)?.factory({ ...field, value }) || klesFieldControlFactory({ ...field, value });
        } else {
            return (
                componentMapper.find((c) => c.component === field.component)?.factory({ ...field, value }) ||
                klesFieldControlFactory({ ...field, value })
            );
        }
    }

    createRow(fields: IKlesFieldConfig[], record: any): FormGroup {
        const data = { _id: crypto.randomUUID(), ...record };

        const controls: Record<string, any> = {
            _id: new FormControl(data._id),
        };

        for (const field of fields) {
            controls[field.name] = this.createControl(field, data?.[field.name] ?? undefined);
        }

        return new FormGroup<any>(controls);
    }

    createRows(fields: IKlesFieldConfig[], records: any[]): FormGroup[] {
        return records.map((r) => this.createRow(fields, r));
    }
}
