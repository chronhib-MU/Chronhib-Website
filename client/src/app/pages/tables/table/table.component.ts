import { Component, OnInit, Input, NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
  // TODO: this needs to handle tableQuery
  @Input() before;
  @Input() after;
  @Input() edit: boolean;
  private hotRegisterer = new HotTableRegisterer();
  instance = 'hot';
  // index 0 if edit mode false OR index 1 if edit mode true
  hotSettings: Handsontable.GridSettings[] = [
    {
      startRows: 0,
      startCols: 0,
      stretchH: 'all',
      width: '100%',
      height: 500,
      hiddenColumns: { columns: [0], indicators: true },
      // hiddenColumns: { columns: [], indicators: true },
      bindRowsWithHeaders: true,
      manualColumnResize: true,
      manualRowResize: true,
      manualRowMove: false,
      manualColumnFreeze: false,
      contextMenu: false,
      readOnly: true,
      colWidths: 150
    },
    {
      startRows: 0,
      startCols: 0,
      stretchH: 'all',
      width: '100%',
      height: 500,
      hiddenColumns: { columns: [0], indicators: true },
      // hiddenColumns: { columns: [], indicators: true },
      bindRowsWithHeaders: true,
      manualColumnResize: true,
      manualRowResize: true,
      manualRowMove: true,
      manualColumnFreeze: true,
      contextMenu: true,
      readOnly: false,
      colWidths: 150
    }
  ];
  headers: any;
  dataTable: any = {
    text: {
      headers: [],
      data: []
    },
    sentences: {
      headers: [],
      data: []
    },
    morphology: {
      headers: [],
      data: []
    },
    lemmata: {
      headers: [],
      data: []
    }
  };
  dataset: any[] = [];

  columns: any[] = [];
  hotInstance = this.hotRegisterer.getInstance(this.instance);
  history = [];
  tableQuery: any;
  table: string;
  routeParams: any;
  routeQueryParams: any;

  constructor(
    public tableData: TableDataService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private ngZone: NgZone
  ) {
    this.dataTable = {
      text: this.tableData.tables.text,
      sentences: this.tableData.tables.sentences,
      morphology: this.tableData.tables.morphology,
      lemmata: this.tableData.tables.lemmata
    };
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
    const that = this;
    this.routeQueryParams = this.route.queryParamMap.subscribe(paramMap => {
      setTimeout(() => {
        console.log('updated');
        // infinitely update the table by getting updates from the db
        this.refresh();
      }, 1000);
    });
    // need this to push the dataset
    this.fetchedTable();

    const hooks = Handsontable.hooks.getRegistered();
    hooks.forEach(hook => {
      // let checked = '';
      // focuses on the results after changes cause they have before and after data
      if (hook === 'afterChange') {
        // checked = 'checked';
        this.hotSettings[that.edit ? 1 : 0][hook] = function () {
          console.log(hook, arguments);
          const data = arguments;
          const res = {
            table: that.after,
            command: data[1],
            values: data[0]
          };
          console.log('Result:', res);
          if (that.edit && res.command !== 'loadData') {
            that.tableData.updateTable(res);
            that.history.push(res);
            console.log(hook, that.history);
          }
        };
      }
    });

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
    // $hooksList = $('#hooksList');
  }
  fetchedTable() {
    const that = this;
    const fetchedTable$ = this.tableData.fetchedTable.subscribe(({ data }) => {
      // console.table('After:', this.after);
      // console.table('Before:', this.before);
      // console.log(`Datatable[${this.after}]: `, data.afterTable);
      if (this.before !== this.after && this.before !== '') {
        this.dataTable[this.before].data = data.beforeTable;
        this.dataTable[this.before].headers = Object.keys(this.dataTable[this.before].data[0]);
        this.dataTable[this.before].headers.splice(0, 0, this.dataTable[this.before].headers.pop());
      }
      this.dataTable[this.after].data = data.afterTable;
      this.dataTable[this.after].headers = Object.keys(this.dataTable[this.after].data[0]);
      this.dataTable[this.after].headers.splice(0, 0, this.dataTable[this.after].headers.pop());
      // console.table(this.dataTable);
      this.columns = [];
      this.dataTable[this.after].headers.forEach(header => {
        this.columns.push({
          data: header,
          title: _.capitalize(header.replace(/_/g, ' ')),
          type: 'text',
          renderer: function (instance, td, row, col, prop, value, cellProperties) {
            const escaped = Handsontable.helper.stringify(value);
            // console.log('Renderer Variables: ', { row, col, prop, value, cellProperties });
            // if (escaped.indexOf('http') === 0) {
            if (escaped.indexOf('http') === 0) {
              // Create anchor element.
              const a = document.createElement('a');
              // Create the text node for anchor element
              const link = document.createTextNode(value);
              // Append the text node to anchor element
              a.appendChild(link);
              // Set the title
              a.title = value;
              // Set the href property
              a.href = value;
              Handsontable.dom.addEvent(a, 'mousedown', function (event) {
                event.preventDefault();
              });

              Handsontable.dom.empty(td);
              td.appendChild(a);
              // Make it centered
              td.style.textAlign = 'center';
            } else {
              const dtableIndex = that.tableData.tables.names.indexOf(that.after) + 1;

              const queryParams = {
                page: 0,
                limit: 0,
                fprop: prop,
                fval: value,
                dtable: that.tableData.tables.names[dtableIndex],
                ctable: that.after
              };
              const queryString = Object.keys(queryParams)
                .map(key => key + '=' + queryParams[key])
                .join('&');
              const a = document.createElement('span');
              const linkText = document.createTextNode(value);
              a.appendChild(linkText);
              a.className = 'btn-link';
              // a.href = '/tables?' + queryString;
              Handsontable.dom.addEvent(a, 'mousedown', function (event) {
                event.preventDefault();
              });
              Handsontable.dom.empty(td);

              if (
                (that.after === 'text' && prop === 'Text_ID') ||
                (that.after === 'sentences' && prop === 'Textual_Unit_ID') ||
                (that.after === 'morphology' && prop === 'Lemma')
              ) {
                a.addEventListener('click', () => {
                  that.ngZone.run(() => that.router.navigate(['/tables'], { queryParams }));
                });
              } else {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                return td;
              }
              td.appendChild(a);
              td.style.textAlign = 'center';
            }

            return td;
          }
        });
      });

      this.dataset = [];
      this.dataTable[this.after].data.forEach(row => {
        this.dataset.push(row);
      });
      // console.log(this.columns, this.dataset);
      fetchedTable$.unsubscribe();
      this.getTableData();
    });
  }
  getTableData() {
    return this.dataTable[this.after].data;
  }
  getRows() {
    return this.dataTable[this.after].data.map(row => row.Sort_ID);
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
  refresh() {
    // const queryString = window.location.href;

    this.getTableData();
    // console.log(this.getTableData());
    // const search = location.search.substring(1);
    // console.log('search: ', search);

    // this.router.navigateByUrl('/tables?' + search);
    setTimeout(() => this.fetchedTable(), 1000);
    // this.hotInstance = this.hotRegisterer.getInstance(this.instance);
    // this.hotInstance.loadData(this.getTableData());
    // this.hotInstance.render();
  }
  toggleEditMode() {
    this.edit = !this.edit;
    this.hotInstance = this.hotRegisterer.getInstance(this.instance);
    this.hotInstance.updateSettings({
      manualRowMove: this.edit,
      manualColumnFreeze: this.edit,
      contextMenu: this.edit,
      readOnly: !this.edit
    });
  }
  goBack() {
    this.location.back();
  }
  goForward() {
    this.location.forward();
  }
}
