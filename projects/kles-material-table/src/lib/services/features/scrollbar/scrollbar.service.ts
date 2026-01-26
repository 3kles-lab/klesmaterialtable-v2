import { Injectable } from '@angular/core';

@Injectable()
export class ScrollbarService {
    private element: HTMLElement;
    private default: ScrollBehavior = 'smooth';

    register(el: HTMLElement) {
        this.element = el;
    }

    unregister() {
        this.element = undefined;
    }

    toTop(sb?: ScrollBehavior) {
        this.element?.scrollTo({ top: 0, behavior: sb ?? this.default });
    }

    toBottom(sb?: ScrollBehavior) {
        const top = this.element.scrollHeight;
        this.element?.scrollTo({ top, behavior: sb ?? this.default });
    }

    toLeft(sb?: ScrollBehavior) {
        this.element?.scrollTo({ left: 0, behavior: sb ?? this.default });
    }

    toRight(sb?: ScrollBehavior) {
        const left = this.element.scrollWidth;
        this.element?.scrollTo({ left, behavior: sb ?? this.default });
    }

    to(top: number, left: number, sb?: ScrollBehavior) {
        this.element?.scrollTo({ top, left, behavior: sb ?? this.default });
    }

    getTop() {
        return this.element?.scrollTop;
    }
}
