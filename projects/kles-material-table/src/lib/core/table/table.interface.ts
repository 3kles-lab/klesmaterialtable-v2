import { ColumnApi } from '../api/column';
import { FooterApi } from '../api/footer';
import { LoadingApi } from '../api/loading';
import { PaginationApi } from '../api/pagination';
import { ScrollbarApi } from '../api/scrollbar';
import { SelectionApi } from '../api/selection';
import { SortApi } from '../api/sort';

export interface ITable {
    scrollbar: ScrollbarApi;
    column: ColumnApi;
    pagination?: PaginationApi | undefined;
    selection: SelectionApi;
    sort: SortApi;
    footer: FooterApi;
    loading: LoadingApi;
    refresh();
    ui: any;
}
