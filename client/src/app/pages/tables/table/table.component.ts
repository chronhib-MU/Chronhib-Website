import { AuthService } from './../../../services/auth.service';
import { Component, OnInit, Input, ElementRef, ViewChild, NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TableDataService } from '../../../services/table-data.service';
import Handsontable from 'handsontable';
import { HotTableRegisterer } from '@handsontable/angular';
import { ApiPostBody } from '../../../interfaces/api-post-body';
import * as _ from 'lodash';
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
  sort = false;
  ref = false;
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
      manualColumnMove: true,
      manualColumnFreeze: false,
      contextMenu: false,
      readOnly: true,
      // colWidths: 150,
      multiColumnSorting: false,
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
      manualColumnMove: true,
      manualColumnFreeze: true,
      contextMenu: true,
      readOnly: false,
      // colWidths: 150,
      multiColumnSorting: false,
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
  searchTable = { headers: [], data: [] };

  dataset: any[] = [];

  columns: Handsontable.ColumnSettings[] = [];
  columnsMini: Handsontable.ColumnSettings[] = [];
  hotInstance = this.hotRegisterer.getInstance(this.instance);
  history = [];
  tableQuery: any;
  routeParams: any;
  routeQueryParams: any;

  constructor(
    public tableData: TableDataService,
    private authService: AuthService,
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
    this.searchTable = this.tableData.searchTable;

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
    this.sort = false;

    this.routeQueryParams = this.route.queryParamMap.subscribe(async _paramMap => {
      this.sort = false;
      this.refresh();

      // console.log('updated');
    });
    // need this to push the dataset
    // this.fetchedTable();
    const hooks = Handsontable.hooks.getRegistered();
    hooks.forEach(hook => {
      if (this.after !== 'search') {
        // focuses on the results after changes cause they have before and after data
        if (hook === 'afterChange') {
          this.hotSettings[that.edit ? 1 : 0][hook] = function () {
            if (arguments[1] !== 'loadData') {
              // console.log(hook, arguments);
              const tableData = this.getData();
              // console.log(tableData);
              const values = [];
              arguments[0].forEach((value: any[]) => {
                // console.log('value:', value);
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
                values,
                user: that.authService.user
              };
              // Checks for which table we're making changes on
              if (this.rootElement.id === 'hotMini') {
                res.table = that.before;
              }
              // console.log('Result:', res);
              if (that.edit && res.command !== 'loadData') {
                that.tableData.updateTable(res).then(() => {
                  that.history.push(res);
                  // console.log('History: ', that.history);
                  // that.refresh();
                });
              }
            }
          };
        } else if (hook === 'afterRowMove') {
          // TODO: refactor this
          this.hotSettings[that.edit ? 1 : 0][hook] = function () {
            // console.log(this);
            const tableData = this.getData();
            const newValues = tableData.map((row: { [x: string]: any }, i: number) => {
              const sortId = i + 1;
              return { ID: row['1'], Sort_ID: sortId };
            });

            const res: ApiPostBody = {
              table: that.after,
              command: 'moveRow',
              values: [newValues],
              user: that.authService.user
            };
            // console.log('Result:', res);
            // Checks for which table we're making changes on
            if (this.rootElement.id === 'hotMini') {
              res.table = that.before;
            }
            // console.log('Result:', res);
            if (that.edit) {
              that.tableData.updateTable(res).then(() => {
                that.history.push(res);
                // console.log('History: ', that.history);
                // that.refresh();
              });
            }
          };
        } else if (hook === 'afterCreateRow') {
          // TODO: And this
          this.hotSettings[that.edit ? 1 : 0][hook] = function () {
            // console.log(this);
            const tableData = this.getData();
            const newValues = tableData.map((row: { [x: string]: any }, i: number) => {
              const sortId = i + 1;
              return { ID: row['1'], Sort_ID: sortId };
            });
            const res: ApiPostBody = {
              table: that.after,
              command: 'createRow',
              values: [newValues],
              user: that.authService.user
            };
            console.log('Result:', res);
            // Checks for which table we're making changes on
            if (this.rootElement.id === 'hotMini') {
              res.table = that.before;
            }
            // console.log('Result:', res);
            if (that.edit) {
              that.tableData.updateTable(res).then(() => {
                that.history.push(res);
                console.log('History: ', that.history);
                that.refresh();
              });
            }
          };
        }
      }
    });

    // $hooksList = $('#hooksList');
  }
  async fetchedTable() {
    if (this.hotRegisterer.getInstance(this.instance + 'Mini')) {
      this.hotRegisterer.getInstance(this.instance + 'Mini').updateSettings({
        multiColumnSorting: this.sort
      });
    }
    if (this.hotRegisterer.getInstance(this.instance)) {
      this.hotRegisterer.getInstance(this.instance).updateSettings({
        multiColumnSorting: this.sort
      });
    }
    try {
      const { data } = await this.tableData.fetchedTable.toPromise();
      console.table('After: ' + this.after);
      console.table('Before: ' + this.before);
      // console.log(`Datatable[${this.after}]: `, data.afterTable);

      // If this is a scenario where there is a before table
      if (this.before && this.before !== this.after) {
        this.dataTable[this.before].data = data.beforeTable;
        this.dataTable[this.before].headers = Object.keys(this.dataTable[this.before].data[0]);
        // Moves Sort_ID to first while remove it from last in the before table
        this.dataTable[this.before].headers.splice(0, 0, this.dataTable[this.before].headers.pop());
      }
      if (this.after === 'search') {
        this.searchTable.data = data.afterTable;
        if (this.searchTable.data[0]) {
          this.searchTable.headers = Object.keys(this.searchTable.data[0]);
          // Moves Sort_ID to first while remove it from last in the after table
          // console.table(this.searchTable);
        }
      } else {
        this.dataTable[this.after].data = data.afterTable;
        this.dataTable[this.after].headers = Object.keys(this.dataTable[this.after].data[0]);
        // Moves Sort_ID to first while remove it from last in the after table
        this.dataTable[this.after].headers.splice(0, 0, this.dataTable[this.after].headers.pop());
        // console.table(this.dataTable);
      }
    } catch (error) {
      console.error('Invalid request made!', error);
      return error;
    }
    this.columns = [];
    this.columnsMini = [];

    if (this.before && this.before !== this.after) {
      await this.dataTable[this.before].headers.forEach((header: string) => {
        return this.columnRendererSettings(header, this.before, 'columnsMini');
      });
    }
    this.after === 'search'
      ? await this.searchTable.headers.forEach((header: string) => {
          return this.columnRendererSettings(header, this.after, 'columns');
        })
      : await this.dataTable[this.after].headers.forEach((header: string) => {
          return this.columnRendererSettings(header, this.after, 'columns');
        });

    // this.dataset = [];
    // this.dataTable[this.after].data.forEach((row: any) => {
    //   this.dataset.push(row);
    // });
    // console.log(this.columns, this.dataset);
    const columnFilter = ['Sort_ID'];
    if (this.hotRegisterer.getInstance(this.instance + 'Mini')) {
      const beforeColWidths = this.dataTable[this.before].headers.map((val: any, index: any) =>
        this.getColWidths(index, this.before)
      );
      const getBeforeColWidths = (index: string | number) => beforeColWidths[index];
      const headerArr =
        this.after === 'search' ? [...this.searchTable.headers] : [...this.dataTable[this.before].headers];

      this.hotRegisterer.getInstance(this.instance + 'Mini').updateSettings({
        colWidths: getBeforeColWidths,
        hiddenColumns: {
          columns: headerArr
            .map((val, i) => i)
            .filter(
              val =>
                columnFilter.includes(headerArr[val]) || (headerArr[val] === 'Text_ID' && this.before === 'morphology')
            )
        },
        multiColumnSorting: this.sort
      });
      this.getTableData(this.before);
    }
    if (this.hotRegisterer.getInstance(this.instance)) {
      const afterColWidths =
        this.after === 'search'
          ? this.searchTable.headers.map((val: any, index: any) => this.getColWidths(index, this.after))
          : this.dataTable[this.after].headers.map((val: any, index: any) => this.getColWidths(index, this.after));
      const getAfterColWidths = (index: string | number) => afterColWidths[index];
      const headerArr =
        this.after === 'search' ? [...this.searchTable.headers] : [...this.dataTable[this.after].headers];
      this.hotRegisterer.getInstance(this.instance).updateSettings({
        colWidths: getAfterColWidths,
        hiddenColumns: {
          columns: headerArr
            .map((val, i) => i)
            .filter(
              val =>
                columnFilter.includes(headerArr[val]) || (headerArr[val] === 'Text_ID' && this.after === 'morphology')
            )
        },
        multiColumnSorting: this.sort
      });
      this.getTableData(this.after);
    }
  }
  columnRendererSettings(header: any, table, columnType) {
    switch (header) {
      case 'Rel':
        return this[columnType].push(
          this.columnSettings(this, table, header, 'dropdown', ['', 'Yes', 'No', 'Maybe'], 'autocomplete')
        );
      case 'Trans':
        return this[columnType].push(
          this.columnSettings(
            this,
            table,
            header,
            'dropdown',
            ['', 'trans.', 'intrans.', 'pass.', 'unclear'],
            'autocomplete'
          )
        );
      case 'Depend':
        return this[columnType].push(
          this.columnSettings(this, table, header, 'dropdown', ['', 'abs.', 'conj.', 'deut.', 'prot.'], 'autocomplete')
        );
      case 'Depon':
        return this[columnType].push(
          this.columnSettings(this, table, header, 'dropdown', ['', 'Yes', 'No', 'Maybe'], 'autocomplete')
        );
      case 'Contr':
        return this[columnType].push(
          this.columnSettings(this, table, header, 'dropdown', ['', 'Yes', 'No', 'Maybe'], 'autocomplete')
        );
      case 'Augm':
        return this[columnType].push(
          this.columnSettings(this, table, header, 'dropdown', ['', 'Yes', 'No', 'Maybe'], 'autocomplete')
        );
      case 'Hiat':
        return this[columnType].push(
          this.columnSettings(this, table, header, 'dropdown', ['', 'Yes', 'No', 'Maybe'], 'autocomplete')
        );
      case 'Mut':
        return this[columnType].push(
          this.columnSettings(
            this,
            table,
            header,
            'dropdown',
            ['', '+ Nas.', '- Nas.', '+ Len.', '- Len.', '+ Gem.', '- Gem.'],
            'autocomplete'
          )
        );
      case 'Causing_Mut':
        return this[columnType].push(
          this.columnSettings(
            this,
            table,
            header,
            'dropdown',
            ['', '+ Nas.', '- Nas.', '+ Len.', '- Len.', '+ Gem.', '- Gem.'],
            'autocomplete'
          )
        );
      default:
        return this[columnType].push(this.columnSettings(this, table, header, 'text'));
    }
  }

  columnSettings(that: any, table: string, header: string, type: string, source?: any[], renderer?: string) {
    // console.log('I got in here!');
    // console.log({ that, table, header, type, source, renderer });
    const settingsObj: any = {
      data: header,
      title: _.capitalize(header.replace(/_/g, ' ')),
      type,
      readOnly: header === 'ID' || !this.edit ? true : false,
      renderer:
        renderer ||
        function (
          _instance: any,
          td: HTMLElement,
          _row: any,
          _col: any,
          prop: string,
          value: string,
          _cellProperties: any
        ) {
          // console.log(that);

          const escaped = Handsontable.helper.stringify(value);
          // console.log('Renderer Variables: ', { _instance, td, _row, _col, prop, value, _cellProperties });
          // if (escaped.indexOf('http') === 0) {
          if (escaped.indexOf('http') === 0 || escaped.indexOf('www') === 0) {
            // Removes all the commas (;) from the dil headword column and splits them up into an array
            const linksArr = escaped.replace(/;/g, '').split(' ');
            Handsontable.dom.empty(td);
            for (const url of linksArr) {
              // Just double-checking that no random characters ruin things
              if (url.indexOf('http') === 0 || url.indexOf('www') === 0) {
                // Create anchor element.
                const a = document.createElement('a');
                // Create the text node for anchor element
                const link = document.createTextNode(url);
                // Append the text node to anchor element
                a.appendChild(link);
                // Set the title
                a.title = url + '/n';
                a.target = '_blank';
                // Set the href property
                if (url.indexOf('www') === 0) {
                  a.href = 'http://' + url;
                } else {
                  a.href = url;
                }
                Handsontable.dom.addEvent(a, 'mousedown', function (event) {
                  event.preventDefault();
                });
                td.appendChild(a);
              }
            }
            // Make it centered
            td.style.textAlign = 'center';
          } else {
            let queryParams = {};
            // console.table({ table, before: that.before, after: that.after, prop });
            // If this is the Text_ID column on and we're not on the text Table
            if (that.after !== 'text' && prop === 'Text_ID') {
              queryParams = {
                page: 0,
                limit: 0,
                fprop: '',
                fval: '',
                dtable: 'text',
                ctable: 'text',
                search: false
              };
            } else if (table === that.after && table === 'text' && prop === 'Text_ID') {
              // If this is the after or search table
              queryParams = {
                page: 0,
                limit: 0,
                fprop: prop,
                fval: value,
                dtable: 'sentences',
                ctable: 'text',
                search: false
              };
            } else if (
              ((table === that.before && table === 'sentences') || (table === that.after && table === 'morphology')) &&
              prop === 'Text_Unit_ID'
            ) {
              queryParams = {
                page: 0,
                limit: 0,
                fprop: 'Text_ID',
                fval: value.split('-')[0].substr(1),
                dtable: 'sentences',
                ctable: 'text',
                search: false
              };
            } else if (
              (table === 'morphology' || table === 'search' || table === 'sentences') &&
              prop === 'Text_Unit_ID'
            ) {
              queryParams = {
                page: 0,
                limit: 0,
                fprop: prop,
                fval: value,
                dtable: 'morphology',
                ctable: 'sentences',
                search: false
              };
            } else if ((table === 'morphology' || table === 'search' || table === 'lemmata') && prop === 'Lemma') {
              queryParams = {
                page: 0,
                limit: 0,
                fprop: prop,
                fval: value,
                dtable: 'lemmata',
                ctable: 'morphology',
                search: false
              };
            } else {
              Handsontable.renderers.TextRenderer.apply(this, arguments);
              td.style.whiteSpace = that.wordWrap ? 'normal' : 'nowrap';
              return td;
            }
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
              that.ngZone.run(() => that.router.navigate(['/tables'], { queryParams }));
            });
            td.appendChild(a);
            td.style.textAlign = 'center';
          }
          td.style.whiteSpace = that.wordWrap ? 'normal' : 'nowrap';
          return td;
        }
    };
    if (source) {
      settingsObj.source = source;
    }
    // console.log(settingsObj);

    return settingsObj;
  }
  getColWidths(index: number, table: string) {
    // console.log('Index: ', index + ' ' + that.dataTable[that.after].headers[index]);
    const indexTitle = table === 'search' ? this.searchTable.headers[index] : this.dataTable[table].headers[index];
    switch (indexTitle) {
      case 'Augm':
        return 75;
      case 'Causing_Mut':
        return 115;
      case 'Comments':
        return 250;
      case 'Contr':
        return 75;
      case 'Created_Date':
        return 150;
      case 'Date':
        return 300;
      case 'Dating_Criteria':
        return 600;
      case 'Depend':
        return 75;
      case 'Depon':
        return 75;
      case 'Digital_MSS':
        return 200;
      case 'DIL_Headword':
        return 200;
      case 'Edition':
        return 300;
      case 'Etymology':
        return 200;
      case 'Hiat':
        return 75;
      case 'ID':
        return 75;
      case 'Latin_Text':
        return 250;
      case 'MSS':
        return 400;
      case 'MS_Checked':
        return 125;
      case 'Mut':
        return 75;
      case 'Onomastic_Complex':
        return 175;
      case 'Onomastic_Usage':
        return 175;
      case 'Phrase_structure_tree':
        return 200;
      case 'Problematic_Form':
        return 175;
      case 'Reason_Of_MS_Choice_And_Editorial_Policy':
        return 350;
      case 'Rel':
        return 75;
      case 'Secondary_Meaning':
        return 200;
      case 'SpecialCharacter':
        return 175;
      case 'Syntactic_Unit_Translation':
        return 250;
      case 'Text_ID':
        return 75;
      case 'Textual_Unit':
        return 300;
      case 'Trans':
        return 75;
      case 'Translation':
        return 300;
      case 'Translation_From_Latin':
        return 225;
      case 'Translation_Notes':
        return 250;
      case 'Variant_Readings':
        return 200;
      default:
        return 150;
    }
  }

  getTableData(table: string) {
    return table === 'search' ? this.searchTable.data : this.dataTable[table].data;
  }
  getRows(table: string | number) {
    return table === 'search'
      ? this.searchTable.data.map((row, index) => index + 1)
      : this.dataTable[table].data.map((row: { Sort_ID: any }) => row.Sort_ID);
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
  async refresh() {
    await this.fetchedTable();

    this.hotInstance = this.hotRegisterer.getInstance(this.instance);
    this.hotInstance.loadData(this.getTableData(this.after));
    this.hotInstance.render();
  }
  toggleMode(variable: string) {
    if (variable === 'edit') {
      this.edit = !this.edit;
      this.hotInstance = this.hotRegisterer.getInstance(this.instance);
      this.hotInstance.updateSettings({
        manualRowMove: this.edit,
        manualColumnFreeze: this.edit,
        contextMenu: this.edit,
        readOnly: !this.edit,
        disableVisualSelection: !this.edit
      });
      this.columns.forEach(column => {
        column.readOnly = !this.edit;
      });
      this.columnsMini.forEach(column => {
        column.readOnly = !this.edit;
      });
      if (this.hotRegisterer.getInstance(this.instance + 'Mini')) {
        this.hotRegisterer.getInstance(this.instance + 'Mini').updateSettings({
          manualRowMove: this.edit,
          manualColumnFreeze: this.edit,
          contextMenu: this.edit,
          readOnly: !this.edit,
          disableVisualSelection: !this.edit
        });
      }
    } else if (variable === 'sort') {
      // console.log(variable, this.wordWrap);
      this.sort = !this.sort;
      this.fetchedTable();
    } else if (variable === 'ref') {
      this.ref = !this.ref;
      this.fetchedTable();
    } else {
      // console.log(variable, this.wordWrap);
      this.wordWrap = !this.wordWrap;
      this.fetchedTable();
    }
  }
  changeID(direction: string) {
    const urlParams = new URLSearchParams(window.location.search);
    // console.log(urlParams.toString());
    if (urlParams.has('fval') && (this.before === 'text' || this.before === 'sentences')) {
      // console.log('Got it: ', urlParams.get('fval'));
      let fVal = urlParams.get('fval'); // 0001 or S0001-1 format
      const fValArr = fVal.split('-'); // ['0001'] or ['S0001','1']
      let numVal = parseInt(fValArr[fValArr.length - 1], 10); // gives the last value as a number
      direction === 'next' ? numVal++ : numVal--;
      if (numVal === 0) {
        return; // cause there are no more texts / sentences in the text
      } else {
        if (this.before === 'text') {
          // if its the textID from the Text table e.g. 0001
          const stringVal = numVal.toString(); // convert numVal back to String
          fVal =
            Array(4 - stringVal.length)
              .fill('0')
              .join('') + stringVal;
        } else {
          // if its the text_unit_ID from the Sentences table e.g. S0001-1
          fVal = `${fValArr[0]}-${numVal}`;
          // console.log(fVal);
        }
        urlParams.set('fval', fVal);
        // console.log(urlParams.toString());
        const queryParams = JSON.parse(
          '{"' + decodeURI(urlParams.toString()).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}'
        );
        // console.log(queryParams);
        this.router.navigate(['/tables'], { queryParams });
      }
    }
  }
  goBack() {
    this.location.back();
  }
  goForward() {
    this.location.forward();
  }
  scrollToTable() {
    // console.log('App Table Height: ', this.appTable.nativeElement.scrollHeight);
    // window.scrollTo({ top: this.appTable.nativeElement.scrollHeight, behavior: 'smooth' })
    this.appTable.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
