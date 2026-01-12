import { ScrollbarService } from "../../services/features/scrollbar/scrollbar.service";
import { IKlesDataSource } from "../datasource/datasource.interface";

export interface ITable {
    dataSource: IKlesDataSource;
    scrollbarService: ScrollbarService
    
}
