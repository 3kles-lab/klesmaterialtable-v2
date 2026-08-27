import { ExpandedRowStore } from './expanded-row-store.service';

describe('ExpandedRowStore', () => {
    it('keeps only one expanded row by default', () => {
        const store = new ExpandedRowStore();

        store.expand('row-1');
        store.expand('row-2');

        expect(store.expandedIds).toEqual(new Set(['row-2']));
    });

    it('keeps several expanded rows when multiUnfold is enabled', () => {
        const store = new ExpandedRowStore(true);

        store.expand('row-1');
        store.expand('row-2');

        expect(store.expandedIds).toEqual(new Set(['row-1', 'row-2']));
    });

    it('collapses an expanded row when toggled', () => {
        const store = new ExpandedRowStore();

        store.toggle(1);
        store.toggle(1);

        expect(store.expandedIds.size).toBe(0);
    });
});
