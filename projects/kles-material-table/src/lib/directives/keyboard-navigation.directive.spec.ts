import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { KeyboardNavigationConfig } from '../core/table/config.interface';
import { KEYBOARD_NAVIGATION_CONFIG, SELECTION_SERVICE } from '../token';
import { KeyboardCellDirective, KeyboardGridDirective } from './keyboard-navigation.directive';

@Component({
    changeDetection: ChangeDetectionStrategy.Default,
    standalone: true,
    imports: [KeyboardGridDirective, KeyboardCellDirective],
    template: `
        <button id="before">Before</button>
        <table klesKeyboardGrid>
            <thead><tr><th><input id="filter" /></th></tr></thead>
            <tbody>
                @for (row of rows(); track row.get('_id')!.value) {
                    <tr>
                        @for (column of columns(); track column) {
                            <td [klesKeyboardCell]="row" [columnDef]="column">
                                <button class="handle">Expand</button>
                                <div class="cell-field">
                                    @if (column === 'name') {
                                        <input class="editor" value="Initial" />
                                    } @else {
                                        <textarea class="editor">Initial</textarea>
                                    }
                                </div>
                                <button class="action">Action</button>
                                @if (showNested() && row.get('_id')!.value === 1 && column === 'name') {
                                    <table klesKeyboardGrid class="nested">
                                        <tr>
                                            <td [klesKeyboardCell]="row" columnDef="nestedA"><input class="nested-input" /></td>
                                            <td [klesKeyboardCell]="row" columnDef="nestedB"><input /></td>
                                        </tr>
                                    </table>
                                }
                            </td>
                        }
                    </tr>
                    <tr><td><button class="extra-action">Extra row</button></td></tr>
                }
            </tbody>
            <tfoot><tr><td><button id="footer">Footer</button></td></tr></tfoot>
        </table>
        <button id="after">After</button>
    `,
})
class KeyboardHost {
    showNested = signal(false);
    columns = signal(['name', 'description']);
    rows = signal([1, 2, 3].map(id => new FormGroup({ _id: new FormControl(id) })));
}

