import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { shareReplay } from 'rxjs/operators';
import { PaginationService } from '../../services/pagination.service';
import { TableDataService } from '../../services/table-data.service';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit, OnDestroy {
  routeParams: any;
  routeQueryParams: any;
  tableQuery: any;
  before: string;
  after: string;

  constructor (
    public pagination: PaginationService,
    public tableData: TableDataService,
    public router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit () {
    this.routeParams = this.route.paramMap.subscribe(paramMap => {
      // 'table' is the variable name from 'admin-layout-routing'
      this.pagination.table = paramMap.get('table');
      // console.log('Table:', this.pagination.table);
      // console.log('Table Params:');
      // console.log({ ...paramMap });
      // console.log(this.tableQuery);
      // Check that this is a Non-Parameter based API Query by making sure tableQuery is undefined or empty
      if ((!this.tableQuery || (Object.keys(this.tableQuery).length === 0 && this.tableQuery.constructor === Object)) &&
        (this.tableData.tables.names.indexOf(this.pagination.table) > -1)) {
        // Converting a Non-Parameter based API Query to parameter based, so pagination works
        this.before = '';
        this.after = this.pagination.table;
        const apiQuery = {
          page: this.pagination.pageForm.value.page || 0,
          limit: this.pagination.getCurrentLimit() || 100,
          fprop: '',
          fval: '',
          dtable: this.after,
          ctable: this.before,
          search: false
        }
        this.tableData.fetchTable(apiQuery);
      }
    });
    this.routeQueryParams = this.route.queryParamMap.subscribe(paramMap => {
      const tableParams: any = { ...paramMap };
      this.tableQuery = tableParams.params;
      // console.log('Table Query:');
      // console.log({ ...paramMap.keys, ...paramMap });
      // console.log(this.tableQuery);
      // console.log(this.pagination.table);
      // Corrects the page number upon navigating to a new table
      this.tableData.page = parseInt(this.tableQuery.page, 10) ? parseInt(this.tableQuery.page, 10) : 0;
      // this.pagination.table = this.tableQuery.dtable;
      // Checks if we're trying to go to a page when there is no table specified
      if (
        this.pagination.table == null &&
        Object.keys(this.tableQuery).length === 0 &&
        this.tableQuery.constructor === Object
      ) {
        this.router.navigate(['/tables'], {
          queryParams: {
            page: 0,
            limit: 0,
            fprop: '',
            fval: '',
            dtable: 'text',
            ctable: 'text',
            search: false
          }
        });
      }
      else if (!(Object.keys(this.tableQuery).length === 0 && this.tableQuery.constructor === Object)) {
        // Checking if tableQuery is not an empty object
        this.before = this.tableQuery.ctable;
        this.after = this.tableQuery.dtable;
        this.tableData.fetchTable(this.tableQuery);
      } else if (this.tableData.tables.names.indexOf(this.pagination.table) > -1) {
        // Converting a Non-Parameter based API Query to parameter based, so pagination works
        this.before = '';
        this.after = this.pagination.table;
        const apiQuery = {
          page: this.pagination.pageForm.value.page || 0,
          limit: this.pagination.getCurrentLimit() || 100,
          fprop: '',
          fval: '',
          dtable: this.after,
          ctable: this.before,
          search: false
        }
        this.tableData.fetchTable(apiQuery);
      }
    });


  }
  ngOnDestroy () {
    this.routeParams.unsubscribe();
    this.routeQueryParams.unsubscribe();
  }
}
