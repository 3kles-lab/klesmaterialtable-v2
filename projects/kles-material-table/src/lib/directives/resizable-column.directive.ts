import { Directive, ElementRef, HostBinding, input, NgZone, OnChanges, OnDestroy, OnInit, Renderer2, SimpleChanges } from '@angular/core';
import { KlesColumnConfig } from '../core/table/column.interface';
import { EventsService } from '../services/features/events/events.service';
import { ColumnsService } from '../services/features/columns/columns.service';

@Directive({ selector: 'th[appResizableColumn]', standalone: true })
export class ResizableColumnDirective implements OnInit, OnChanges, OnDestroy {
    column = input.required<KlesColumnConfig>({ alias: 'appResizableColumn' });

    private readonly defaultMinWidth = 60;
    private readonly defaultMaxWidth = 1200;
    private readonly keyboardStep = 4;
    private startX = 0;
    private startWidth = 0;
    private currentWidth = 0;
    private resizing = false;
    private handle?: HTMLElement;
    private widthLabel?: HTMLElement;
    private activeCells: HTMLElement[] = [];
    private handleCleanups: Array<() => void> = [];
    private documentCleanups: Array<() => void> = [];

    @HostBinding('attr.appResizableColumn')
    get appResizableColumnAttr(): string {
        return this.column().columnDef;
    }

    constructor(
        private readonly el: ElementRef<HTMLElement>,
        private readonly renderer: Renderer2,
        private readonly zone: NgZone,
        private readonly eventsService: EventsService,
        private readonly columnsService: ColumnsService,
    ) {}

    ngOnInit(): void {
        if (this.column().resizable) this.apply();
    }

    ngOnChanges(changes: SimpleChanges): void {
        const change = changes.column;
        if (change && !change.isFirstChange() && change.previousValue.resizable !== change.currentValue.resizable) {
            change.currentValue.resizable ? this.apply() : this.remove();
        }
    }

    ngOnDestroy(): void {
        this.stopResize(false);
        this.remove();
    }

    private startResize(event: PointerEvent): void {
        if (event.button !== 0 || this.resizing) return;
        event.preventDefault();
        event.stopPropagation();

        const th = this.el.nativeElement;
        this.startX = event.clientX;
        this.startWidth = th.getBoundingClientRect().width;
        this.currentWidth = this.startWidth;
        this.resizing = true;
        this.setActiveState(true);
        this.updateWidthLabel(this.currentWidth);
        this.emitResizeStart(this.startWidth);

        this.zone.runOutsideAngular(() => {
            const doc = th.ownerDocument;
            this.documentCleanups.push(
                this.renderer.listen(doc, 'pointermove', (moveEvent: PointerEvent) => this.onPointerMove(moveEvent)),
                this.renderer.listen(doc, 'pointerup', () => this.stopResize()),
                this.renderer.listen(doc, 'pointercancel', () => this.stopResize()),
            );
        });
    }

    private onPointerMove(event: PointerEvent): void {
        if (!this.resizing) return;
        event.preventDefault();
        this.resizeTo(this.startWidth + event.clientX - this.startX, true);
    }

    private stopResize(emit = true): void {
        this.clearDocumentListeners();
        if (!this.resizing) return;

        this.resizing = false;
        this.setActiveState(false);
        if (this.currentWidth <= 0) return;

        this.columnsService.changeWidth(this.column().columnDef, { width: `${this.currentWidth}px` });
        if (emit) {
            this.zone.run(() =>
                this.eventsService.emit('columnResizeEnd', {
                    columnDef: this.column().columnDef,
                    width: this.currentWidth,
                    previousWidth: this.startWidth,
                }),
            );
        }
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();

        const previousWidth = this.el.nativeElement.getBoundingClientRect().width;
        const step = event.shiftKey ? this.keyboardStep * 4 : this.keyboardStep;
        let next = previousWidth;
        if (event.key === 'ArrowLeft') next -= step;
        if (event.key === 'ArrowRight') next += step;
        if (event.key === 'Home') next = this.getMinWidth();
        if (event.key === 'End') next = this.getMaxWidth();
        this.commitAccessibleResize(previousWidth, this.clampWidth(next));
    }

    private autoFit(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        const previousWidth = this.el.nativeElement.getBoundingClientRect().width;
        this.commitAccessibleResize(previousWidth, this.measureContentWidth());
    }

    private commitAccessibleResize(previousWidth: number, nextWidth: number): void {
        if (Math.round(previousWidth) === Math.round(nextWidth)) return;
        this.startWidth = previousWidth;
        this.currentWidth = previousWidth;
        this.emitResizeStart(previousWidth);
        this.resizeTo(nextWidth, true);
        this.columnsService.changeWidth(this.column().columnDef, { width: `${nextWidth}px` });
        this.eventsService.emit('columnResizeEnd', {
            columnDef: this.column().columnDef,
            width: nextWidth,
            previousWidth,
        });
    }

    private resizeTo(width: number, emit: boolean): void {
        const next = this.clampWidth(width);
        if (Math.round(next) === Math.round(this.currentWidth)) return;

        const previousWidth = this.currentWidth;
        this.currentWidth = next;
        this.applyWidth(next);
        this.updateWidthLabel(next);
        if (emit) {
            this.zone.run(() =>
                this.eventsService.emit('columnResize', {
                    columnDef: this.column().columnDef,
                    width: next,
                    previousWidth,
                }),
            );
        }
    }

    private emitResizeStart(width: number): void {
        this.zone.run(() =>
            this.eventsService.emit('columnResizeStart', {
                columnDef: this.column().columnDef,
                width,
                previousWidth: width,
            }),
        );
    }

