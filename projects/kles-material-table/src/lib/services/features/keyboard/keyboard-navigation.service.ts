import { Inject, Injectable, Optional } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { KeyboardNavigationConfig } from '../../../core/table/config.interface';
import { KEYBOARD_NAVIGATION_CONFIG, SELECTION_SERVICE } from '../../../token';
import { ISelectionService } from '../selection/selection.service';

export interface KeyboardCell {
    element: HTMLElement;
    row: FormGroup;
    columnDef: string;
}

const interactiveSelector = 'input, textarea, select, button, a[href], [tabindex], [contenteditable]:not([contenteditable="false"])';

/** One instance per rendered grid, including nested tables. */
@Injectable()
export class KeyboardNavigationService {
    private registered = new Set<KeyboardCell>();
    private cells: KeyboardCell[] = [];
    private active?: KeyboardCell;
    private identity?: { rowId: unknown; columnDef: string };
    private editing = false;
    private focusOwned = false;
    private originalTabIndexes = new Map<HTMLElement, string | null>();

    constructor(
        @Optional() @Inject(KEYBOARD_NAVIGATION_CONFIG) private config: KeyboardNavigationConfig | null,
        @Optional() @Inject(SELECTION_SERVICE) private selection: ISelectionService | null,
    ) {}

    get enabled(): boolean { return this.config?.enabled === true; }
    get ariaLabel(): string | undefined { return this.config?.ariaLabel; }

    register(cell: KeyboardCell): void { this.registered.add(cell); }
    unregister(cell: KeyboardCell): void { this.registered.delete(cell); }

    focusActive(): boolean {
        if (!this.enabled) return false;
        this.reconcile();
        if (!this.active) return false;
        this.focus(this.active);
        return true;
    }

    click(cell: KeyboardCell, event: MouseEvent): void {
        if (!this.enabled || event.defaultPrevented || !this.ownsEvent(cell, event)) return;
        const target = event.target as Element;
        // Preserve native field focus, action buttons and links, including custom widgets.
        if (target !== cell.element && target.closest(
            'input, textarea, select, button, a, [role="button"], [role="checkbox"], [role="combobox"], [role="link"], [contenteditable]:not([contenteditable="false"]), [tabindex]',
        ) !== cell.element) return;
        this.focus(cell);
    }

    /** Runs after Angular has rendered rows, reordered columns and updated controls. */
    reconcile(): void {
        if (!this.enabled) return;
        const previous = this.active;
        const previousIndex = previous ? this.cells.indexOf(previous) : 0;
        this.cells = [...this.registered].filter(cell => cell.element.isConnected).sort((a, b) =>
            a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
        );
        const next = this.cells.find(cell => this.identity &&
            cell.row.get('_id')?.value === this.identity.rowId && cell.columnDef === this.identity.columnDef)
            ?? this.cells.find(cell => this.identity && cell.row.get('_id')?.value === this.identity.rowId)
            ?? this.cells[Math.max(0, Math.min(previousIndex, this.cells.length - 1))];

        const focused = previous?.element.ownerDocument.activeElement;
        if (focused && focused !== focused.ownerDocument.body &&
            !this.cells.some(cell => cell.element === focused || cell.element.contains(focused))) {
            this.focusOwned = false;
        }
        if (next !== previous) {
            this.editing = false;
            this.activate(next);
        }
        this.updateTabStops();
        if (next && previous && this.focusOwned &&
            (next !== previous || !next.element.contains(next.element.ownerDocument.activeElement))) this.focus(next);
    }

    focusIn(cell: KeyboardCell, event: FocusEvent): void {
        if (!this.enabled || !this.ownsEvent(cell, event)) return;
        this.focusOwned = true;
        this.activate(cell);
        this.editing = event.target !== cell.element;
        this.updateTabStops();
    }

    focusOut(event: FocusEvent): void {
        if (event.relatedTarget instanceof Node &&
            !this.cells.some(cell => cell.element.contains(event.relatedTarget as Node))) {
            this.focusOwned = false;
        } else if (!event.relatedTarget && (event.target as HTMLElement)?.isConnected) {
            // Browsers also emit a null destination while Angular removes or moves a focused node.
            // Wait until rendering is finished to distinguish removal from an intentional blur.
            const target = event.target as HTMLElement;
            queueMicrotask(() => {
                if (target.isConnected && !this.cells.some(cell => cell.element.contains(target.ownerDocument.activeElement))) {
                    this.focusOwned = false;
                }
            });
        }
    }

