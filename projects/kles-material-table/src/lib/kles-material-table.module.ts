import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TableComponent } from './components/table/table.component';
import { KlesTableComponent } from './kles-table.component';
import { KlesMaterialDynamicformsModule } from '@3kles/kles-material-dynamicforms';
import { KlesTableFooterStartDirective } from './directives/table-footer-start.directive';

const components = [TableComponent];
const directives = [KlesTableFooterStartDirective];
const pipes = [];

@NgModule({
    imports: [CommonModule, components, directives, KlesTableComponent, KlesMaterialDynamicformsModule],
    providers: [pipes],
    exports: [pipes, directives, KlesTableComponent],
})
export class KlesMaterialTableModule {
    static declarations = [components, directives, pipes];
}
