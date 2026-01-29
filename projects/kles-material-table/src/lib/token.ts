import { InjectionToken, WritableSignal } from '@angular/core';
import { KlesColumnConfig } from './core/table/column.interface';
import { ILoaderConfig, IPaginatorConfig } from './core/table/config.interface';
import { DragDropService } from './services/features/dragdrop/dragdrop.service';
import { Sort } from '@angular/material/sort';
import { ITableService } from './services/features/table/abstract-table.service';


export const LOADER_CONFIG = new InjectionToken<ILoaderConfig<any, any>>('LOADER_CONFIG');
export const COLUMNS = new InjectionToken<WritableSignal<KlesColumnConfig[]>>('COLUMNS');

export const ROW_DRAG_DROP = new InjectionToken<DragDropService>('ROW_DRAG_DROP');
export const DRAG_DROP_CONFIG = new InjectionToken<DragDropService>('DRAG_DROP_CONFIG');

// export const KLES_TABLE_SERVICE = new InjectionToken<KlesTableService>('KLES_TABLE_SERVICE');

export const PAGINATOR_CONFIG = new InjectionToken<IPaginatorConfig>('PAGINATOR_CONFIG');
export const SORT_CONFIG = new InjectionToken<Sort>('SORT_CONFIG');

export const SELECTION_KEY = new InjectionToken<string>('SELECTION_KEY');



export const TABLE_SERVICE = new InjectionToken<ITableService>('TABLE_SERVICE');