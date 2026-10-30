import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { KlesCellComponent } from './cell.component';
import { ExtraRowConfig } from '../../core/table/config.interface';
import { ExtraRowService } from '../../services/features/extra-row/extra-row.service';
import { ExpandedRowStore } from '../../services/store/expanded-row-store.service';
import { EventsService } from '../../services/features/events/events.service';
import { TreeService } from '../../services/features/tree/tree.service';
import { KlesTableIntl } from '../table/table-intl';

describe('KlesCellComponent conditional expansion', () => {
    it('disables empty history and prevents toggles/events, then permits expansion and collapse when history exists', async () => {
        const store = new ExpandedRowStore();
        const events = { emit: jasmine.createSpy('emit') };
        const intl = Object.assign(new KlesTableIntl(), { expandRowLabel: 'Translated expand', collapseRowLabel: 'Translated collapse' });
        const configs = signal<ExtraRowConfig[]>([{ mode: 'expand', cells: [],
            when: (_index, row) => Number(row.getRawValue().versionCount) > 1 }]);
        TestBed.configureTestingModule({ imports: [KlesCellComponent], providers: [provideNoopAnimations(),
            { provide: ExpandedRowStore, useValue: store },
            { provide: ExtraRowService, useValue: new ExtraRowService(configs, store) },
            { provide: EventsService, useValue: events },
            { provide: KlesTableIntl, useValue: intl },
            { provide: TreeService, useValue: { hasChildren: () => false, isLoading: () => false } },
        ] });
        const fixture = TestBed.createComponent(KlesCellComponent);
        const state = signal({ expandedRow: false });
        const row = new FormGroup({ _id: new FormControl({ value: 'template', disabled: true }), versionCount: new FormControl(1) });
        fixture.componentRef.setInput('group', row);
        fixture.componentRef.setInput('column', { columnDef: 'version', canExpand: true });
        fixture.componentRef.setInput('rowIndex', 0);
        fixture.componentRef.setInput('ui', { get: () => ({ value: state,
            patchValue: (value: any) => state.update(previous => ({ ...previous, ...value })) }) });
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        const button = fixture.nativeElement.querySelector('.expand-button') as HTMLButtonElement;
        expect(button.disabled).toBeTrue();
        expect(button.getAttribute('aria-label')).toBe('Translated expand');
        fixture.componentInstance.expandRow();
        expect(store.isExpanded('template')).toBeFalse();
        expect(events.emit).not.toHaveBeenCalled();
        row.controls.versionCount.setValue(2);
        fixture.detectChanges();
        expect(button.disabled).toBeFalse();
        button.click();
        fixture.detectChanges();
        expect(store.isExpanded('template')).toBeTrue();
        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(button.getAttribute('aria-label')).toBe('Translated collapse');
        expect(events.emit).toHaveBeenCalledWith('rowExpand', jasmine.objectContaining({ rawValue: { _id: 'template', versionCount: 2 } }));
        button.click();
        fixture.detectChanges();
        expect(store.isExpanded('template')).toBeFalse();
        expect(events.emit).toHaveBeenCalledWith('rowCollapse', jasmine.anything());
        intl.expandRowLabel = 'Another language';
        intl.changes.next();
        fixture.detectChanges();
        expect(button.getAttribute('aria-label')).toBe('Another language');
    });
});
