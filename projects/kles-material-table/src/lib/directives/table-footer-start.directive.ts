import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
    selector: '[klesTableFooterStart]',
    standalone: true,
    host: {
        '[style.display]': "'flex'",
        '[style.align-items]': "'center'",
        '[style.gap]': "'var(--kles-table-footer-gap, 12px)'",
        '[style.min-width]': "'0'",
    },
})
export class KlesTableFooterStartDirective {
    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
}
