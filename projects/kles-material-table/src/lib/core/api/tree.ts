import { Signal } from '@angular/core';
import { FormGroup } from '@angular/forms';

export type TreeNodeId = string | number;

export interface TreeApi {
    readonly expandedIds: Signal<ReadonlySet<TreeNodeId>>;
    readonly loadingIds: Signal<ReadonlySet<TreeNodeId>>;
    isExpanded(id: TreeNodeId): boolean;
    isLoading(id: TreeNodeId): boolean;
    getChildren(id: TreeNodeId): FormGroup[];
    getDescendants(id: TreeNodeId): FormGroup[];
    expand(id: TreeNodeId): void;
    collapse(id: TreeNodeId): void;
    toggle(id: TreeNodeId): void;
    collapseAll(): void;
}
