export interface ScrollbarApi {
    toTop(sb?: ScrollBehavior): void;
    toLeft(sb?: ScrollBehavior): void;
    toBottom(sb?: ScrollBehavior): void;
    toRight(sb?: ScrollBehavior): void;
    to(top: number, left: number, sb?: ScrollBehavior): void;
    getTop(): number | undefined;
}
