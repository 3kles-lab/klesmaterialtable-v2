import { computed, Injectable, signal, WritableSignal } from '@angular/core';
import { EventsService } from '../events/events.service';

@Injectable()
export class LoadingService {
    private readonly tableLoading = signal(false);
    private readonly selectionLoading = signal(false);
    readonly loading = computed(() => this.tableLoading() || this.selectionLoading());

    constructor(private readonly eventsService: EventsService) {}

    start(): void {
        this.setLoading(this.tableLoading, true);
    }

    stop(): void {
        this.setLoading(this.tableLoading, false);
    }

    setSelectionLoading(loading: boolean): void {
        this.setLoading(this.selectionLoading, loading);
    }

    private setLoading(source: WritableSignal<boolean>, active: boolean): void {
        const wasLoading = this.loading();
        source.set(active);
        const loading = this.loading();
        if (loading !== wasLoading) {
            this.eventsService.emit('loadingChange', { loading });
        }
    }
}
