import { Sort } from '@angular/material/sort';

export type Pagination = {
    page: number;
    perPage: number;
};

export type Filters = Record<string, unknown>;

export type Query = { pagination?: Pagination ; sort?: Sort ; filters?: Filters };
