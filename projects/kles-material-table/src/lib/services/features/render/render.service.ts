import { EventEmitter, Injectable } from '@angular/core';

@Injectable()
export class RenderService {
    private _render = new EventEmitter<void>();

    public render(): EventEmitter<void> {
        return this._render;
    }

    public forceRenderRows() {
        this._render.emit();
    }
}
