import { TableDataService } from './table-data.service';
import { Injectable } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  pageForm = new FormGroup({});
  table: string;
  constructor(private tableData: TableDataService, private fb: FormBuilder) {
    this.pageForm = fb.group({
      page: [
        0,
        [Validators.required, Validators.min(0), Validators.max(tableData.tableLength / this.getCurrentLimit())]
      ]
    });
  }
  setPage() {
    console.log('Page: ', this.tableData.page);
    console.log('Limit: ', this.getCurrentLimit());
    console.log('Length: ', this.tableData.tableLength);
    this.tableData.page = 1;
    return this.tableData.page;
  }
  nextPage() {
    if (this.tableData.page <= this.tableData.tableLength / this.getCurrentLimit()) {
      const { fprop, fval, dtable, ctable, search } = this.tableData.currentApiQuery;
      const queryParams = {
        page: this.tableData.page + 1,
        limit: this.getCurrentLimit(),
        fprop,
        fval,
        dtable,
        ctable,
        search
      };
      if (this.tableData.currentApiQuery.id) {
        queryParams['id'] = this.tableData.currentApiQuery.id;
      }
      return this.tableData.router.navigate(['/tables'], {
        queryParams
      });
    }
  }
  previousPage() {
    if (this.tableData.page >= 1) {
      const { fprop, fval, dtable, ctable, search } = this.tableData.currentApiQuery;
      const queryParams = {
        page: this.tableData.page - 1,
        limit: this.getCurrentLimit(),
        fprop,
        fval,
        dtable,
        ctable,
        search
      };
      if (this.tableData.currentApiQuery.id) {
        queryParams['id'] = this.tableData.currentApiQuery.id;
      }
      return this.tableData.router.navigate(['/tables'], {
        queryParams
      });
    }
  }
  gotoPage(e?: any) {
    console.log(e);
    // If e is undefined
    if (!e) {
      console.log(this.pageForm.value.page);
      e = {
        pageIndex: this.pageForm.value.page,
        pageSize: this.getCurrentLimit()
      };
    }
    const { pageIndex, pageSize } = e;
    console.log(pageIndex);
    if (pageIndex >= 0 && pageIndex <= this.tableData.tableLength / this.getCurrentLimit()) {
      this.tableData.page = pageIndex;
      const { fprop, fval, dtable, ctable, search } = this.tableData.currentApiQuery;
      const queryParams = {
        page: pageIndex || 0,
        limit: pageSize || 100,
        fprop,
        fval,
        dtable,
        ctable,
        search
      };
      if (this.tableData.currentApiQuery.id) {
        queryParams['id'] = this.tableData.currentApiQuery.id;
      }
      if (this.table) {
        return this.tableData.router.navigate(['/tables', this.table], {
          queryParams
        });
      } else {
        return this.tableData.router.navigate(['/tables'], {
          queryParams
        });
      }
    }
  }
  getCurrentLimit() {
    return parseInt(this.tableData.currentApiQuery?.limit, 10)
      ? this.tableData.currentApiQuery?.limit
      : parseInt(this.tableData.searchForm?.value.options.limit, 10)
      ? this.tableData.searchForm?.value.options.limit
      : 100;
  }
}
