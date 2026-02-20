import {
    componentMapper,
    FieldMapper,
    KlesDynamicFieldDirective,
    KlesFieldAbstract,
    klesFieldControlFactory,
} from '@3kles/kles-material-dynamicforms';
import { IKlesHeaderFieldConfig } from '../../core/table/cell.interface';
import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule, SortHeaderArrowPosition } from '@angular/material/sort';

@FieldMapper({
    type: 'dynamicHeader',
    factory: (field: IKlesHeaderFieldConfig & { name: string }) => {
        if (field.filterComponent) {
            return componentMapper.find((c) => c.component === field.filterComponent)?.factory
                ? componentMapper.find((c) => c.component === field.filterComponent)?.factory(field)
                : klesFieldControlFactory(field);
        }
        return klesFieldControlFactory(field);
    },
})
//  @if(tableOptions?.capitalisedHeader){
//             <span>{{ field.label | capitalize }}</span>
//             }@else if(tableOptions?.uppercasedHeader){
//             <span>{{ field.label | uppercase }}</span>
//             }@else{
//             <span>{{ field.label }}</span>
//             }

//<ng-container klesDynamicHeaderFilter [group]="group" [field]="filterField"> </ng-container>
@Component({
    selector: 'kles-header',
    template: `
        <div
            class="header"
            mat-sort-header
            [disabled]="!field.sortable"
            [arrowPosition]="field.sortArrowPosition"
            [matTooltip]="field.tooltip"
            matTooltipPosition="above"
        >
            <span>{{ field.label }}</span>
        </div>
        @if (field.filterComponent && filterField) {
            <div (click)="stopPropagation($event)" class="filterHeader">
                <ng-container klesDynamicField [group]="group" [field]="filterField" [ui]="ui"> </ng-container>

                @if (field.filterClearable && group.get(field.name).value) {
                    <div class="icon-button">
                        <button
                            mat-icon-button
                            aria-label="Clear"
                            type="button"
                            class="icon-button-small"
                            (click)="group.controls[field.name].reset()"
                        >
                            <mat-icon>close</mat-icon>
                        </button>
                    </div>
                }
            </div>
        }
    `,
    // styleUrl: './dynamic-headerfilter.component.scss',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatSortModule,
        KlesDynamicFieldDirective,
        // CapitalizePipe,
        // KlesDynamicHeaderFilterDirective,
    ],
})
export class KlesFormDynamicHeaderFilterComponent extends KlesFieldAbstract implements OnInit {
    field: IKlesHeaderFieldConfig & { name: string; sortable?: boolean; sortArrowPosition?: SortHeaderArrowPosition };
    filterField: IKlesHeaderFieldConfig;
    // tableOptions: Options<any>;

    constructor() {
        super();
        this.filterField = Object.assign({}, { ...this.field, component: this.field.filterComponent, label: null, tooltip: null });
    }
    ngOnInit(): void {
        super.ngOnInit();
    }

    stopPropagation(event) {
        event.stopPropagation();
    }
}
