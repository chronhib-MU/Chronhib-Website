import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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

  constructor(
    public pagination: PaginationService,
    public tableData: TableDataService,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.routeParams = this.route.paramMap.subscribe(params => {
      // 'table' is the variable name from 'admin-layout-routing'
      this.pagination.table = params.get('table');
      // console.log('Table: ', this.pagination.table);

      if (this.tableData.tables.names.indexOf(this.pagination.table) > -1) {
        this.before = '';
        this.after = this.pagination.table;
        this.tableData.fetchTable(this.pagination.table);
      }
    });
    this.routeQueryParams = this.route.queryParamMap.subscribe(paramMap => {
      const tableParams: any = { ...paramMap };
      this.tableQuery = tableParams.params;
      // console.log({ ...paramMap.keys, ...paramMap });
      // console.log('Table Query: ', this.tableQuery);
      // Checks
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
      } else if (!(Object.keys(this.tableQuery).length === 0 && this.tableQuery.constructor === Object)) {
        // Checking if tableQuery is not an empty object
        this.before = this.tableQuery.ctable;
        this.after = this.tableQuery.dtable;
        this.tableData.fetchTable(this.tableQuery);
      }
    });
  }
  ngOnDestroy() {
    this.routeParams.unsubscribe();
    this.routeQueryParams.unsubscribe();
  }
}
