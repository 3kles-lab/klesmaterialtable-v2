export interface KlesRowContext<TSource = unknown> {
    source: TSource;
    _id: string | number;
    meta: {
        depth: number;
        parentId: string | null;
    };
}
