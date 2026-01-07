import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TableComponent } from './components/table/table.component';
import { KlesTableComponent } from './kles-table.component';
import { KlesMaterialDynamicformsModule } from '@3kles/kles-material-dynamicforms';

const components = [TableComponent];
const directives = [];
const pipes = [];

@NgModule({
    imports: [CommonModule, components, KlesTableComponent, KlesMaterialDynamicformsModule],
    providers: [pipes],
    exports: [pipes, directives, KlesTableComponent],
})
export class KlesMaterialTableModule {
    static declarations = [components, directives, pipes];
}
