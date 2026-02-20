import { KlesDynamicFieldDirective, KlesFieldAbstract } from '@3kles/kles-material-dynamicforms';
import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RenderService } from '../../services/features/render/render.service';
import { ExpandedRowStore } from '../../services/store/expanded-row-store.service';
import { filter, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'kles-cell',
    template: ` <button matIconButton (click)="expand(); stopPropagation($event)">
            @if (this.expanded()) {
                <mat-icon>keyboard_arrow_up</mat-icon>
            } @else {
                <mat-icon>keyboard_arrow_down</mat-icon>
            }
        </button>
        <ng-container klesDynamicField [group]="group" [field]="field" [ui]="ui"></ng-container>`,
    styles: `
        :host {
            display: flex;
            flex-direction: row;
            justify-content: inherit;
            gap: 8px;
        }
    `,
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule, KlesDynamicFieldDirective],
})
export class KlesFormDynamicExpandCellComponent extends KlesFieldAbstract implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private expandedRowStore = inject(ExpandedRowStore);

    expanded = computed(() => {
        return this.ui.get(this.field.name).value().expanded ?? false;
    });

    ngOnInit(): void {
        super.ngOnInit();
        this.listen();
    }

    stopPropagation(event) {
        event.stopPropagation();
    }

    expand() {
        this.expandedRowStore.toggle(this.group.value._id);
    }

    private listen() {
        this.expandedRowStore.expandedIds$
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                map((ids) => {
                    return ids.has(this.group.value._id);
                }),
            )
            .subscribe((expanded) => {
                this.ui.get(this.field.name)?.patchValue({ expanded });
            });
    }
}
