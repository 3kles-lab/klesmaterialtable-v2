import { Injectable } from '@angular/core';
import { EventsService } from '../events/events.service';
import { AbstractControl, FormGroup } from '@angular/forms';

@Injectable()
export class CellService {
    constructor(private readonly eventsService: EventsService) {}

    onClick(event: MouseEvent, row: FormGroup, rowIndex: number, columnDef: string): void {
        const control: AbstractControl | null = row.get(columnDef);

        this.eventsService.emit('cellClick', {
            row,
            rowIndex,
            value: control?.value,
            rawValue: row.getRawValue(),
            event,
            columnDef,
            control,
        });
    }

    onDoubleClick(event: MouseEvent, row: FormGroup, rowIndex: number, columnDef: string): void {
        const control: AbstractControl | null = row.get(columnDef);

        this.eventsService.emit('cellDoubleClick', {
            row,
            rowIndex,
            value: control?.value,
            rawValue: row.getRawValue(),
            event,
            columnDef,
            control,
        });
    }

    onContextMenu(event: MouseEvent, row: FormGroup, rowIndex: number, columnDef: string): void {
        event.preventDefault();
        event.stopPropagation();
        const control: AbstractControl | null = row.get(columnDef);

        this.eventsService.emit('cellContextMenu', {
            row,
            rowIndex,
            value: control?.value,
            rawValue: row.getRawValue(),
            event,
            columnDef,
            control,
        });
    }
}
