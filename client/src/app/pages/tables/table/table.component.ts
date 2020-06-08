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
  @Input() name: any = 'text';
  private hotRegisterer = new HotTableRegisterer();
  instance = 'hot';
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
  headers: any;
  dataOfTable: any[] = [];
  dataset: any[] = [];

  columns: any[] = [];
  hotInstance = this.hotRegisterer.getInstance(this.instance);
  constructor(public tableData: TableDataService) {
    Handsontable.hooks.add('afterInit', () => {
      $('.htCore').addClass('table');
    });
    // Handsontable.hooks.add('afterChange', changes => {
    //   changes.forEach(([row, prop, oldValue, newValue]) => {
    //     // Some logic...
    //   });
    // });
  }

  ngOnInit(): void {
    this.dataOfTable = this.getTableData();
    this.headers = Object.keys(this.dataOfTable[0]);
    this.headers.forEach(header => {
      this.columns.push({
        data: header,
        title: _.capitalize(header.replace(/_/g, ' ')),
        type: 'text',
        renderer: function (instance, td, row, col, prop, value, cellProperties) {
          const escaped = Handsontable.helper.stringify(value);
          let img = null;

          if (escaped.indexOf('http') === 0) {
            img = document.createElement('IMG');
            img.src = value;

            Handsontable.dom.addEvent(img, 'mousedown', function (event) {
              event.preventDefault();
            });

            Handsontable.dom.empty(td);
            td.appendChild(img);
          } else {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
          }

          return td;
        }
      });
    });
    this.dataOfTable.forEach(row => {
      this.dataset.push(row);
    });
    console.log(this.columns, this.dataset);
    // Plugins go here
    // this.hotInstance.updateSettings({
    //   cells: function (row, col) {
    //     const cellProperties = { readOnly: false };
    //     // if (this.hot.getData()[row][col]) {
    //     cellProperties.readOnly = true;
    //     // }
    //     return cellProperties;
    //   }
    // });
  }

  getTableData() {
    return this.tableData.tables[this.name].data;
  }
  getRows() {
    return this.tableData.tables[this.name].data.map(row => row.Sort_ID);
  }
  undo() {
    this.hotInstance = this.hotRegisterer.getInstance(this.instance);
    if ((this.hotInstance as any).isUndoAvailable()) {
      (this.hotInstance as any).undo();
    }
  }
  redo() {
    this.hotInstance = this.hotRegisterer.getInstance(this.instance);
    if ((this.hotInstance as any).isRedoAvailable()) {
      (this.hotInstance as any).redo();
    }
  }
}
