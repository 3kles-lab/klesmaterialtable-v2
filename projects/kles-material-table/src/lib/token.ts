import { InjectionToken, WritableSignal } from '@angular/core';
import { KlesColumnConfig } from './core/table/column.interface';
import {
    DragDropConfig,
    DragDropRowContext,
    EmptyStateConfig,
    ExtraRowConfig,
    InfiniteScrollConfig,
    LoaderConfig,
    PaginatorConfig,
    RowAppearanceConfig,
} from './core/table/config.interface';
import { DragDropService } from './services/features/dragdrop/dragdrop.service';
import { ColumnDragDropService } from './services/features/dragdrop/column-dragdrop.service';
import { Sort } from '@angular/material/sort';

import { SelectionConfig } from './core/table/selection-config.interface';
import { IDatasourceService } from './services/features/datasource/datasource.service';
import { ISelectionService } from './services/features/selection/selection.service';
import { ISortService } from './services/features/sort/sort.service';
import { ILinesService } from './services/features/lines/lines.service';
import { ITableService } from './services/features/table/table.service';
import { IHeaderService } from './services/features/header/header.service';

import { IScrollbarOrchestratorService } from './services/features/scrollbar/scrollbar-orchestrator.service';
import { ILoader } from './services/features/loader/loader.interface';

export const SELECTION_CONFIG = new InjectionToken<SelectionConfig<unknown>>('SELECTION_CONFIG');

export const LOADER_CONFIG = new InjectionToken<LoaderConfig<unknown, unknown>>('LOADER_CONFIG');
export const COLUMNS = new InjectionToken<WritableSignal<KlesColumnConfig[]>>('COLUMNS');
export const FOOTER = new InjectionToken<WritableSignal<boolean>>('FOOTER');

export const EXTRA_ROWS = new InjectionToken<WritableSignal<ExtraRowConfig[]>>('EXTRA_ROWS');
export const MULTI_UNFOLD = new InjectionToken<boolean>('MULTI_UNFOLD');
export const ROW_APPEARANCE_CONFIG = new InjectionToken<RowAppearanceConfig>('ROW_APPEARANCE_CONFIG');

export const ROW_DRAG_DROP = new InjectionToken<DragDropService>('ROW_DRAG_DROP');
export const COLUMN_DRAG_DROP = new InjectionToken<ColumnDragDropService>('COLUMN_DRAG_DROP');
export const DRAG_DROP_CONFIG = new InjectionToken<DragDropConfig | undefined>('DRAG_DROP_CONFIG');
export const KLES_DRAG_DROP_ROW_CONTEXT = new InjectionToken<DragDropRowContext>('KLES_DRAG_DROP_ROW_CONTEXT');

export const PAGINATOR_CONFIG = new InjectionToken<PaginatorConfig>('PAGINATOR_CONFIG');
export const INFINITE_SCROLL_CONFIG = new InjectionToken<InfiniteScrollConfig>('INFINITE_SCROLL_CONFIG');
export const SORT_CONFIG = new InjectionToken<Sort>('SORT_CONFIG');

export const HEADER_SERVICE = new InjectionToken<IHeaderService>('HEADER_SERVICE');
export const LOADER_SERVICE = new InjectionToken<ILoader<unknown>>('LOADER_SERVICE');
export const LINES_SERVICE = new InjectionToken<ILinesService>('LINES_SERVICE');
export const DATASOURCE_SERVICE = new InjectionToken<IDatasourceService>('DATASOURCE_SERVICE');
export const SELECTION_SERVICE = new InjectionToken<ISelectionService>('SELECTION_SERVICE');
export const SORT_SERVICE = new InjectionToken<ISortService>('SORT_SERVICE');
export const SCROLLBAR_ORCHESTRATOR_SERVICE = new InjectionToken<IScrollbarOrchestratorService>('SCROLLBAR_ORCHESTRATOR_SERVICE');

export const TABLE_SERVICE = new InjectionToken<ITableService>('TABLE_SERVICE');

export const EMPTY_STATE_CONFIG = new InjectionToken<boolean | EmptyStateConfig | undefined>('EMPTY_STATE_CONFIG');
