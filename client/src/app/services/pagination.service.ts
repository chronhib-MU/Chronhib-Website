import { TableDataService } from './table-data.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  page = 1;
  constructor(private tableData: TableDataService) {}
  nextPage() {}
  previousPage() {}
  gotoPage() {}
}
