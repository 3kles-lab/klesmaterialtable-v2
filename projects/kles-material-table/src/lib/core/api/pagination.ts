export interface PaginationApi {
    setPageIndex(value: number): void;
    setPageSize(value: number): void;
    firstPage(): void;
    lastPage(): void;
}
