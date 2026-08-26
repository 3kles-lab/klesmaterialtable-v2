import { ArrayUiState, GroupUiState } from '@3kles/kles-material-dynamicforms';
import { ColumnApi } from './column';
import { FooterApi } from './footer';
import { FormApi } from './form';
import { LoadingApi } from './loading';
import { PaginationApi } from './pagination';
import { ScrollbarApi } from './scrollbar';
import { SelectionApi } from './selection';
import { SortApi } from './sort';
import { EmptyStateApi } from './empty-state';
import { EventsApi } from './events';
import { RenderApi } from './render';

export interface KlesTableApi<TValue = unknown> {
    refresh(): void;
    get scrollbar(): ScrollbarApi;
    get column(): ColumnApi;
    get pagination(): PaginationApi | undefined;
    get sort(): SortApi;
    get loading(): LoadingApi;
    get selection(): SelectionApi;
    get form(): FormApi;
    get footer(): FooterApi;
    get emptyState(): EmptyStateApi;
    get render(): RenderApi;
    get events(): EventsApi<TValue>;
    get ui(): GroupUiState<{
        header: GroupUiState;
        rows: ArrayUiState;
        footer: GroupUiState;
    }>;
}
