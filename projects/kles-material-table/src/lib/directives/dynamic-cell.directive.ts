import { KlesDynamicFieldDirective } from '@3kles/kles-material-dynamicforms';
import { Directive, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, Type } from '@angular/core';
import { KlesColumnConfig } from '../core/table/column.interface';
import { KlesFormDynamicExpandCellComponent } from '../components/fields/cell-expand-field.component';

@Directive({
    selector: '[klesDynamicCell]',
    standalone: true,
})
export class KlesDynamicCellDirective extends KlesDynamicFieldDirective implements OnInit, OnChanges, OnDestroy {
    @Input() column: KlesColumnConfig;

    override findComponent(): Type<any> {
        if (this.column.canExpand) {
            return KlesFormDynamicExpandCellComponent;
        } else {
            return super.findComponent();
        }
    }
}
