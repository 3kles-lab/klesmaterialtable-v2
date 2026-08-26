import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, filter, take } from 'rxjs';
import { TreeNodeId } from '../../../core/api/tree';
import { LoaderConfig } from '../../../core/table/config.interface';
import { LOADER_CONFIG } from '../../../token';
import { ColumnsService } from '../columns/columns.service';
import { EventsService } from '../events/events.service';
import { LoaderChildrensService } from '../loader/loader-childrens.service';
import { KlesForm } from '../table/form';
import { RowFormFactory } from '../table/row-factory.service';

@Injectable()
export class TreeService<T, R> {
    private readonly loaderConfig = inject<LoaderConfig<T, R>>(LOADER_CONFIG);
    private readonly loaderChildrensService = inject(LoaderChildrensService);
    private readonly fm = inject(KlesForm);
    private readonly columnsService = inject(ColumnsService);
    private readonly rowFactory = inject(RowFormFactory);
    private readonly eventsService = inject(EventsService);
    private readonly destroyRef = inject(DestroyRef);

    private readonly expandedSubject = new BehaviorSubject<Set<TreeNodeId>>(new Set());
    readonly expandedIds$ = this.expandedSubject.asObservable();
    readonly expandedIds = signal<ReadonlySet<TreeNodeId>>(new Set());
    readonly loadingIds = signal<ReadonlySet<TreeNodeId>>(new Set());

    constructor() {
        this.fm.rowsReplaced$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.reset());
    }

    toggle(id: TreeNodeId, group?: FormGroup, depth?: number): void {
        if (this.isLoading(id)) return;
        this.isExpanded(id) ? this.collapse(id, group, depth) : this.expand(id, group, depth);
    }

    expand(id: TreeNodeId, group?: FormGroup, depth?: number): void {
        if (this.isExpanded(id) || this.isLoading(id)) return;

        const parent = group ?? this.findRow(id);
        if (!parent) return;

        const level = depth ?? parent.getRawValue()._depth ?? 0;
        if (!this.hasChildren(parent, level)) return;

        const payload = this.rowPayload(parent, level);
        this.setLoading(id, true);
        this.eventsService.emit('nodeLoadChildren', payload);

        this.loaderChildrensService
            .load(parent, level)
            .pipe(
                filter((response) => !response.loading),
                take(1),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((response) => {
                this.setLoading(id, false);

                if (response.error) {
                    this.eventsService.emit('loadError', {
                        error: response.error,
                        message: response.error?.message,
                    });
                    return;
                }

                const parentIndex = this.fm.getRows().controls.indexOf(parent);
                if (parentIndex < 0) return;

                const children = this.rowFactory.createRows(
                    this.columnsService.columns().map((column) => ({ ...column.cell?.field, name: column.columnDef })),
                    response.items,
                    { depth: level + 1, parentId: id },
                );

                this.fm.insertRows(children, parentIndex + 1);
                this.setExpanded(id, true);

                const childRows = children.map((child) => child.formGroup);
                this.eventsService.emit('nodeChildrenLoaded', {
                    ...payload,
                    children: childRows,
                    childValues: childRows.map((child) => child.getRawValue()),
                });
                this.eventsService.emit('nodeExpand', payload);
            });
    }

    collapse(id: TreeNodeId, group?: FormGroup, depth?: number): void {
        if (!this.isExpanded(id)) return;

        const parent = group ?? this.findRow(id);
        if (!parent) {
            this.setExpanded(id, false);
            return;
        }

        const descendants = this.getDescendants(id);
        const descendantIds = descendants.map((row) => row.getRawValue()._id as TreeNodeId);
        const expanded = new Set(this.expandedSubject.value);
        expanded.delete(id);
        descendantIds.forEach((descendantId) => expanded.delete(descendantId));
        this.publishExpanded(expanded);
        this.fm.deleteRowsByIds(descendantIds, { emitEvent: false });
        this.eventsService.emit('nodeCollapse', this.rowPayload(parent, depth ?? parent.getRawValue()._depth ?? 0));
    }

    collapseAll(): void {
        const childIds = this.fm
            .getRows()
            .controls.filter((row) => (row.getRawValue()._depth ?? 0) > 0)
            .map((row) => row.getRawValue()._id as TreeNodeId);
        this.publishExpanded(new Set());
        this.fm.deleteRowsByIds(childIds, { emitEvent: false });
    }

    reset(): void {
        this.publishExpanded(new Set());
        this.loadingIds.set(new Set());
    }

    isExpanded(id: TreeNodeId): boolean {
        return this.expandedSubject.value.has(id);
    }

    isLoading(id: TreeNodeId): boolean {
        return this.loadingIds().has(id);
    }

    getChildren(id: TreeNodeId): FormGroup[] {
        return this.fm.getRows().controls.filter((row) => row.getRawValue()._parentId === id);
    }

    getDescendants(id: TreeNodeId): FormGroup[] {
        const rows = this.fm.getRows().controls;
        const parentIndex = rows.findIndex((row) => row.getRawValue()._id === id);
        if (parentIndex < 0) return [];

        const parentDepth = rows[parentIndex].getRawValue()._depth ?? 0;
        const descendants: FormGroup[] = [];
        for (let index = parentIndex + 1; index < rows.length; index++) {
            const row = rows[index];
            if ((row.getRawValue()._depth ?? 0) <= parentDepth) break;
            descendants.push(row);
        }
        return descendants;
    }

    hasChildren(group: FormGroup, depth: number): boolean {
        const configured = this.loaderConfig.lines.hasChildren;
        return configured ? configured(group, depth) : typeof this.loaderConfig.lines.childrens === 'function';
    }

    private findRow(id: TreeNodeId): FormGroup | undefined {
        return this.fm.getRows().controls.find((row) => row.getRawValue()._id === id);
    }

    private setExpanded(id: TreeNodeId, expanded: boolean): void {
        const ids = new Set(this.expandedSubject.value);
        expanded ? ids.add(id) : ids.delete(id);
        this.publishExpanded(ids);
    }

    private publishExpanded(ids: Set<TreeNodeId>): void {
        this.expandedSubject.next(ids);
        this.expandedIds.set(ids);
    }

    private setLoading(id: TreeNodeId, loading: boolean): void {
        const ids = new Set(this.loadingIds());
        loading ? ids.add(id) : ids.delete(id);
        this.loadingIds.set(ids);
    }

    private rowPayload(row: FormGroup, level: number) {
        return {
            row,
            rowIndex: this.fm.getRows().controls.indexOf(row),
            value: row.value,
            rawValue: row.getRawValue(),
            level,
        };
    }
}
