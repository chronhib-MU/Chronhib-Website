import { Component, OnInit, Input } from '@angular/core';
import { TableDataService } from '../../../services/table-data.service';
import Handsontable from 'handsontable';
import { HotTableRegisterer } from '@handsontable/angular';
import * as _ from 'lodash';

declare const $: any;
@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {
  @Input() name: any;
  private hotRegisterer = new HotTableRegisterer();
  hot;
  hotSettings: Handsontable.GridSettings = {
    startRows: 0,
    startCols: 0,
    stretchH: 'all',
    width: '100%',
    height: 500,
    hiddenColumns: { columns: [0], indicators: true },
    bindRowsWithHeaders: true,
    manualColumnResize: true,
    manualRowResize: true,
    manualRowMove: true,
    manualColumnFreeze: true,
    contextMenu: true,
    readOnly: false
  };
  id = 'data-table';
  constructor(public tableData: TableDataService) {
    Handsontable.hooks.add('afterInit', () => {
      $('.htCore').addClass('table');
    });
    // Handsontable.hooks.add('afterChange', changes => {
    //   changes.forEach(([row, prop, oldValue, newValue]) => {
    //     // Some logic...
    //   });
    // });

    //   $(() => {
    //     $('#data-table').bootstrapTable({
    //       columns: tableData.tables[name].headers.map(header => ({
    //         field: header,
    //         title: _.capitalize(header.replace('_', ' '))
    //       })),
    //       data: tableData.tables[name].data
    //     });
    //   });
  }

  ngOnInit(): void {
    this.hot = this.hotRegisterer.getInstance(this.id);
    if (this.hot) {
      // Plugins go here
      // this.hot.updateSettings({
      //   cells: function (row, col) {
      //     const cellProperties = { readOnly: false };
      //     // if (this.hot.getData()[row][col]) {
      //     cellProperties.readOnly = true;
      //     // }
      //     return cellProperties;
      //   }
      // });
    }
  }
  getTableData() {
    return this.tableData.tables[this.name].data;
  }
  getRows() {
    return this.tableData.tables[this.name].data.map(row => row.Sort_ID);
  }
  getColumns() {
    return this.tableData.tables[this.name].headers.map(header => header.replace('_', ' '));
  }
}
