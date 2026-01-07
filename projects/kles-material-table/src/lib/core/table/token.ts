import { InjectionToken } from '@angular/core';
import { IDragDropConfig, ILoader } from './config.interface';
import { KlesColumnConfig } from './column.interface';
import { DragDropService } from '../../services/features/dragdrop/dragdrop.service';

export const LOADER_CONFIG = new InjectionToken<ILoader<any, any>>('LOADER_CONFIG');
export const COLUMNS = new InjectionToken<KlesColumnConfig[]>('COLUMNS');

export const ROW_DRAG_DROP = new InjectionToken<DragDropService>('ROW_DRAG_DROP');
export const DRAG_DROP_CONFIG = new InjectionToken<DragDropService>('DRAG_DROP_CONFIG');
