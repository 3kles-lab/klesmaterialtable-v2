import { FormArray, FormGroup } from '@angular/forms';

export type FormValue = Record<string, unknown>;
export type TableFormValue<TValue> = TValue extends object ? TValue : FormValue;

export interface FormApi<TRow = FormValue> {
    header: HeaderFormApi;
    rows: RowsFormApi<TRow>;
    footer: FooterFormApi;
}

type Id = string | number;

export interface HeaderFormApi {
    setValue(value: FormValue, options?: { emitEvent?: boolean; onlySelf?: boolean }): void;
    patchValue(value: FormValue, options?: { emitEvent?: boolean; onlySelf?: boolean }): void;
    get(): FormGroup;
    clear(value?: unknown, options?: { emitEvent?: boolean }): void;
}

export interface FooterFormApi {
    setValue(value: FormValue, options?: { emitEvent?: boolean; onlySelf?: boolean }): void;
    patchValue(value: FormValue, options?: { emitEvent?: boolean; onlySelf?: boolean }): void;
    get(): FormGroup;
    clear(value?: unknown, options?: { emitEvent?: boolean }): void;
}

export interface RowsFormApi<TRow = FormValue> {
    create(value: TRow, index?: number, options?: { emitEvent?: boolean }): FormGroup;
    patch(_id: Id, value: Partial<TRow>, options?: { emitEvent?: boolean; onlySelf?: boolean }): FormGroup | undefined;
    reset(_id: Id, value?: TRow, options?: { emitEvent?: boolean; onlySelf?: boolean; overwriteDefaultValue?: boolean }): void;
    remove(_id: Id, options?: { emitEvent?: boolean }): void;
    list(): FormArray<FormGroup>;
    get(_id: Id): FormGroup | undefined;
}
