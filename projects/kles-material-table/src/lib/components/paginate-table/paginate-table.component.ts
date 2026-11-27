import { CdkScrollable } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    inject,
    input,
    OnInit,
    Signal,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableComponent } from '../table/table.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { PaginatorService } from '../../services/features/paginator/paginator.service';
import { PAGINATOR_CONFIG } from '../../token';
import { KlesTablePaginatorOutletDirective } from '../../directives/table-paginator-outlet.directive';

@Directive({ selector: 'mat-paginator[klesRegisterPaginator]', standalone: true })
class RegisterPaginatorDirective implements OnInit {
    private readonly paginator = inject(MatPaginator);
    private readonly paginatorService = inject(PaginatorService);

    ngOnInit(): void {
        this.paginatorService.register(this.paginator);
    }
}

@Component({
    selector: 'kles-paginate-table',
    templateUrl: './paginate-table.component.html',
    styleUrl: './paginate-table.component.scss',
    standalone: true,
    imports: [CommonModule, TableComponent, MatPaginatorModule, RegisterPaginatorDirective],
    host: { '[class.scroll-delegated]': 'delegatedScroll' },
})
export class PaginateTableComponent implements OnInit {
    @ViewChild('paginatorTemplate', { static: true }) private paginatorTemplate!: TemplateRef<unknown>;
    @ViewChild('inlinePaginator', { static: true, read: ViewContainerRef }) private inlinePaginator!: ViewContainerRef;
    @ViewChild(TableComponent, { static: true }) table!: TableComponent;
    readonly paginatorOutlet = input<KlesTablePaginatorOutletDirective>();

    protected readonly delegatedScroll = inject(PAGINATOR_CONFIG, { optional: true })?.scrollMode === 'delegated';
    private readonly scrollContainer = this.delegatedScroll ? inject(CdkScrollable, { optional: true, skipSelf: true }) : null;
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly destroyRef = inject(DestroyRef);

    disabled: Signal<boolean>;

    constructor(private paginatorService: PaginatorService) {
        this.disabled = paginatorService.disabled();
    }

    ngOnInit(): void {
        const outlet = this.paginatorOutlet()?.viewContainer ?? this.inlinePaginator;
        const paginatorView = outlet.createEmbeddedView(this.paginatorTemplate);
        this.destroyRef.onDestroy(() => paginatorView.destroy());
        paginatorView.detectChanges();

        const scrollContainer = this.scrollContainer;
        if (scrollContainer) {
            this.paginatorService.pageChanged().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
                const viewport = scrollContainer.getElementRef().nativeElement;
                const offset = this.host.getBoundingClientRect().top - viewport.getBoundingClientRect().top - viewport.clientTop;
                if (offset < 0) {
                    scrollContainer.scrollTo({ top: scrollContainer.measureScrollOffset('top') + offset, behavior: 'instant' });
                }
            });
        }
    }
}