    keyDown(cell: KeyboardCell, event: KeyboardEvent): void {
        if (!this.enabled || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey ||
            !this.ownsEvent(cell, event)) return;
        this.activate(cell);
        if (event.target !== cell.element) {
            // Let the field own arrows, selection shortcuts, multiline input and open popups.
            const target = event.target as HTMLElement;
            const popupOpen = target.closest('[aria-expanded="true"]') !== null;
            const simpleInput = target instanceof HTMLInputElement &&
                ['text', 'search', 'email', 'tel', 'url', 'password', 'number'].includes(target.type) &&
                target.getAttribute('role') !== 'combobox';
            if (event.key === 'Tab') {
                const controls = this.availableControls(cell).filter(element => element.tabIndex >= 0);
                const index = controls.indexOf(target);
                if (index >= 0 && (event.shiftKey ? index > 0 : index < controls.length - 1)) return;
                this.editing = false;
                this.focus(cell); // Native Tab now leaves this single grid tab stop.
            } else if (!popupOpen && (event.key === 'Escape' ||
                (event.key === 'Enter' && simpleInput))) {
                event.preventDefault();
                event.stopPropagation();
                this.editing = false;
                this.focus(cell);
            }
            return;
        }

        let destination: KeyboardCell | undefined;
        const rowCells = this.cells.filter(current => current.row === cell.row);
        const columnCells = this.cells.filter(current => current.columnDef === cell.columnDef);
        switch (event.key) {
            case 'ArrowLeft': destination = rowCells[rowCells.indexOf(cell) - 1]; break;
            case 'ArrowRight': destination = rowCells[rowCells.indexOf(cell) + 1]; break;
            case 'ArrowUp': destination = columnCells[columnCells.indexOf(cell) - 1]; break;
            case 'ArrowDown': destination = columnCells[columnCells.indexOf(cell) + 1]; break;
            case 'Home': destination = rowCells[0]; break;
            case 'End': destination = rowCells.at(-1); break;
            case 'Enter':
            case 'F2': this.enterEdit(cell); break;
            case ' ':
                if (!event.repeat && this.selection?.canSelectRow(cell.row)) this.selection.toggleRowSelection(cell.row);
                break;
            default: return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (destination) this.focus(destination);
    }

    destroy(): void {
        for (const [element, tabIndex] of this.originalTabIndexes) this.restoreTabIndex(element, tabIndex);
        this.originalTabIndexes.clear();
        this.registered.clear();
        this.cells = [];
    }

    private ownsEvent(cell: KeyboardCell, event: Event): boolean {
        return event.target instanceof Element && event.target.closest('[data-kles-keyboard-cell]') === cell.element;
    }

    private activate(cell: KeyboardCell | undefined): void {
        this.active = cell;
        if (cell) this.identity = { rowId: cell.row.get('_id')?.value, columnDef: cell.columnDef };
    }

    private focus(cell: KeyboardCell): void {
        this.activate(cell);
        this.editing = false;
        this.updateTabStops();
        cell.element.focus({ preventScroll: true });
        cell.element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }

    private enterEdit(cell: KeyboardCell): void {
        this.editing = true;
        this.updateTabStops();
        // Prefer the field over row handles and expansion buttons.
        const fields = [...cell.element.querySelectorAll<HTMLElement>('.cell-field')];
        const candidates = fields.flatMap(field => [...field.querySelectorAll<HTMLElement>(interactiveSelector)])
            .concat([...cell.element.querySelectorAll<HTMLElement>(interactiveSelector)]);
        const available = this.availableControls(cell);
        const target = candidates.find(element => available.includes(element));
        if (target) target.focus();
        else {
            this.editing = false;
            this.updateTabStops();
        }
    }

    private isOwnControl(cell: KeyboardCell, element: HTMLElement): boolean {
        return element.closest('[data-kles-keyboard-cell]') === cell.element &&
            element.closest('table') === cell.element.closest('table');
    }

    private availableControls(cell: KeyboardCell): HTMLElement[] {
        return [...cell.element.querySelectorAll<HTMLElement>(interactiveSelector)].filter(element =>
            this.isOwnControl(cell, element) &&
            !element.matches(':disabled, [aria-disabled="true"], input[type="hidden"]') &&
            !element.closest('[hidden], [inert]') && element.getClientRects().length > 0,
        );
    }

    private updateTabStops(): void {
        const managed = new Set<HTMLElement>();
        for (const cell of this.cells) {
            this.setTabIndex(cell.element, cell === this.active ? '0' : '-1', managed);
            for (const element of cell.element.querySelectorAll<HTMLElement>(interactiveSelector)) {
                if (!this.isOwnControl(cell, element)) continue;
                managed.add(element);
                if (this.editing && cell === this.active) {
                    if (this.originalTabIndexes.has(element)) this.restoreTabIndex(element, this.originalTabIndexes.get(element)!);
                } else this.setTabIndex(element, '-1', managed);
            }
        }
        for (const [element, tabIndex] of this.originalTabIndexes) {
            if (!managed.has(element)) {
                this.restoreTabIndex(element, tabIndex);
                this.originalTabIndexes.delete(element);
            }
        }
    }

    private setTabIndex(element: HTMLElement, value: string, managed: Set<HTMLElement>): void {
        managed.add(element);
        if (!this.originalTabIndexes.has(element)) this.originalTabIndexes.set(element, element.getAttribute('tabindex'));
        if (element.getAttribute('tabindex') !== value) element.setAttribute('tabindex', value);
    }

    private restoreTabIndex(element: HTMLElement, value: string | null): void {
        if (value === null) element.removeAttribute('tabindex');
        else if (element.getAttribute('tabindex') !== value) element.setAttribute('tabindex', value);
    }
}
