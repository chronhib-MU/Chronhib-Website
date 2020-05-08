import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TableDataService } from '../../services/table-data.service';
import * as $ from 'jquery';
@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit, OnDestroy {
  routeParams: any;
  table: string;
  constructor(public tableData: TableDataService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.routeParams = this.route.paramMap.subscribe(params => {
      // console.log(params.get('table'));
      // 'table' is the variable name from 'admin-layout-routing'
      this.table = params.get('table');
      console.log(this.table);
      if (this.table) {
        this.tableData.fetchTables(this.table);
      }
    });
  }
  ngOnDestroy() {
    this.routeParams.unsubscribe();
  }
}
