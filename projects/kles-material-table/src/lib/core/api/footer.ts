import { Signal } from '@angular/core';

export interface FooterApi {
    visible: Signal<boolean>;
    show(): void;
    hide(): void;
}
