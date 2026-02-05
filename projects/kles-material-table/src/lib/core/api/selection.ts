import { FormGroup } from '@angular/forms';
import { IKlesSelectionModel } from '../selection/selection-model.interface';
import { Signal } from '@angular/core';

export interface SelectionApi {
    selectionModel?: IKlesSelectionModel<FormGroup>;
    count: Signal<number>;
    disable(): void;
    enable(): void;
}
