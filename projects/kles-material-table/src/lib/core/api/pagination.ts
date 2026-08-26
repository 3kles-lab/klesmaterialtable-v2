import { EventEmitter, Signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

export interface PaginationApi {
    disabled: Signal<boolean>;
    setPageIndex(value: number): void;
    setPageSize(value: number): void;
    setPageSizeOptions(option: number[]): void;
    firstPage(): void;
    lastPage(): void;
    enable(): void;
    disable(): void;
    page: EventEmitter<PageEvent>;
}
