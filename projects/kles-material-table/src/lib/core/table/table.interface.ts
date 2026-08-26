import { ArrayUiState, GroupUiState } from '@3kles/kles-material-dynamicforms';
import { ColumnApi } from '../api/column';
import { FooterApi } from '../api/footer';
import { LoadingApi } from '../api/loading';
import { PaginationApi } from '../api/pagination';
import { ScrollbarApi } from '../api/scrollbar';
import { SelectionApi } from '../api/selection';
import { SortApi } from '../api/sort';
import { FormApi } from '../api/form';
import { EventsApi } from '../api/events';
import { EmptyStateApi } from '../api/empty-state';
import { RenderApi } from '../api/render';
import { TreeApi } from '../api/tree';

export interface ITable {
    scrollbar: ScrollbarApi;
    column: ColumnApi;
    pagination?: PaginationApi | undefined;
    selection: SelectionApi;
    sort: SortApi;
    footer: FooterApi;
    loading: LoadingApi;
    form: FormApi;
    events: EventsApi;
    emptyState: EmptyStateApi;
    render: RenderApi;
    tree: TreeApi;
    ui: GroupUiState<{
        header: GroupUiState;
        rows: ArrayUiState;
        footer: GroupUiState;
    }>;

    refresh(): void;
}
