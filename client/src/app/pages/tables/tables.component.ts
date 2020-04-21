import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Handsontable from 'handsontable';
import { TableDataService } from '../../services/table-data.service';
import $ from 'jquery';
@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit {
  hotSettings: Handsontable.GridSettings = {
    startRows: 0,
    startCols: 0,
    colHeaders: true,
    rowHeaders: true,
    stretchH: 'all',
    width: '100%',
    height: 500,
    manualColumnResize: true,
    manualRowResize: true,
    manualRowMove: true,
    dropdownMenu: ['freeze_column', 'unfreeze_column', '---------', 'alignment', '---------', 'undo', 'redo']
    // contextMenu: {}
  };
  id = 'data-table';
  routeParams: any;
  table: string;
  constructor(public tableData: TableDataService, private route: ActivatedRoute) {
    Handsontable.hooks.add('afterInit', () => {
      const table = $('#data-table');
      table.find('.htCore').addClass('table');
    });
  }

  ngOnInit() {
    this.routeParams = this.route.paramMap.subscribe(params => {
      // console.log(params.get('table'));
      // 'table' is the variable name from 'admin-layout-routing'
      this.table = params.get('table');
      console.log(this.table);
    });
  }
}
