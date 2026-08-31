import { signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { selectionConfig, SelectionConfig } from '../../../core/table/selection-config.interface';
import { KlesSelectionModel } from '../../../core/selection/selection-model';
import { EventsService } from '../events/events.service';
import { KlesForm } from '../table/form';
import { AbstractSelectionService } from './selection.service';

class RowClickSelectionService extends AbstractSelectionService<unknown> {
    override selectionModel = new KlesSelectionModel<FormGroup>(true);

    constructor(config: SelectionConfig<unknown>) {
        super(config, {} as KlesForm, { emit: jasmine.createSpy('emit') } as unknown as EventsService);
    }

    override register(): void {}
    override count() {
        return signal(0);
    }
    override disable(): void {}
    override enable(): void {}
    protected override linesTotal(): number {
        return 0;
    }
}

describe('selection on row click', () => {
    const createRow = () => new FormGroup({ '#select': new FormControl(false) });

    it('toggles the selection control when enabled', () => {
        const service = new RowClickSelectionService(selectionConfig({ selectOnRowClick: true }));
        const row = createRow();
        const rowElement = document.createElement('tr');

        service.onRowClick({ target: rowElement, currentTarget: rowElement } as unknown as MouseEvent, row);

        expect(row.controls['#select'].value).toBeTrue();
    });

    it('does not toggle from an interactive element', () => {
        const service = new RowClickSelectionService(selectionConfig({ selectOnRowClick: true }));
        const row = createRow();
        const rowElement = document.createElement('tr');
        const button = document.createElement('button');
        rowElement.appendChild(button);

        service.onRowClick({ target: button, currentTarget: rowElement } as unknown as MouseEvent, row);

        expect(row.controls['#select'].value).toBeFalse();
    });

    it('does not toggle a disabled row or an extra row', () => {
        const service = new RowClickSelectionService(
            selectionConfig({
                selectOnRowClick: true,
                isDisabled: () => true,
            }),
        );
        const row = createRow();
        const rowElement = document.createElement('tr');

        service.onRowClick({ target: rowElement, currentTarget: rowElement } as unknown as MouseEvent, row);
        expect(row.controls['#select'].value).toBeFalse();

        const enabledService = new RowClickSelectionService(selectionConfig({ selectOnRowClick: true }));
        rowElement.classList.add('kles-extra-row');
        enabledService.onRowClick({ target: rowElement, currentTarget: rowElement } as unknown as MouseEvent, row);

        expect(row.controls['#select'].value).toBeFalse();
    });
});
