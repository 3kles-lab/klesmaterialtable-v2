import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { KlesForm } from '../../../components/table/form';

@Injectable()
export class EditService {
    constructor(private klesForm: KlesForm) {
        console.log(this.klesForm.form.value)
    }

    public add(record: any, index?: number): FormGroup {
        return null;
    }

    public edit(): FormGroup {
        return null;
    }

    public delete(record: FormGroup): void {}

    public deleteMany(records: FormGroup[]): void {}

    public duplicate(from: FormGroup, value?: any): FormGroup {
        return null;
    }
}
