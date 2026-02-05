import { ColumnApi } from './column';
import { LoadingApi } from './loading';
import { PaginationApi } from './pagination';
import { ScrollbarApi } from './scrollbar';
import { SortApi } from './sort';

export interface KlesTableApi {
    refresh(): void;
    get scrollbar(): ScrollbarApi;
    get column(): ColumnApi;
    get pagination(): PaginationApi | undefined;
    get sort(): SortApi;
    get loading(): LoadingApi;

    // sort
    // selection
    // header
    // footer
    // event
}
