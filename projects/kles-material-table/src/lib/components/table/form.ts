import { Injectable } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

@Injectable()
export class KlesForm {
    readonly form = new FormGroup({
        header: new FormGroup({}),
        rows: new FormArray<FormGroup>([]),
        footer: new FormGroup({}),
    });

    public getRows(): FormArray<FormGroup> {
        return this.form.get('rows') as FormArray<FormGroup>;
    }

    public getHeader(): FormGroup {
        return this.form.get('header') as FormGroup;
    }

    public getFooter(): FormGroup {
        return this.form.get('footer') as FormGroup;
    }

    public setRows(rows: FormGroup[]) {
        this.getRows().clear();
        rows.forEach((r) => this.getRows().push(r));
    }

    get rows(): FormGroup[] {
        return this.getRows().controls as FormGroup[];
    }
}
