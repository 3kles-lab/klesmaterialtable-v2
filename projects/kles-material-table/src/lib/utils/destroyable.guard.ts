export interface Destroyable {
    destroy();
}

export function isDestroyable(value: unknown): value is Destroyable {
    return value !== null && typeof value === 'object' &&
        typeof (value as Destroyable).destroy === 'function';
}