describe('keyboard grid', () => {
    let fixture: ComponentFixture<KeyboardHost>;
    let root: HTMLElement;
    let config: KeyboardNavigationConfig;
    let selection: { canSelectRow: jasmine.Spy; toggleRowSelection: jasmine.Spy };
    const cells = (): HTMLElement[] => [...root.querySelectorAll<HTMLElement>('[data-kles-keyboard-cell]')];
    const key = (target: HTMLElement, name: string, options: KeyboardEventInit = {}): KeyboardEvent => {
        const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...options });
        target.dispatchEvent(event);
        return event;
    };
    const editor = (cell: HTMLElement): HTMLInputElement => cell.querySelector('.editor')!;

    beforeEach(async () => {
        config = { enabled: true, ariaLabel: 'Editable records' };
        selection = { canSelectRow: jasmine.createSpy().and.returnValue(true), toggleRowSelection: jasmine.createSpy() };
        await TestBed.configureTestingModule({
            imports: [KeyboardHost],
            providers: [
                { provide: KEYBOARD_NAVIGATION_CONFIG, useValue: config },
                { provide: SELECTION_SERVICE, useValue: selection },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(KeyboardHost);
        root = fixture.nativeElement;
        document.body.appendChild(root);
        fixture.detectChanges();
    });

    afterEach(() => { fixture.destroy(); root.remove(); });

    it('has one grid tab stop and leaves header, footer and extra rows alone', () => {
        expect(cells().map(cell => cell.tabIndex)).toEqual([0, -1, -1, -1, -1, -1]);
        expect(editor(cells()[0]).tabIndex).toBe(-1);
        expect(root.querySelector('table')!.getAttribute('role')).toBe('grid');
        expect(root.querySelector('table')!.getAttribute('aria-label')).toBe('Editable records');
        expect(root.querySelector<HTMLInputElement>('#filter')!.tabIndex).toBe(0);
        expect(root.querySelector<HTMLButtonElement>('.extra-action')!.tabIndex).toBe(0);
        expect(root.querySelector<HTMLButtonElement>('#footer')!.tabIndex).toBe(0);
    });

    it('navigates rendered rows and columns and stops at boundaries', () => {
        cells()[0].focus();
        key(cells()[0], 'ArrowRight');
        expect(document.activeElement).toBe(cells()[1]);
        key(cells()[1], 'ArrowDown');
        expect(document.activeElement).toBe(cells()[3]);
        key(cells()[3], 'Home');
        expect(document.activeElement).toBe(cells()[2]);
        key(cells()[2], 'End');
        expect(document.activeElement).toBe(cells()[3]);
        key(cells()[3], 'ArrowUp');
        key(cells()[1], 'ArrowLeft');
        key(cells()[0], 'ArrowUp');
        key(cells()[0], 'ArrowLeft');
        expect(document.activeElement).toBe(cells()[0]);
    });

    it('focuses a clicked cell so arrows work immediately without passing through filters', () => {
        const cell = cells()[3];
        cell.querySelector('.cell-field')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(document.activeElement).toBe(cell);
        key(cell, 'ArrowLeft');
        expect(document.activeElement).toBe(cells()[2]);
    });

    it('preserves focus on clicked editors and action buttons', () => {
        const input = editor(cells()[0]);
        input.focus();
        input.click();
        expect(document.activeElement).toBe(input);
        const button = cells()[0].querySelector<HTMLButtonElement>('.action')!;
        button.focus();
        button.click();
        expect(document.activeElement).toBe(button);
    });

    it('jumps from a header filter to the remembered cell with Ctrl+Enter', () => {
        cells()[3].focus();
        const filter = root.querySelector<HTMLInputElement>('#filter')!;
        filter.focus();
        expect(key(filter, 'Enter', { ctrlKey: true }).defaultPrevented).toBeTrue();
        expect(document.activeElement).toBe(cells()[3]);
    });

    it('allows native Tab and Shift+Tab to leave navigation mode', () => {
        cells()[0].focus();
        expect(key(cells()[0], 'Tab').defaultPrevented).toBeFalse();
        expect(key(cells()[0], 'Tab', { shiftKey: true }).defaultPrevented).toBeFalse();
        expect(editor(cells()[0]).tabIndex).toBe(-1);
    });

    it('enters the field with Enter/F2 and exits with Escape without resetting its value', () => {
        const cell = cells()[0];
        cell.focus();
        key(cell, 'Enter');
        const input = editor(cell);
        expect(document.activeElement).toBe(input);
        input.value = 'Changed';
        expect(key(input, 'ArrowRight').defaultPrevented).toBeFalse();
        key(input, 'Escape');
        expect(document.activeElement).toBe(cell);
        expect(input.value).toBe('Changed');
        key(cell, 'F2');
        expect(document.activeElement).toBe(input);
        key(input, 'Enter');
        expect(document.activeElement).toBe(cell);
    });

    it('keeps multiline Enter and open popup keys with the editor', () => {
        const cell = cells()[1];
        cell.focus();
        key(cell, 'Enter');
        const textarea = editor(cell);
        expect(key(textarea, 'Enter').defaultPrevented).toBeFalse();
        expect(document.activeElement).toBe(textarea);
        textarea.setAttribute('aria-expanded', 'true');
        expect(key(textarea, 'Escape').defaultPrevented).toBeFalse();
        expect(document.activeElement).toBe(textarea);
    });

    it('keeps Tab between cell controls and exits at the last control', () => {
        const cell = cells()[0];
        cell.focus();
        key(cell, 'F2');
        expect(key(editor(cell), 'Tab').defaultPrevented).toBeFalse();
        expect(document.activeElement).toBe(editor(cell));
        const action = cell.querySelector<HTMLButtonElement>('.action')!;
        action.focus();
        expect(key(action, 'Tab').defaultPrevented).toBeFalse();
        expect(document.activeElement).toBe(cell);
        expect(action.tabIndex).toBe(-1);
    });

    it('does not enter disabled or hidden editors', () => {
        const cell = cells()[0];
        editor(cell).disabled = true;
        cell.querySelector<HTMLButtonElement>('.handle')!.disabled = true;
        cell.querySelector<HTMLButtonElement>('.action')!.hidden = true;
        cell.focus();
        key(cell, 'F2');
        expect(document.activeElement).toBe(cell);
    });

    it('toggles selection only for eligible rows and does not repeat on held Space', () => {
        cells()[0].focus();
        key(cells()[0], ' ');
        expect(selection.toggleRowSelection).toHaveBeenCalledOnceWith(fixture.componentInstance.rows()[0]);
        key(cells()[0], ' ', { repeat: true });
        selection.canSelectRow.and.returnValue(false);
        key(cells()[0], ' ');
        expect(selection.toggleRowSelection).toHaveBeenCalledTimes(1);
        key(cells()[0], 'F2');
        expect(key(editor(cells()[0]), ' ').defaultPrevented).toBeFalse();
    });

    it('keeps focus identity when rows and columns are reordered', () => {
        cells()[3].focus();
        fixture.componentInstance.rows.update(rows => [...rows].reverse());
        fixture.componentInstance.columns.update(columns => [...columns].reverse());
        fixture.detectChanges();
        expect(document.activeElement).toBe(cells()[2]);
        key(cells()[2], 'ArrowDown');
        expect(document.activeElement).toBe(cells()[4]);
    });

    it('recovers focus when a column is hidden or a row removed', () => {
        cells()[3].focus();
        fixture.componentInstance.columns.set(['name']);
        fixture.detectChanges();
        expect(document.activeElement).toBe(cells()[1]);
        fixture.componentInstance.rows.update(rows => rows.filter((_, index) => index !== 1));
        fixture.detectChanges();
        expect(document.activeElement).toBe(cells()[1]);
    });

    it('restores the active cell on replacement with the same row ID', () => {
        cells()[2].focus();
        fixture.componentInstance.rows.set([1, 2, 3].map(id => new FormGroup({ _id: new FormControl(id) })));
        fixture.detectChanges();
        key(cells()[2], ' ');
        expect(selection.toggleRowSelection).toHaveBeenCalledWith(fixture.componentInstance.rows()[1]);
        expect(document.activeElement).toBe(cells()[2]);
    });

    it('does not steal focus outside the grid on subsequent updates', () => {
        cells()[2].focus();
        const after = root.querySelector<HTMLButtonElement>('#after')!;
        after.focus();
        fixture.componentInstance.rows.update(rows => rows.filter((_, index) => index !== 1));
        fixture.detectChanges();
        expect(document.activeElement).toBe(after);
    });

    it('isolates nested grids from their parent navigation and tab index management', () => {
        fixture.componentInstance.showNested.set(true);
        fixture.detectChanges();
        const innerCells = [...root.querySelectorAll<HTMLElement>('.nested [data-kles-keyboard-cell]')];
        innerCells[0].focus();
        key(innerCells[0], 'ArrowRight');
        expect(document.activeElement).toBe(innerCells[1]);
        key(innerCells[1], 'ArrowRight');
        expect(document.activeElement).toBe(innerCells[1]);
        fixture.detectChanges();
        expect(innerCells[1].tabIndex).toBe(0);
        expect(cells()[0].tabIndex).toBe(0);
    });

    it('ignores modified, composing and already handled keys', () => {
        cells()[0].focus();
        expect(key(cells()[0], 'ArrowRight', { ctrlKey: true }).defaultPrevented).toBeFalse();
        expect(key(cells()[0], 'ArrowRight', { isComposing: true }).defaultPrevented).toBeFalse();
        const handled = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
        handled.preventDefault();
        cells()[0].dispatchEvent(handled);
        expect(document.activeElement).toBe(cells()[0]);
    });

    it('preserves original control tab indexes on teardown', () => {
        const input = editor(cells()[0]);
        fixture.destroy();
        expect(input.hasAttribute('tabindex')).toBeFalse();
    });

    it('leaves ordinary table focus behavior unchanged when disabled', () => {
        fixture.destroy();
        root.remove();
        config.enabled = false;
        fixture = TestBed.createComponent(KeyboardHost);
        root = fixture.nativeElement;
        document.body.appendChild(root);
        fixture.detectChanges();
        expect(cells()[0].hasAttribute('tabindex')).toBeFalse();
        expect(editor(cells()[0]).tabIndex).toBe(0);
        expect(root.querySelector('table')!.getAttribute('role')).toBeNull();
        expect(key(editor(cells()[0]), 'Enter').defaultPrevented).toBeFalse();
    });
});
