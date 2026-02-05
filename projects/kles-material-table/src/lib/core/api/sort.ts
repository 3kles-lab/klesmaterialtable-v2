import { EventEmitter } from '@angular/core';
import { Sort, SortDirection } from '@angular/material/sort';

export interface SortApi {
    setDirection(direction: SortDirection): void;
    setActive(active: string): void;
    sortChange(): EventEmitter<Sort>;
}
