import { DestroyRef, inject, Inject, Injectable, Optional } from '@angular/core';
import { LINES_SERVICE, SORT_SERVICE } from '../../../token';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ILinesService } from '../lines/lines.service';
import { ScrollbarService } from './scrollbar.service';
import { PaginatorService } from '../paginator/paginator.service';
import { ISortService } from '../sort/sort.service';

export interface IScrollbarOrchestratorService {
    register(): void;
}

@Injectable()
export class ScrollbarOrchestratorService implements IScrollbarOrchestratorService {
    private readonly destroyRef = inject(DestroyRef);

    constructor(
        @Inject(LINES_SERVICE) private linesService: ILinesService,
        private scrollbarService: ScrollbarService,
        @Optional() private paginatorService: PaginatorService,
        @Optional() @Inject(SORT_SERVICE) private sortService: ISortService,
    ) {}

    public register() {
        this.listen();
    }

    private listen() {
        this.linesService
            .loaded()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.scrollbarService.toTop('instant');
                this.scrollbarService.showScrollbar();
            });

        this.linesService
            .loading()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.scrollbarService.hideScrollbar();
            });

        this.paginatorService
            ?.pageChanged()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.scrollbarService.toTop('instant');
            });

        this.sortService
            ?.sortChange()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.scrollbarService.toTop('instant');
            });
    }
}

@Injectable()
export class ScrollbarLazyOrchestratorService implements IScrollbarOrchestratorService {
    private readonly destroyRef = inject(DestroyRef);

    constructor(
        @Inject(LINES_SERVICE) private linesService: ILinesService,
        private scrollbarService: ScrollbarService,
    ) {}

    public register() {
        this.listen();
    }

    private listen() {
        this.linesService
            .loaded()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.scrollbarService.toTop('instant');
                this.scrollbarService.showScrollbar();
            });

        this.linesService
            .loading()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.scrollbarService.hideScrollbar();
            });
    }
}
