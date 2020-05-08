import { Component, OnInit, Input } from '@angular/core';
import { TableDataService } from '../../../services/table-data.service';
import Handsontable from 'handsontable';
declare const $: any;
@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
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
    dropdownMenu: ['freeze_column', 'unfreeze_column', '---------', 'alignment', '---------', 'undo', 'redo']
    // contextMenu: {}
  };
  id = 'data-table';
  constructor(public tableData: TableDataService) {
    Handsontable.hooks.add('afterInit', () => {
      const table = $('#data-table');
      table.find('.htCore').addClass('table');
    });
    // $(() => {
    //   $('#data-table').bootstrapTable({
    //     columns: [
    //       {
    //         field: 'id',
    //         title: 'Item ID'
    //       },
    //       {
    //         field: 'name',
    //         title: 'Item Name'
    //       },
    //       {
    //         field: 'price',
    //         title: 'Item Price'
    //       }
    //     ],
    //     data: [
    //       {
    //         id: 1,
    //         name: 'Item 1',
    //         price: '$1'
    //       },
    //       {
    //         id: 2,
    //         name: 'Item 2',
    //         price: '$2'
    //       }
    //     ]
    //   });
    // });
  }

  ngOnInit(): void {}
}
