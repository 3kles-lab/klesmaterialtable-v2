export interface Destroyable {
    destroy(): void;
}

export function isDestroyable(value: unknown): value is Destroyable {
    return value !== null && typeof value === 'object' &&
        typeof (value as Destroyable).destroy === 'function';
}