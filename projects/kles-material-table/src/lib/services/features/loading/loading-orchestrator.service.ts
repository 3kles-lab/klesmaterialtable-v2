import { DestroyRef, inject, Inject, Injectable } from '@angular/core';

import { LOADER_SERVICE } from '../../../token';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LoadingService } from './loading.service';
import { ILoader } from '../loader/loader.interface';
import { KlesForm } from '../table/form';

@Injectable()
export class LoadingOrchestratorService {
    private readonly destroyRef = inject(DestroyRef);

    constructor(
        @Inject(LOADER_SERVICE) private loader: ILoader<any>,
        private loadingService: LoadingService,
    ) {}

    public register() {
        this.listen();
    }

    private listen() {
        this.loader
            .load()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                map((response) => response.loading ?? false),
            )
            .subscribe((loading) => {
                if (loading) {
                    this.loadingService.start();
                } else {
                    this.loadingService.stop();
                }
            });
    }
}

@Injectable()
export class InfiniteLoadingOrchestratorService {
    private readonly destroyRef = inject(DestroyRef);

    constructor(
        @Inject(LOADER_SERVICE) private readonly loader: ILoader<any>,
        private readonly loadingService: LoadingService,
        private readonly form: KlesForm,
    ) {}

    register(): void {
        this.loader
            .load()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (response.loading && this.form.getRows().length === 0) {
                    this.loadingService.start();
                } else {
                    this.loadingService.stop();
                }
            });
    }
}
