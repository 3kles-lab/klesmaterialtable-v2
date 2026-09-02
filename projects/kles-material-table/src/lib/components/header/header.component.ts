import { Component, input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule, SortHeaderArrowPosition } from '@angular/material/sort';
import { IKlesHeaderFieldConfig } from '../../core/table/cell.interface';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
    selector: 'kles-header',
    template: `
        <div
            class="header"
            mat-sort-header
            [disabled]="!header().sortable"
            [arrowPosition]="header().sortArrowPosition"
            [matTooltip]="header().tooltip"
            matTooltipPosition="above"
        >
            @if (columnDragHandle()) {
                <button
                    mat-icon-button
                    cdkDragHandle
                    type="button"
                    class="column-drag-handle"
                    [attr.aria-label]="'Move column ' + header().label"
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

            @if (header().filterClearable && group().get(header().columnDef).value) {
                <div class="icon-button">
                    <button
                        mat-icon-button
                        aria-label="Clear"
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
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatSortModule, DragDropModule],
})
export class KlesHeaderComponent implements OnInit {
    header = input.required<IKlesHeaderFieldConfig & { columnDef: string; sortable?: boolean; sortArrowPosition?: SortHeaderArrowPosition }>();
    group = input.required<FormGroup<any>>();
    dragHandleSpacer = input(false);
    columnDragHandle = input(false);

    ngOnInit(): void {}
}
