import { Directive, inject, ViewContainerRef } from '@angular/core';

/** Marks where the paginator for a `kles-dynamic-table` should render. */
@Directive({
    selector: 'ng-template[klesTablePaginatorOutlet]',
    exportAs: 'klesTablePaginatorOutlet',
    standalone: true,
})
export class KlesTablePaginatorOutletDirective {
    readonly viewContainer = inject(ViewContainerRef);
}
