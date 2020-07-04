import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TableDataService } from '../../services/table-data.service';
import * as $ from 'jquery';
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
  table: string;
  constructor(public tableData: TableDataService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.routeParams = this.route.paramMap.subscribe(params => {
      // 'table' is the variable name from 'admin-layout-routing'
      this.table = params.get('table');
      // Checks
      if (this.table == null) {
        this.router.navigate(['/tables'], {
          queryParams: { page: 0, limit: 0, fprop: '', fval: '', dtable: 'text', ctable: 'text' }
        });
      } else if (this.tableData.tables.names.indexOf(this.table) > -1) {
        this.before = '';
        this.after = this.table;
        this.tableData.fetchTable(this.table);
      }
      // console.log('Table: ', this.table);
    });
    this.routeQueryParams = this.route.queryParamMap.subscribe(paramMap => {
      const tableParams: any = { ...paramMap };

      this.tableQuery = tableParams.params;
      // console.log({ ...paramMap.keys, ...paramMap });
      console.log('Table Query: ', this.tableQuery);
      // Checking if tableQuery is not an empty object
      if (!(Object.keys(this.tableQuery).length === 0 && this.tableQuery.constructor === Object)) {
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
