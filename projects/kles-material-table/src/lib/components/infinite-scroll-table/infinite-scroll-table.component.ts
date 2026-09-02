import { AfterViewInit, Component, Signal, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InfiniteScrollService } from '../../services/features/scrollbar/infinite-scroll.service';
import { TableComponent } from '../table/table.component';

@Component({
    selector: 'kles-infinite-scroll-table',
    templateUrl: './infinite-scroll-table.component.html',
    styleUrl: './infinite-scroll-table.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [TableComponent, MatProgressSpinnerModule],
})
export class InfiniteScrollTableComponent implements AfterViewInit {
    @ViewChild(TableComponent, { static: true }) private readonly table!: TableComponent;

    readonly loadingMore: Signal<boolean>;

    constructor(private readonly infiniteScrollService: InfiniteScrollService) {
        this.loadingMore = infiniteScrollService.loadingMore;
    }

    ngAfterViewInit(): void {
        this.infiniteScrollService.register(this.table.formElemRef.nativeElement);
    }
}
