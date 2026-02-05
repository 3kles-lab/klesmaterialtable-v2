import { InjectionToken, WritableSignal } from '@angular/core';
import { KlesColumnConfig } from './core/table/column.interface';
import { ILoaderConfig, IPaginatorConfig } from './core/table/config.interface';
import { DragDropService } from './services/features/dragdrop/dragdrop.service';
import { Sort } from '@angular/material/sort';

import { SelectionConfig } from './core/table/selection-config.interface';
import { IDatasourceService } from './services/features/datasource/datasource.service';
import { ISelectionService } from './services/features/selection/selection.service';
import { ISortService } from './services/features/sort/sort.service';
import { ILinesLoader } from './services/features/lines/lines-loader.service';
import { ILinesService } from './services/features/lines/lines.service';
import { ITableService } from './services/features/table/table.service';

export const SELECTION_CONFIG = new InjectionToken<SelectionConfig<any>>('SELECTION_CONFIG');

export const LOADER_CONFIG = new InjectionToken<ILoaderConfig<any, any>>('LOADER_CONFIG');
export const COLUMNS = new InjectionToken<WritableSignal<KlesColumnConfig[]>>('COLUMNS');

export const ROW_DRAG_DROP = new InjectionToken<DragDropService>('ROW_DRAG_DROP');
export const DRAG_DROP_CONFIG = new InjectionToken<DragDropService>('DRAG_DROP_CONFIG');

// export const KLES_TABLE_SERVICE = new InjectionToken<KlesTableService>('KLES_TABLE_SERVICE');

export const PAGINATOR_CONFIG = new InjectionToken<IPaginatorConfig>('PAGINATOR_CONFIG');
export const SORT_CONFIG = new InjectionToken<Sort>('SORT_CONFIG');

export const LINESLOADER_SERVICE = new InjectionToken<ILinesLoader<any>>('LINESLOADER_SERVICE');
export const LINES_SERVICE = new InjectionToken<ILinesService>('LINES_SERVICE');
export const DATASOURCE_SERVICE = new InjectionToken<IDatasourceService>('DATASOURCE_SERVICE');
export const SELECTION_SERVICE = new InjectionToken<ISelectionService>('SELECTION_SERVICE');
export const SORT_SERVICE = new InjectionToken<ISortService>('SORT_SERVICE');

export const TABLE_SERVICE = new InjectionToken<ITableService>('TABLE_SERVICE');
