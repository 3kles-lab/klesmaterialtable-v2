import { InjectionToken, WritableSignal } from '@angular/core';
import { KlesColumnConfig } from './core/table/column.interface';
import { ILoader, IPaginatorConfig } from './core/table/config.interface';
import { DragDropService } from './services/features/dragdrop/dragdrop.service';
import { KlesTableService } from './kles-table.service';
import { Sort } from '@angular/material/sort';

export const LOADER_CONFIG = new InjectionToken<ILoader<any, any>>('LOADER_CONFIG');
export const COLUMNS = new InjectionToken<WritableSignal<KlesColumnConfig[]>>('COLUMNS');

export const ROW_DRAG_DROP = new InjectionToken<DragDropService>('ROW_DRAG_DROP');
export const DRAG_DROP_CONFIG = new InjectionToken<DragDropService>('DRAG_DROP_CONFIG');

// export const KLES_TABLE_SERVICE = new InjectionToken<KlesTableService>('KLES_TABLE_SERVICE');

export const PAGINATOR_CONFIG = new InjectionToken<IPaginatorConfig>('PAGINATOR_CONFIG');
export const SORT_CONFIG = new InjectionToken<Sort>('SORT_CONFIG');

