import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule, SortHeaderArrowPosition } from '@angular/material/sort';
import { IKlesHeaderFieldConfig } from '../../core/table/cell.interface';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { map, of, startWith, switchMap } from 'rxjs';
import { KlesTableIntl } from '../table/table-intl';

@Component({
    selector: 'kles-header',
    template: `
        <div
            class="header"
            mat-sort-header
            [disabled]="!header().sortable"
            [arrowPosition]="header().sortArrowPosition ?? 'after'"
            [matTooltip]="header().tooltip"
            matTooltipPosition="above"
        >
            @if (columnDragHandle()) {
                <button
                    mat-icon-button
                    cdkDragHandle
                    type="button"
                    class="column-drag-handle"
                    [attr.aria-label]="labels().moveColumn(header().label ?? header().columnDef)"
                    (click)="$event.stopPropagation()"
                >
                    <mat-icon>drag_indicator</mat-icon>
                </button>
            }
            {{ header().label }}
        </div>

        <div class="filterHeader" [class.has-drag-handle-spacer]="dragHandleSpacer()">
            @if (dragHandleSpacer()) {
                <span class="drag-handle-spacer" aria-hidden="true"></span>
            }
            <div class="field">
                <ng-content></ng-content>
            </div>

            @if (header().filterClearable && filterValue()) {
                <div class="icon-button">
                    <button
                        mat-icon-button
                        [attr.aria-label]="labels().clearFilter"
                        type="button"
                        class="icon-button-small"
                        (click)="group().controls[header().columnDef].reset()"
                    >
                        <mat-icon>close</mat-icon>
                    </button>
                </div>
            }
        </div>
    `,
    styles: `
        :host {
            padding-bottom: 10px;
            display: flex;
            flex-direction: column;
            justify-content: inherit;
        }

        .header {
            flex-grow: 1;
            align-items: center;
            display: flex;
            justify-content: inherit;
            gap: 4px;
        }

        .column-drag-handle {
            flex: 0 0 28px;
            width: 28px;
            height: 28px;
            padding: 2px;
            cursor: grab;
            color: currentColor;
            opacity: 0.65;
        }

        .column-drag-handle:active {
            cursor: grabbing;
        }

        .column-drag-handle mat-icon {
            width: 20px;
            height: 20px;
            font-size: 20px;
            line-height: 20px;
        }

        .filterHeader {
            display: flex;
            flex-grow: 1;
            align-items: center;
            gap: 2px;
        }

        .filterHeader.has-drag-handle-spacer {
            gap: 5px;
        }

        .drag-handle-spacer {
            flex: 0 0 32px;
            width: 32px;
            height: 32px;
        }

        .field {
            flex-grow: 1;
            text-align: center;
        }

        .icon-button button[mat-icon-button] {
            &.icon-button-small {
                width: 24px;
                height: 24px;
                line-height: 24px;
                padding: 0;

                .mat-icon {
                    font-size: 18px;
                    width: 18px;
                    height: 18px;
                    line-height: 18px;
                }

                .mat-mdc-button-ripple {
                    font-size: inherit;
                    width: inherit;
                    height: inherit;
                    line-height: inherit;
                }
            }
        }
    `,
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatSortModule, DragDropModule],
})
export class KlesHeaderComponent {
    private readonly intl = inject(KlesTableIntl);

    header = input.required<IKlesHeaderFieldConfig & { columnDef: string; sortable?: boolean; sortArrowPosition?: SortHeaderArrowPosition }>();
    group = input.required<FormGroup<any>>();
    dragHandleSpacer = input(false);
    columnDragHandle = input(false);

    protected readonly labels = toSignal(
        this.intl.changes.pipe(
            startWith(undefined),
            map(() => ({
                clearFilter: this.intl.clearFilterLabel,
                moveColumn: this.intl.moveColumnLabel.bind(this.intl),
            })),
        ),
        { requireSync: true },
    );

    readonly filterValue = toSignal(
        toObservable(computed(() => this.group().get(this.header().columnDef))).pipe(
            switchMap((control) => (control ? control.valueChanges.pipe(startWith(control.value)) : of(null))),
        ),
        { initialValue: null },
    );
}
