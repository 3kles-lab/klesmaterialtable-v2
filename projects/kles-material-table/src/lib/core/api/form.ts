import { FormArray, FormGroup } from '@angular/forms';

export interface FormApi {
    header: HeaderApi;
    rows: RowsApi;
    footer: FooterApi;
}

type Id = string | number;

interface HeaderApi {
    setValue(value: { [key: string]: any }, options?: { emitEvent?: boolean; onlySelf?: boolean }): void;
    patchValue(value: { [key: string]: any }, options?: { emitEvent?: boolean; onlySelf?: boolean }): void;
    get(): FormGroup;
    clear(value?: any, options?: { emitEvent?: boolean }): void;
}

interface FooterApi {
    setValue(value: { [key: string]: any }, options?: { emitEvent?: boolean; onlySelf?: boolean }): void;
    patchValue(value: { [key: string]: any }, options?: { emitEvent?: boolean; onlySelf?: boolean }): void;
    get(): FormGroup;
    clear(value?: any, options?: { emitEvent?: boolean }): void;
}

interface RowsApi {
    create(value: { [key: string]: any }, index?: number, options?: { emitEvent?: boolean }): FormGroup;
    patch(_id: Id, value: { [key: string]: any }, options?: { emitEvent?: boolean; onlySelf?: boolean }): FormGroup | undefined;
    reset(_id: Id, value?: { [key: string]: any }, options?: { emitEvent?: boolean; onlySelf?: boolean; overwriteDefaultValue?: boolean }): void;
    remove(_id: Id, options?: { emitEvent?: boolean }): void;
    list(): FormArray<FormGroup>;
    get(_id: Id): FormGroup | undefined;
}