    private applyWidth(px: number): void {
        for (const cell of this.getColumnCells()) {
            cell.style.width = `${px}px`;
            cell.style.minWidth = `${px}px`;
            cell.style.maxWidth = `${px}px`;
            cell.style.flex = `0 0 ${px}px`;
        }
        this.handle?.setAttribute('aria-valuenow', `${Math.round(px)}`);
    }

    private measureContentWidth(): number {
        const doc = this.el.nativeElement.ownerDocument;
        let measured = this.getMinWidth();
        for (const cell of this.getColumnCells()) {
            const clone = cell.cloneNode(true) as HTMLElement;
            clone.querySelector('.resize-handle')?.remove();
            Object.assign(clone.style, {
                position: 'fixed',
                left: '-10000px',
                top: '0',
                width: 'max-content',
                minWidth: '0',
                maxWidth: 'none',
                whiteSpace: 'nowrap',
                visibility: 'hidden',
                pointerEvents: 'none',
            });
            doc.body.appendChild(clone);
            measured = Math.max(measured, clone.getBoundingClientRect().width);
            clone.remove();
        }
        return this.clampWidth(Math.ceil(measured));
    }

    private setActiveState(active: boolean): void {
        const th = this.el.nativeElement;
        const method = active ? 'addClass' : 'removeClass';
        this.renderer[method](th, 'column-resizing');
        this.renderer[method](th.ownerDocument.body, 'kles-column-resizing');
        if (active) {
            this.renderer.setStyle(th.ownerDocument.body, 'cursor', 'col-resize');
            this.renderer.setStyle(th.ownerDocument.body, 'user-select', 'none');
        } else {
            this.renderer.removeStyle(th.ownerDocument.body, 'cursor');
            this.renderer.removeStyle(th.ownerDocument.body, 'user-select');
        }

        this.activeCells = active ? this.getColumnCells() : this.activeCells;
        for (const cell of this.activeCells) this.renderer[method](cell, 'column-resizing-cell');
        if (!active) this.activeCells = [];
    }

    private updateWidthLabel(width: number): void {
        if (this.widthLabel) this.widthLabel.textContent = `${Math.round(width)} px`;
    }

    private getColumnCells(): HTMLElement[] {
        const root = this.el.nativeElement.closest('table, mat-table, cdk-table');
        if (!root) return [];
        const columnDef = this.column().columnDef.replace(/[^a-z0-9_-]/gi, '-');
        return Array.from(root.querySelectorAll<HTMLElement>(`.mat-column-${columnDef}, .cdk-column-${columnDef}`));
    }

    private clampWidth(width: number): number {
        return Math.min(this.getMaxWidth(), Math.max(this.getMinWidth(), width));
    }

    private getMinWidth(): number {
        return this.resolveCssWidth(this.column().minWidth, this.defaultMinWidth);
    }

    private getMaxWidth(): number {
        return Math.max(this.getMinWidth(), this.resolveCssWidth(this.column().maxWidth, this.defaultMaxWidth));
    }

    private resolveCssWidth(value: string | undefined, fallback: number): number {
        if (!value) return fallback;
        const numeric = Number.parseFloat(value);
        if (value.trim().endsWith('px') && Number.isFinite(numeric)) return numeric;

        const probe = this.renderer.createElement('span') as HTMLElement;
        Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', pointerEvents: 'none', width: value });
        this.renderer.appendChild(this.el.nativeElement, probe);
        const width = probe.getBoundingClientRect().width;
        this.renderer.removeChild(this.el.nativeElement, probe);
        return width > 0 ? width : fallback;
    }

    private apply(): void {
        this.remove();
        const th = this.el.nativeElement;
        this.handle = this.renderer.createElement('span');
        this.widthLabel = this.renderer.createElement('span');
        this.renderer.addClass(th, 'resizable-column');
        this.renderer.addClass(this.handle, 'resize-handle');
        this.renderer.addClass(this.widthLabel, 'resize-width-label');
        this.renderer.appendChild(this.handle, this.widthLabel);
        this.renderer.appendChild(th, this.handle);

        this.renderer.setAttribute(this.handle, 'role', 'separator');
        this.renderer.setAttribute(this.handle, 'aria-orientation', 'vertical');
        this.renderer.setAttribute(this.handle, 'aria-label', `Redimensionner la colonne ${this.column().columnDef}`);
        this.renderer.setAttribute(this.handle, 'aria-valuemin', `${Math.round(this.getMinWidth())}`);
        this.renderer.setAttribute(this.handle, 'aria-valuemax', `${Math.round(this.getMaxWidth())}`);
        this.renderer.setAttribute(this.handle, 'aria-valuenow', `${Math.round(th.getBoundingClientRect().width)}`);
        this.renderer.setAttribute(this.handle, 'tabindex', '0');

        this.handleCleanups.push(
            this.renderer.listen(this.handle, 'pointerdown', (event: PointerEvent) => this.startResize(event)),
            this.renderer.listen(this.handle, 'dblclick', (event: MouseEvent) => this.autoFit(event)),
            this.renderer.listen(this.handle, 'keydown', (event: KeyboardEvent) => this.onKeyDown(event)),
            this.renderer.listen(this.handle, 'click', (event: MouseEvent) => event.stopPropagation()),
        );
    }

    private remove(): void {
        if (this.resizing) this.stopResize(false);
        this.clearDocumentListeners();
        this.handleCleanups.splice(0).forEach((cleanup) => cleanup());
        if (this.handle) this.renderer.removeChild(this.el.nativeElement, this.handle);
        this.renderer.removeClass(this.el.nativeElement, 'resizable-column');
        this.handle = undefined;
        this.widthLabel = undefined;
    }

    private clearDocumentListeners(): void {
        this.documentCleanups.splice(0).forEach((cleanup) => cleanup());
    }
}
