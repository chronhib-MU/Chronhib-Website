import { Component, OnInit, Input } from '@angular/core';
import { TableDataService } from '../../../services/table-data.service';
import Handsontable from 'handsontable';
import * as _ from 'lodash';

declare const $: any;
@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {
  @Input() table: any;
  @Input() name: any;
  hotSettings: Handsontable.GridSettings = {
    startRows: 0,
    startCols: 0,
    colHeaders: true,
    rowHeaders: true,
    stretchH: 'all',
    width: '100%',
    height: 500,
    bindRowsWithHeaders: true,
    manualColumnResize: true,
    manualRowResize: true,
    manualRowMove: true,
    manualColumnFreeze: true,
    dropdownMenu: ['freeze_column', 'unfreeze_column', '---------', 'alignment', '---------', 'undo', 'redo'],
    contextMenu: true
  };
  id = 'data-table';
  constructor(public tableData: TableDataService) {
    Handsontable.hooks.add('afterInit', () => {
      const table = $('#data-table');
      table.find('.htCore').addClass('table');
    });
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

  ngOnInit(): void {}
}
