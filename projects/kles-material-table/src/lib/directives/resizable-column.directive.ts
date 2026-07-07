import { computed, Directive, effect, ElementRef, HostBinding, input, NgZone, OnChanges, OnInit, Renderer2, SimpleChanges } from '@angular/core';
import { KlesColumnConfig } from '../core/table/column.interface';
import { EventsService } from '../services/features/events/events.service';

@Directive({
    selector: 'th[appResizableColumn]',
    standalone: true,
})
export class ResizableColumnDirective implements OnInit, OnChanges {
    column = input.required<KlesColumnConfig>({ alias: 'appResizableColumn' });

    private minWidth = computed(() => {
        return 60; //TODO trouver une solution pour ne plus avoir une valeur en dur
    });
    private maxWidth = computed(() => {
        return 800; //TODO trouver une solution pour ne plus avoir une valeur en dur
    });

    private startX = 0;
    private startWidth = 0;
    private cleanupMove?: () => void;
    private cleanupUp?: () => void;

    private currentWidth: number = 0;
    private child: any;

    @HostBinding('attr.appResizableColumn')
    get appResizableColumnAttr() {
        return this.column().columnDef;
    }

    constructor(
        private readonly el: ElementRef<HTMLElement>,
        private readonly renderer: Renderer2,
        private readonly zone: NgZone,
        private readonly eventsService: EventsService,
    ) {}

    ngOnInit() {
        if (this.column().resizable) {
            this.apply();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes.column.isFirstChange()) {
            if (changes.column.previousValue.resizable !== changes.column.currentValue.resizable) {
                if (changes.column.currentValue.resizable) {
                    this.apply();
                } else {
                    this.remove();
                }
            }
        }
    }

    private onDown(e: MouseEvent) {
        e.preventDefault();
        this.startResize(e.clientX);
    }

    private onTouchDown(e: TouchEvent) {
        if (!e.touches?.length) return;
        e.preventDefault();
        this.startResize(e.touches[0].clientX);
    }

    private startResize(clientX: number) {
        const th = this.el.nativeElement;
        this.startX = clientX;
        this.startWidth = th.getBoundingClientRect().width;
        this.currentWidth = this.startWidth;

        this.zone.run(() => {
            this.eventsService.emit('columnResizeStart', {
                columnDef: this.column().columnDef,
                width: this.startWidth,
                previousWidth: this.startWidth,
            });
        });

        this.zone.runOutsideAngular(() => {
            const doc = th.ownerDocument;

            const onMove = (ev: MouseEvent | TouchEvent) => {
                const x = ev instanceof MouseEvent ? ev.clientX : (ev.touches?.[0]?.clientX ?? this.startX);

                const delta = x - this.startX;
                const next = Math.min(this.maxWidth(), Math.max(this.minWidth(), this.startWidth + delta));

                if (next === this.currentWidth) {
                    return;
                }

                const previousWidth = this.currentWidth;
                this.currentWidth = next;
                this.applyWidth(next);

                this.eventsService.emit('columnResize', {
                    columnDef: this.column().columnDef,
                    width: next,
                    previousWidth,
                });
            };

            const onUp = () => this.stopResize();

            this.cleanupMove = this.renderer.listen(doc, 'mousemove', onMove);
            this.renderer.listen(doc, 'touchmove', onMove);
            this.cleanupUp = this.renderer.listen(doc, 'mouseup', onUp);
            this.renderer.listen(doc, 'touchend', onUp);
        });
    }

    private stopResize() {
        this.cleanupMove?.();
        this.cleanupUp?.();
        this.cleanupMove = undefined;
        this.cleanupUp = undefined;

        if (this.currentWidth > 0) {
            this.zone.run(() => {
                this.eventsService.emit('columnResizeEnd', {
                    columnDef: this.column().columnDef,
                    width: this.currentWidth,
                    previousWidth: this.startWidth,
                });
            });
        }
    }

    private applyWidth(px: number) {
        const root = this.el.nativeElement.closest('table, mat-table, cdk-table') as HTMLElement | null;
        if (!root) return;

        const selectors = [`.mat-column-${this.column().columnDef}`, `.cdk-column-${this.column().columnDef}`];

        const cells = root.querySelectorAll<HTMLElement>(selectors.join(','));

        for (const cell of Array.from(cells)) {
            // table natif
            cell.style.width = `${px}px`;
            cell.style.minWidth = `${px}px`;
            cell.style.maxWidth = `${px}px`;

            // mode flex
            cell.style.flex = `0 0 ${px}px`;
        }
    }

    private apply() {
        this.remove();

        this.child = this.renderer.createElement('span');
        this.renderer.addClass(this.child, 'resize-handle');
        this.renderer.appendChild(this.el.nativeElement, this.child);
        this.renderer.listen(this.child, 'mousedown', (e: MouseEvent) => this.onDown(e));
        this.renderer.listen(this.child, 'touchstart', (e: TouchEvent) => this.onTouchDown(e));
    }

    private remove() {
        if (this.child) {
            this.renderer.removeChild(this.el.nativeElement, this.child);
            this.child = undefined;
        }
    }

    ngOnDestroy() {
        this.stopResize();
    }
}
