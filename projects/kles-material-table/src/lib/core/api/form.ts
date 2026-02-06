import { FormArray, FormGroup } from '@angular/forms';

export interface FormApi {
    header: HeaderApi;
    rows: RowsApi;
    footer: FooterApi;
}

interface HeaderApi {
    set(value: { [key: string]: any }): void;
    get(): FormGroup;
    clear(): void;
}

interface FooterApi {
    set(value: { [key: string]: any }): void;
    get(): FormGroup;
    clear(): void;
}

interface RowsApi {
    create(value: { [key: string]: any }): FormGroup;
    update(_id: string, value: { [key: string]: any }): FormGroup;
    delete(_id: string): void;
    list(): FormArray<FormGroup>;
    get(_id: string): FormGroup;
}
