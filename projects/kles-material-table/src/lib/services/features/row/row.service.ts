import { Inject, Injectable } from '@angular/core';
import { EventsService } from '../events/events.service';
import { FormGroup } from '@angular/forms';
import { SELECTION_SERVICE } from '../../../token';
import { ISelectionService } from '../selection/selection.service';

@Injectable()
export class RowService {
    constructor(
        private readonly eventsService: EventsService,
        @Inject(SELECTION_SERVICE) private readonly selectionService: ISelectionService,
    ) {}

    onClick(event: MouseEvent, row: FormGroup, rowIndex: number): void {
        this.selectionService.onRowClick(event, row);
        this.eventsService.emit('rowClick', {
            row,
            rowIndex,
            value: row.value,
            rawValue: row.getRawValue(),
            event,
        });
    }

    onDoubleClick(event: MouseEvent, row: FormGroup, rowIndex: number): void {
        this.eventsService.emit('rowDoubleClick', {
            row,
            rowIndex,
            value: row.value,
            rawValue: row.getRawValue(),
            event,
        });
    }

    onContextMenu(event: MouseEvent, row: FormGroup, rowIndex: number): void {
        event.preventDefault();
        event.stopPropagation();
        this.eventsService.emit('rowContextMenu', {
            row,
            rowIndex,
            value: row.value,
            rawValue: row.getRawValue(),
            event,
        });
    }

    onMouseEnter(event: MouseEvent, row: FormGroup, rowIndex: number): void {
        this.eventsService.emit('rowMouseEnter', {
            row,
            rowIndex,
            value: row.value,
            rawValue: row.getRawValue(),
            event,
        });
    }

    onMouseLeave(event: MouseEvent, row: FormGroup, rowIndex: number): void {
        this.eventsService.emit('rowMouseLeave', {
            row,
            rowIndex,
            value: row.value,
            rawValue: row.getRawValue(),
            event,
        });
    }
}
