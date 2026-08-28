import { ResolveRowClassPipe, ResolveRowStylePipe } from './row-appearance.pipe';

describe('row appearance pipes', () => {
    const row = { status: 'error', amount: 42 };

    it('resolves a conditional row style', () => {
        const pipe = new ResolveRowStylePipe();

        expect(pipe.transform((value, status, index) => ({ background: value.status === 'error' && status === 'INVALID' && index === 2 ? 'red' : '' }), row, 'INVALID', 2)).toEqual({
            background: 'red',
        });
    });

    it('resolves conditional row classes', () => {
        const pipe = new ResolveRowClassPipe();

        expect(pipe.transform((value) => ({ 'row-error': value.status === 'error' }), row, 'VALID', 0)).toEqual({ 'row-error': true });
    });

    it('supports static values and empty configuration', () => {
        expect(new ResolveRowStylePipe().transform({ color: 'blue' }, row, 'VALID', 0)).toEqual({ color: 'blue' });
        expect(new ResolveRowClassPipe().transform('compact', row, 'VALID', 0)).toBe('compact');
        expect(new ResolveRowClassPipe().transform(undefined, row, 'VALID', 0)).toEqual([]);
    });
});
