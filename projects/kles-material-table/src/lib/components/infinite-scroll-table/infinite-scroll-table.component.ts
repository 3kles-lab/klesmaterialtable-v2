import { AfterViewInit, Component, inject, Signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { map } from 'rxjs';
import { InfiniteScrollService } from '../../services/features/scrollbar/infinite-scroll.service';
import { KlesTableIntl } from '../table/table-intl';
import { TableComponent } from '../table/table.component';

@Component({
    selector: 'kles-infinite-scroll-table',
    templateUrl: './infinite-scroll-table.component.html',
    styleUrl: './infinite-scroll-table.component.scss',
    standalone: true,
    imports: [TableComponent, MatProgressSpinnerModule],
})
export class InfiniteScrollTableComponent implements AfterViewInit {
    @ViewChild(TableComponent, { static: true }) private readonly table!: TableComponent;

    readonly loadingMore: Signal<boolean>;
    private readonly intl = inject(KlesTableIntl);
    protected readonly loadingMoreRowsLabel = toSignal(this.intl.changes.pipe(map(() => this.intl.loadingMoreRowsLabel)), {
        initialValue: this.intl.loadingMoreRowsLabel,
    });

    constructor(private readonly infiniteScrollService: InfiniteScrollService) {
        this.loadingMore = infiniteScrollService.loadingMore;
    }

    ngAfterViewInit(): void {
        this.infiniteScrollService.register(this.table.formElemRef.nativeElement);
    }
}
