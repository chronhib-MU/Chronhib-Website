import { Component, OnInit, Input, ElementRef, ViewChild, NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TableDataService } from '../../../services/table-data.service';
import Handsontable from 'handsontable';
import { HotTableRegisterer } from '@handsontable/angular';
import * as _ from 'lodash';
import { ApiPostBody } from 'src/app/interfaces/api-post-body';
declare const $: any;
@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {
  @Input() before: string;
  @Input() after: string;
  @Input() edit: boolean;
  @ViewChild('appTable') appTable: ElementRef;
  private hotRegisterer = new HotTableRegisterer();
  wordWrap = true;
  instance = 'hot';
  // index 0 if edit mode false OR index 1 if edit mode true
  hotSettings: Handsontable.GridSettings[] = [
    {
      startRows: 0,
      startCols: 0,
      stretchH: 'all',
      width: '100%',
      hiddenColumns: { columns: [0], indicators: true },
      // hiddenColumns: { columns: [], indicators: true },
      bindRowsWithHeaders: true,
      manualColumnResize: true,
      manualRowResize: true,
      manualRowMove: false,
      manualColumnFreeze: false,
      contextMenu: false,
      readOnly: true,
      // colWidths: 150,
      wordWrap: true
    },
    {
      startRows: 0,
      startCols: 0,
      stretchH: 'all',
      width: '100%',
      hiddenColumns: { columns: [0], indicators: true },
      // hiddenColumns: { columns: [], indicators: true },
      bindRowsWithHeaders: true,
      manualColumnResize: true,
      manualRowResize: true,
      manualRowMove: true,
      manualColumnFreeze: true,
      contextMenu: true,
      readOnly: false,
      // colWidths: 150,
      wordWrap: true
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

  columns: Handsontable.ColumnSettings[] = [];
  columnsMini: Handsontable.ColumnSettings[] = [];
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
    this.routeQueryParams = this.route.queryParamMap.subscribe(async _paramMap => {
      await this.refresh();

      console.log('updated');
    });
    // need this to push the dataset
    this.fetchedTable();
    const hooks = Handsontable.hooks.getRegistered();
    hooks.forEach(hook => {
      // focuses on the results after changes cause they have before and after data
      if (hook === 'afterChange') {
        this.hotSettings[that.edit ? 1 : 0][hook] = function () {
          if (arguments[1] !== 'loadData') {
            console.log(hook, arguments);
            const tableData = this.getData();
            console.log(tableData);
            const values = [];
            arguments[0].forEach(value => {
              console.log('value:', value);
              if (value[2] !== value[3]) {
                const fieldProperty = value[1];
                values.push({
                  id: tableData[value[0]][1],
                  fieldProperty,
                  fieldValue: value[3]
                });
              }
            });
            const res = {
              table: that.after,
              command: arguments[1],
              values
            };
            console.log('Result:', res);
            if (that.edit && res.command !== 'loadData') {
              that.tableData.updateTable(res).then(() => {
                that.history.push(res);
                console.log('History: ', that.history);
                // that.refresh();
              });
            }
          }
        };
      } else if (hook === 'afterRowMove') {
        this.hotSettings[that.edit ? 1 : 0][hook] = function () {
          console.log(this);
          const tableData = this.getData();
          const newValues = tableData.map((row, i) => {
            const sortId = i + 1;
            return { ID: row['1'], Sort_ID: sortId };
          });

          const res: ApiPostBody = {
            table: that.after,
            command: 'moveRow',
            values: [newValues]
          };
          console.log('Result:', res);
          if (that.edit) {
            that.tableData.updateTable(res).then(() => {
              that.history.push(res);
              console.log('History: ', that.history);
              // that.refresh();
            });
          }
        };
      } else if (hook === 'afterCreateRow') {
        this.hotSettings[that.edit ? 1 : 0][hook] = function () {
          console.log(this);
          const tableData = this.getData();
          const newValues = tableData.map((row, i) => {
            const sortId = i + 1;
            return { ID: row['1'], Sort_ID: sortId };
          });
          const res: ApiPostBody = {
            table: that.after,
            command: 'createRow',
            values: [newValues]
          };
          console.log('Result:', res);
          if (that.edit) {
            that.tableData.updateTable(res).then(() => {
              that.history.push(res);
              console.log('History: ', that.history);
              // that.refresh();
            });
          }
        };
      }
    });

    // $hooksList = $('#hooksList');
  }
  async fetchedTable() {
    const { data } = await this.tableData.fetchedTable.toPromise();
    // console.table('After:', this.after);
    // console.table('Before:', this.before);
    // console.log(`Datatable[${this.after}]: `, data.afterTable);

    // If this is a scenario where there is a before table
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
    this.columnsMini = [];

    // If this is a scenario where there is a before table
    if (this.before !== this.after && this.before !== '') {
      // For the mini table
      this.dataTable[this.before].headers.forEach((header: string) => {
        this.columnsMini.push(this.columnSettings(this, this.before, header));
      });
      this.getTableData(this.before);
      // Plugins go here
      console.log('What is this.before?', this.before);
      if (this.before === 'sentences') {
        // console.log(this.dataTable[this.before]);
        // console.log([...Array((this.dataTable[this.before].headers.length)).keys()]);
        const headerArr = [...this.dataTable[this.before].headers];
        const tableFilter = ['Textual_Unit','Translation'];
        this.hotRegisterer.getInstance(this.instance + 'Mini').updateSettings({
          hiddenColumns: {
            columns: headerArr
              .map((val, i) => i)
              .filter((_val, i) => {
                console.log(i, headerArr[i], i !== 7);
                return !tableFilter.includes(headerArr[i]);
              })
          }
        });
      }
    }
    this.dataTable[this.after].headers.forEach((header: string) => {
      // For the main table
      this.columns.push(this.columnSettings(this, this.after, header));
    });

    // this.dataset = [];
    // this.dataTable[this.after].data.forEach((row: any) => {
    //   this.dataset.push(row);
    // });
    // console.log(this.columns, this.dataset);
    this.getTableData(this.after);
  }
  columnSettings(that, table, header) {
    return {
      data: header,
      title: _.capitalize(header.replace(/_/g, ' ')),
      type: 'text',
      colWidths: function (index: number): number | string {
        // console.log('Index: ', index + ' ' + that.dataTable[that.after].headers[index]);
        const indexTitle = that.dataTable[that.after].headers[index];
        switch (table) {
          // column widths for text table
          case 'text':
            switch (indexTitle) {
              case 'ID':
                return 50;
              case 'Text_ID':
                return 75;
              case 'MSS':
                return 400;
              case 'Digital_MSS':
                return 200;
              case 'Date':
                return 300;
              case 'Edition':
                return 300;
              case 'Dating_Criteria':
                return 600;
              case 'Created_Date':
                return 100;
              case 'MS_Checked':
                return 300;
              case 'Reason_Of_MS_Choice_And_Editorial_Policy':
                return 300;
              default:
                return;
            }
          // column widths for sentences table
          case 'sentences':
            switch (indexTitle) {
              case 'ID':
                return 50;
              case 'Text_ID':
                return 75;
              case 'Textual_Unit':
                return 300;
              case 'Translation':
                return 300;
              default:
                return;
            }
          // column widths for morphology table
          case 'morphology':
            switch (indexTitle) {
              case 'Text_ID':
                return 100;
              case 'Comments':
                return 250;
              default:
                return;
            }
          // column widths for lemmata table
          case 'lemmata':
            switch (indexTitle) {
              case 'Etymology':
                return 200;
              case 'Comments':
                return 300;
              case 'DIL_Headword':
                return 200;
              default:
                return;
            }
          default:
            return 150;
        }
      },
      renderer: function (_instance, td, _row, _col, prop, value, _cellProperties) {
        // console.log(that);

        const escaped = Handsontable.helper.stringify(value);
        // console.log('Renderer Variables: ', { instance, td, row, col, prop, value, cellProperties });
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
          if (
            (table === 'text' && prop === 'Text_ID') ||
            (table === 'sentences' && prop === 'Text_Unit_ID') ||
            (table === 'morphology' && prop === 'Lemma')
          ) {
            const dtableIndex = that.tableData.tables.names.indexOf(table) + 1;

            const queryParams = {
              page: 0,
              limit: 0,
              fprop: prop,
              fval: value,
              dtable: that.tableData.tables.names[dtableIndex],
              ctable: table
            };
            const a = document.createElement('span');
            const linkText = document.createTextNode(value);
            a.appendChild(linkText);
            a.className = 'btn-link';
            // a.href = '/tables?' + queryString;
            Handsontable.dom.addEvent(a, 'mousedown', function (event) {
              event.preventDefault();
            });
            Handsontable.dom.empty(td);
            a.addEventListener('click', () => {
              console.log(that);

              that.ngZone.run(() => that.router.navigate(['/tables'], { queryParams }));
            });
            td.appendChild(a);
            td.style.textAlign = 'center';
          } else {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
            td.style.whiteSpace = that.wordWrap ? 'normal' : 'nowrap';
            return td;
          }
        }
        td.style.whiteSpace = that.wordWrap ? 'normal' : 'nowrap';
        return td;
      }
    };
  }
  getTableData(table) {
    return this.dataTable[table].data;
  }
  getRows(table) {
    return this.dataTable[table].data.map((row: { Sort_ID: any }) => row.Sort_ID);
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

    this.getTableData(this.after);
    // console.log(this.getTableData(this.after));
    // const search = location.search.substring(1);
    // console.log('search: ', search);

    // this.router.navigateByUrl('/tables?' + search);
    // await this.tableData.fetchTable(this.tableData.currentApiQuery);
    this.fetchedTable();

    //   this.hotInstance = this.hotRegisterer.getInstance(this.instance);
    //   this.hotInstance.loadData(this.getTableData(this.after));
    //   this.hotInstance.render();
  }
  toggleMode(variable) {
    if (variable === 'edit') {
      this.edit = !this.edit;
      this.hotInstance = this.hotRegisterer.getInstance(this.instance);
      this.hotInstance.updateSettings({
        manualRowMove: this.edit,
        manualColumnFreeze: this.edit,
        contextMenu: this.edit,
        readOnly: !this.edit
      });
    } else {
      console.log(variable, this.wordWrap);
      this.wordWrap = !this.wordWrap;
      this.fetchedTable();
    }
  }
  changeID(direction) {
    const urlParams = new URLSearchParams(window.location.search);
    console.log(urlParams.toString());
    if (urlParams.has('fval') && (this.before === 'text' || this.before === 'sentences')) {
      console.log('Got it: ', urlParams.get('fval'));
      let fVal = urlParams.get('fval');
      const fValArr = fVal.split('-');
      let numVal = parseInt(fValArr[fValArr.length - 1], 10);
      direction === 'next' ? numVal++ : numVal--;
      if (numVal === 0) {
        return;
      }
      if (fValArr.length === 1) {
        // if its the textID from the Text table e.g. 0001
        const stringVal = numVal.toString(); // convert numVal back to String
        fVal =
          Array(4 - stringVal.length)
            .fill('0')
            .join('') + stringVal;
      } else {
        // if its the text_unit_ID from the Sentences table e.g. S0001-1
        fVal = `${fValArr[0]}-${numVal}`;
        console.log(fVal);
      }
      urlParams.set('fval', fVal);
      console.log(urlParams.toString());
      const queryParams = JSON.parse(
        '{"' + decodeURI(urlParams.toString()).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}'
      );
      console.log(queryParams);
      this.router.navigate(['/tables'], { queryParams });
    }
  }
  goBack() {
    this.location.back();
  }
  goForward() {
    this.location.forward();
  }
  scrollToTable() {
    console.log('App Table Height: ', this.appTable.nativeElement.scrollHeight);
    // window.scrollTo({ top: this.appTable.nativeElement.scrollHeight, behavior: 'smooth' })
    this.appTable.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
