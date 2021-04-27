import { Subject } from 'rxjs';
import { TableDataService } from './table-data.service';
import { Injectable } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { HotTableRegisterer } from '@handsontable/angular';
declare const $: any;

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  hotRegisterer = new HotTableRegisterer();
  pageForm = new FormGroup({});
  scrollToTableSub: Subject<any> = new Subject<void>();
  table: string;
  constructor (private tableData: TableDataService, private fb: FormBuilder) {
    this.pageForm = fb.group({
      page: [
        this.tableData.page,
        [Validators.required, Validators.min(0), Validators.max(tableData.tableLength / this.getCurrentLimit())]
      ]
    });
  }
  // This was used to test pagination
  setPage () {
    // console.log('Page: ', this.tableData.page);
    // console.log('Limit: ', this.getCurrentLimit());
    // console.log('Length: ', this.tableData.tableLength);
    this.tableData.page = 1;
    return this.tableData.page;
  }
  async gotoPage (e?: any) {
    console.log('gotoPage', e);
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
    console.log("current api query:", this.tableData.currentApiQuery);
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
      console.log('queryParams', queryParams);
      if (this.table) {
        this.hotRegisterer.getInstance('hot').scrollViewportTo(0, 0);
        await this.tableData.router
          .navigate(['/tables', this.table], {
            queryParams
          });
        return this.scrollToTableSub.next();
      } else {
        this.hotRegisterer.getInstance('hot').scrollViewportTo(0, 0);

        await this.tableData.router
          .navigate(['/tables'], {
            queryParams
          });
        return this.scrollToTableSub.next();
      }
    }
  }
  getCurrentLimit () {
    return parseInt(this.tableData.currentApiQuery?.limit, 10)
      ? this.tableData.currentApiQuery?.limit
      : parseInt(this.tableData.searchForm?.value.options.limit, 10)
        ? this.tableData.searchForm?.value.options.limit
        : 100;
  }
}
