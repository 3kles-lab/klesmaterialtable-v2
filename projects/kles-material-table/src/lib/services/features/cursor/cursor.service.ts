import { Inject, Injectable, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CursorApi, CursorMode } from '../../../core/api/cursor';
import { SELECTION_SERVICE } from '../../../token';
import { ISelectionService } from '../selection/selection.service';

@Injectable()
export class CursorService implements CursorApi {
    private readonly _mode = signal<CursorMode>('auto');
    readonly mode = this._mode.asReadonly();

    constructor(@Inject(SELECTION_SERVICE) private readonly selectionService: ISelectionService) {}

    enable(): void {
        this._mode.set('pointer');
    }

    disable(): void {
        this._mode.set('default');
    }

    reset(): void {
        this._mode.set('auto');
    }

    isPointer(row: FormGroup): boolean {
        const mode = this.mode();
        return mode === 'pointer' || (mode === 'auto' && this.selectionService.canSelectOnRowClick(row));
    }
}
