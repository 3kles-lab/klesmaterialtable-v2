import { ResolveRowClassPipe, ResolveRowStylePipe } from './row-appearance.pipe';
import { RowStyleInput } from '../core/table/config.interface';

describe('row appearance pipes', () => {
    const row = { status: 'error', amount: 42 };
    const context = { source: { priority: 'high' }, _id: 12, meta: { depth: 1, parentId: 4 } };

    it('resolves a conditional row style', () => {
        const pipe = new ResolveRowStylePipe();
        const style: RowStyleInput<{ priority: string }> = (value, status, index, rowContext) => ({
            background: value.status === 'error' && status === 'INVALID' && index === 2 && rowContext.source.priority === 'high' ? 'red' : '',
        });

        expect(
            pipe.transform(style, row, 'INVALID', 2, context),
        ).toEqual({ background: 'red' });
    });

    it('resolves conditional row classes', () => {
        const pipe = new ResolveRowClassPipe();

        expect(pipe.transform((value, _status, _index, rowContext) => ({ 'row-error': value.status === 'error' && rowContext.meta.depth === 1 }), row, 'VALID', 0, context)).toEqual({
            'row-error': true,
        });
    });

    it('supports static values and empty configuration', () => {
        expect(new ResolveRowStylePipe().transform({ color: 'blue' }, row, 'VALID', 0, context)).toEqual({ color: 'blue' });
        expect(new ResolveRowClassPipe().transform('compact', row, 'VALID', 0, context)).toBe('compact');
        expect(new ResolveRowClassPipe().transform(undefined, row, 'VALID', 0, context)).toEqual([]);
    });
});
