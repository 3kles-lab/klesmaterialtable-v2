import { DestroyRef, inject, Inject, Injectable } from '@angular/core';
import { ILoader, LoaderService } from '../loader/loader.service';
import { LOADER_SERVICE } from '../../../token';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LoadingService } from './loading.service';

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
