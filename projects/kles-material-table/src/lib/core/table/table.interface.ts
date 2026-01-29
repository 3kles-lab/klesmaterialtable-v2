import { ColumnApi } from '../api/column';
import { PaginationApi } from '../api/pagination';
import { ScrollbarApi } from '../api/scrollbar';

export interface ITable {
    scrollbar: ScrollbarApi;
    column: ColumnApi;
    pagination?: PaginationApi | undefined;
    refresh();
}
