export interface PaginationApi {
    setPageIndex(value: number);
    setPageSize(value: number);
    firstPage();
    lastPage();
}
