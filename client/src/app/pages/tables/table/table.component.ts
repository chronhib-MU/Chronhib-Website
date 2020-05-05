import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { TableDataService } from '../../../services/table-data.service';
import Handsontable from 'handsontable';
import $ from 'jquery';
@Component({
  selector: 'app-table',
  // changeDetection: ChangeDetectionStrategy.OnPush,
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
  }

  ngOnInit(): void {}
}
