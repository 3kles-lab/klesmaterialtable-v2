import { Injectable } from '@angular/core';

@Injectable()
export class ScrollbarService {
    private element: HTMLElement;

    register(el: HTMLElement) {
        this.element = el;
    }

    unregister() {
        this.element = undefined;
    }

    toTop(sb?: ScrollBehavior) {
        this.element?.scrollTo({ top: 0, behavior: sb ?? 'instant' });
    }

    to(top: number, sb?: ScrollBehavior) {
        this.element?.scrollTo({ top, behavior: sb ?? 'instant' });
    }

    getTop() {
        return this.element?.scrollTop;
    }
}
