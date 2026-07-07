import { Component, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule, SortHeaderArrowPosition } from '@angular/material/sort';
import { IKlesHeaderFieldConfig } from '../../core/table/cell.interface';

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
            {{ header().label }}
        </div>

        <div class="filterHeader">
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
        }

        .filterHeader {
            display: flex;
            flex-grow: 1;
            align-items: center;
            gap: 2px;
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
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatSortModule],
})
export class KlesHeaderComponent implements OnInit {
    header = input.required<IKlesHeaderFieldConfig & { columnDef: string; sortable?: boolean; sortArrowPosition?: SortHeaderArrowPosition }>();
    group = input.required<FormGroup<any>>();

    ngOnInit(): void {}
}
