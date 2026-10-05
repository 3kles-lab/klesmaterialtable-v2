import { AfterViewChecked, Directive, ElementRef, HostBinding, HostListener, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { KeyboardCell, KeyboardNavigationService } from '../services/features/keyboard/keyboard-navigation.service';

@Directive({
    selector: 'table[klesKeyboardGrid]',
    exportAs: 'klesKeyboardGrid',
    standalone: true,
    providers: [KeyboardNavigationService],
})
export class KeyboardGridDirective implements AfterViewChecked, OnDestroy {
    readonly navigation = inject(KeyboardNavigationService);
    private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    @HostBinding('attr.role') get role(): string | null { return this.navigation.enabled ? 'grid' : null; }
    @HostBinding('attr.aria-label') get label(): string | null { return this.navigation.enabled ? this.navigation.ariaLabel ?? null : null; }
    ngAfterViewChecked(): void { this.navigation.reconcile(); }
    ngOnDestroy(): void { this.navigation.destroy(); }
    @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent): void {
        if (event.defaultPrevented || event.isComposing || event.key !== 'Enter' || !event.ctrlKey || event.altKey || event.metaKey ||
            !(event.target instanceof Element) || event.target.closest('table') !== this.element) return;
        if (this.navigation.focusActive()) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
}

@Directive({ selector: 'td[klesKeyboardCell]', standalone: true, host: { 'data-kles-keyboard-cell': '' } })
export class KeyboardCellDirective implements KeyboardCell, OnInit, OnDestroy {
    private readonly navigation = inject(KeyboardNavigationService);
    readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    @Input({ required: true, alias: 'klesKeyboardCell' }) row!: FormGroup;
    @Input({ required: true }) columnDef!: string;
    @HostBinding('attr.role') get role(): string | null { return this.navigation.enabled ? 'gridcell' : null; }
    @HostBinding('class.kles-keyboard-cell') get enabled(): boolean { return this.navigation.enabled; }
    ngOnInit(): void { this.navigation.register(this); }
    ngOnDestroy(): void { this.navigation.unregister(this); }
    @HostListener('focusin', ['$event']) onFocusIn(event: FocusEvent): void { this.navigation.focusIn(this, event); }
    @HostListener('focusout', ['$event']) onFocusOut(event: FocusEvent): void { this.navigation.focusOut(event); }
    @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent): void { this.navigation.keyDown(this, event); }
    @HostListener('click', ['$event']) onClick(event: MouseEvent): void { this.navigation.click(this, event); }
}
