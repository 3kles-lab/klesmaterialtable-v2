import { ColumnApi } from './column';
import { PaginationApi } from './pagination';
import { RecordApi } from './record';
import { ScrollbarApi } from './scrollbar';

export interface KlesTableApi {
    refresh(): void;
    get scrollbar(): ScrollbarApi;
    get record(): RecordApi;
    get column(): ColumnApi;
    get pagination(): PaginationApi | undefined;

    // sort
    // selection
    // header
    // footer
    // event
}
