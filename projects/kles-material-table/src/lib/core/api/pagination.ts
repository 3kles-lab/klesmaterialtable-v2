export interface PaginationApi {
    setPageIndex(value: number): void;
    setPageSize(value: number): void;
    setPageSizeOptions(option: number[]): void;
    firstPage(): void;
    lastPage(): void;
    enable(): void;
    disable(): void;
}
