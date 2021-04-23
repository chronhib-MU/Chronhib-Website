import { PaginationService } from './../../../services/pagination.service';
import { AuthService } from './../../../services/auth.service';
import { Component, OnInit, Input, ElementRef, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TableDataService } from '../../../services/table-data.service';
import Handsontable from 'handsontable';
import { ApiPostBody } from '../../../interfaces/api-post-body';
import * as jsonexport from 'jsonexport/dist';
import * as _ from 'lodash';
import * as $ from 'jquery';
import { Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { shareReplay, last } from 'rxjs/operators';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit, OnDestroy {
  @Input() before: string;
  @Input() after: string;
  @Input() edit: boolean;
  @ViewChild('appTable') appTable: ElementRef;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  wordWrap = false;
  filter = false;
  sort = false;
  ref = false;
  instance = 'hot';
  columns: Handsontable.ColumnSettings[] = [];
  columnsMini: Handsontable.ColumnSettings[] = [];
  hotInstance = this.pagination.hotRegisterer.getInstance(this.instance);
  history = [];
  routeQueryParams: Subscription;
  scrollToTableSub$: any;
  exporting = 'idle';

  // Event for `keydown` event. Add condition after delay of 200 ms which is counted from time of last pressed key.
  debounce = (colIndex: number, event: KeyboardEvent) => {
    return Handsontable.helper.debounce(() => {
      const filtersPlugin = this.pagination.hotRegisterer.getInstance(this.instance).getPlugin('filters');
      // console.log((<HTMLInputElement> event.target).value);
      filtersPlugin.removeConditions(colIndex);
      filtersPlugin.addCondition(colIndex, 'contains', [(<HTMLInputElement> event.target).value]);
      filtersPlugin.filter();
    }, 200)();
  }
  addEventListeners = (input: HTMLInputElement, colIndex: any) => {
    input.addEventListener('keyup', (event) => {
      this.debounce(colIndex, event);
    });
  };

  // Add elements to header on `afterGetColHeader` hook.
  addInput = (col: number, TH: HTMLTableHeaderCellElement) => {
    if (typeof col !== 'number') {
      return col;
    }

    if (col >= 0 && TH.childElementCount < 2) {
      TH.appendChild(this.getInitializedElements(col));
    } else if (TH.childElementCount < 2) {
      const div = document.createElement('div');
      div.className = 'filterHeader';
      TH.appendChild(div);
    }
  };

  // Remove added elements to header on `afterGetColHeader` hook.
  removeInput = (col: number, TH: HTMLTableHeaderCellElement) => {
    if (typeof col !== 'number') {
      return col;
    }
    if (TH.childElementCount >= 2) {
      TH.removeChild(TH.lastChild);
    }
  }

  // Deselect column after click on input.
  doNotSelectColumn = function (event: MouseEvent, coords: Handsontable.wot.CellCoords) {
    if (coords.row === -1 && (<HTMLInputElement> event.target).nodeName === 'INPUT') {
      event.stopImmediatePropagation();
      this.deselectCell();
    }
  };

  // Build elements which will be displayed in header.
  getInitializedElements = (colIndex: number) => {
    const div = document.createElement('div');
    const input = document.createElement('input');
    div.className = 'filterHeader';

    this.addEventListeners(input, colIndex);

    div.appendChild(input);

    return div;
  };
  // tslint:disable-next-line: member-ordering
  contextMenu: Handsontable.contextMenu.Settings[] =
    [
      {
        callback: function (key, selection, clickEvent) {
          // Common callback for all options
          console.log(key, selection, clickEvent);
        },
        items: {
          'copy': {},
          'alignment': {}
        }
      },
      {
        callback: function (key, selection, clickEvent) {
          // Common callback for all options
          console.log(key, selection, clickEvent);
        },
        items:
        {
          'row_below': { name: 'Insert Row' },
          'remove_row': {},
          'sp0': { name: '---------' },
          'hidden_columns_show': {},
          'hidden_columns_hide': {},
          'freeze_column': {},
          'unfreeze_column': {},
          'sp1': { name: '---------' },
          'undo': {},
          'redo': {},
          'sp2': { name: '---------' },
          'cut': {},
          'copy': {},
          'sp3': { name: '---------' },
          'alignment': {},
        }
      }];
  // index 0 if edit mode false OR index 1 if edit mode true
  // tslint:disable-next-line: member-ordering
  hotSettings: Handsontable.GridSettings[] = [
    { // Edit Off
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
      contextMenu: this.contextMenu[0],
      readOnly: true,
      // colWidths: 150,
      multiColumnSorting: false,
      wordWrap: false,
      filters: false,
      afterGetColHeader: this.removeInput,
      beforeOnCellMouseDown: undefined,
    },
    {// Edit On
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
      contextMenu: this.contextMenu[1],
      readOnly: false,
      // colWidths: 150,
      multiColumnSorting: false,
      wordWrap: false,
      filters: false,
      afterGetColHeader: this.removeInput,
      beforeOnCellMouseDown: undefined,
    }
  ];


  constructor (
    public tableData: TableDataService,
    public pagination: PaginationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private ngZone: NgZone
  ) {
    Handsontable.hooks.add('afterInit', () => {
      $('.htCore').addClass('table');

      if (this.pagination.hotRegisterer.getInstance(this.instance + 'Mini')) {
        this.pagination.hotRegisterer.getInstance(this.instance + 'Mini').updateSettings({
          manualRowMove: false
        });
      }
    });
    // Handsontable.hooks.add('afterChange', changes => {
    //   changes.forEach(([row, prop, oldValue, newValue]) => {
    //     // Some logic...
    //   });
    // });
  }
  ngAfterViewInit (): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.

  }
  ngOnDestroy (): void {
    console.log('destroying');
    this.routeQueryParams.unsubscribe();
    this.scrollToTableSub$.unsubscribe();
    console.log('destroyed');
  }

  ngOnInit (): void {
    console.log('Initializing');
    // console.log('hot table');
    this.hotInstance = this.pagination.hotRegisterer.getInstance(this.instance);
    // console.log(this.hotInstance);
    this.routeQueryParams = this.route.queryParamMap.subscribe(async paramMap => {
      console.log('RouteQueryParams Subscription ran!');
      console.log('CurrentApiQuery Dtable:', this.tableData.currentApiQuery.dtable);
      console.log('After:', this.after);
      console.log('ParamMap Dtable:', paramMap.get('dtable'));
      /** Check for duplicate loops on:
       * 1. default linked table
       * 2. main named tables (at top) with query parameters
       * 3. main named tables (at top) without query parameters
       */
      // if ((this.tableData.currentApiQuery.dtable && this.tableData.currentApiQuery.ctable) ||
      // (this.tableData.currentApiQuery.dtable === this.after) ||
      // (paramMap.get('dtable') === null)) {
      await this.refresh();
      // } else {
      //   console.log('Cancelled Old Redundant Iteration!');
      // }
    });
    const that = this;
    this.paginator._intl.itemsPerPageLabel = 'Results per page:';
    this.sort = false;
    this.filter = false;
    this.scrollToTableSub$ = this.pagination.scrollToTableSub.subscribe(() => {
      this.scrollToTable();
    });

    // Need this to push the dataset
    const hooks = Handsontable.hooks.getRegistered();
    hooks.forEach(hook => {
      // Focuses on the results after changes cause they have before and after data
      let table = that.after;
      if (hook === 'afterChange') {
        this.hotSettings[that.edit ? 1 : 0][hook] = function () {
          // console.log('tableColumn length:', that.tableData.searchForm.get('tableColumns')['controls'].length);
          table = that.after;
          if (arguments[1] !== 'loadData') {
            // Check that this is not a multi-table search
            if (
              that.after !== 'search' ||
              (that.tableData.searchForm.get('tableColumns')['controls'].length === 1 &&
                that.tableData.searchTable.headers.includes('ID'))
            ) {
              console.log(hook, arguments);
              const tableData = this.getData();
              const colHeaders: Array<string> = this.getColHeader();
              // console.log('TableData', tableData);
              // console.log('ColHeader', this.getColHeader());
              // console.log(that.tableData.searchTable);
              // Need to find the index of the id
              const ids = colHeaders.map((val, index) => ({ val, index })).filter(obj => obj.val === 'Id');
              // console.log('ids', ids);
              const values = [];
              arguments[0].forEach((value: any[]) => {
                console.log('value:', value);
                const rowNumber = value[0];
                const columnName = value[1];
                const beforeValue = value[2];
                const afterValue = value[3] || '';
                // Makes sure the edit is not an irrelevant one
                if (beforeValue !== afterValue && ids.length) {
                  const fieldProperty = columnName;
                  // Gets the ID even if it has been moved
                  const id = tableData[rowNumber][ids.slice(-1)[0].index];
                  // console.log('id', id);
                  const result = {
                    id,
                    fieldProperty,
                    fieldValue: afterValue
                  };
                  if (table === 'search') {
                    table = that.tableData.searchForm.get('tableColumns')['controls'][0].value.table;
                  } else if (this.rootElement.id === 'hotMini') {
                    table = that.before;
                  }
                  values.push(result);
                }
              });
              const res = {
                table,
                command: 'updateRow',
                values,
                user: that.authService.user
              };
              // Checks for which table we're making changes on

              // console.log('Result:', res);
              if (that.edit && res.command !== 'loadData') {
                that.tableData.updateTable(res).then(() => {
                  that.history.push(res);
                  // console.log('History: ', that.history);
                  // that.refresh();
                });
              }
            } else if (that.tableData.searchTable.headers.includes('ID')) {
              that.authService.showToaster(
                'Edits on cross-table search results are not allowed.',
                'Invalid Edit!',
                'error'
              );
            } else {
              console.log(that.tableData.searchTable.headers);
              that.authService.showToaster('No ID column found on search table.', 'Invalid Edit!', 'error');
            }
          }
        };
      } else if (hook === 'afterRowMove' && this.after !== 'search') {
        // TODO: refactor this
        this.hotSettings[that.edit ? 1 : 0][hook] = function () {
          if (this.rootElement.id === 'hotMini') {
            table = that.before;
          } else {
            table = that.after;
          }
          // console.log(this);
          const tableData = this.getData();
          const newValues = tableData.map((row: { [x: string]: any }, i: number) => {
            const sortId = i + 1;
            return { ID: row['1'], Sort_ID: sortId };
          });

          const res: ApiPostBody = {
            table,
            command: 'moveRow',
            values: [newValues],
            user: that.authService.user
          };
          // console.log('Result:', res);
          // Checks for which table we're making changes on

          // console.log('Result:', res);
          if (that.edit) {
            that.tableData.updateTable(res).then(() => {
              that.history.push(res);
              // console.log('History: ', that.history);
              that.refresh();
            });
          }
        };
      } else if (
        hook === 'beforeCreateRow' &&
        (that.after !== 'search' || that.tableData.searchForm.get('tableColumns')['controls'].length === 1)
      ) {
        this.hotSettings[that.edit ? 1 : 0][hook] = function () {
          console.log('Arguments: ', arguments);
          table = that.after;
          const values = [];
          // console.log('Current API Query: ', that.tableData.currentApiQuery);
          // If there are fields properties and values to automatically insert into the new row
          if (that.tableData.currentApiQuery?.fprop && that.tableData.currentApiQuery?.fval) {
            values.push({
              fprop: that.tableData.currentApiQuery.fprop,
              fval: that.tableData.currentApiQuery.fval
            });
          } else if (that.after === 'search') {
            console.log(that.tableData.searchForm.get('tableColumns')['controls'][0].value.table);
            table = that.tableData.searchForm.get('tableColumns')['controls'][0].value.table;
          } else if (this.rootElement.id === 'hotMini') {
            table = that.before;
          }
          console.log('Values: ', values);
          const res: ApiPostBody = {
            table,
            command: 'createRow',
            values,
            user: that.authService.user
          };
          // Checks for which table we're making changes on

          console.log('Result:', res);
          if (that.edit) {
            that.refresh();
            that.tableData.updateTable(res).then(() => {
              that.history.push(res);
              // console.log('History: ', that.history);
              that.refresh();
            });
          }
        };
      } else if (hook === 'beforeRemoveRow'
        && (that.after !== 'search' || that.tableData.searchForm.get('tableColumns')['controls'].length)) {
        this.hotSettings[that.edit ? 1 : 0][hook] = function () {
          table = that.after;
          // Check that this is not a multi-table search
          if (
            that.after !== 'search' ||
            (that.tableData.searchForm.get('tableColumns')['controls'].length === 1 &&
              that.tableData.searchTable.headers.includes('ID'))
          ) {
            console.log(hook, arguments);
            const tableData = this.getData();
            const colHeaders: Array<string> = this.getColHeader();
            console.log('TableData', tableData);
            // console.log('ColHeader', this.getColHeader());
            // console.log(that.tableData.searchTable);
            // Need to find the index of the id
            const ids = colHeaders.map((val, index) => ({ val, index })).filter(obj => obj.val === 'Id');
            console.log('ids', ids);
            const values = [];
            arguments[2].forEach((value: number) => {
              console.log('value:', value);
              const rowNumber = value;
              // Gets the ID even if it has been moved
              const id = tableData[rowNumber][ids.slice(-1)[0].index]; // Sort_IDs in index 0
              if (ids.length) {
                console.log('id', id);
                if (table === 'search') {
                  table = that.tableData.searchForm.get('tableColumns')['controls'][0].value.table;
                }
                values.push(id);
              }
            });
            const res = {
              table,
              command: 'removeRow',
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
                that.refresh();
              });
            }
          } else if (that.tableData.searchTable.headers.includes('ID')) {
            that.authService.showToaster(
              'Row Removal on cross-table search results are not allowed.',
              'Invalid Row Removal!',
              'error'
            );
          } else {
            that.authService.showToaster('No ID column found on search table.', 'Invalid Edit!', 'error');
          }
        };
      }
    });
    // $hooksList = $('#hooksList');
    console.log('Initialized');
  }

  copyToClipboard () {
    $('body').append('<input id="copyURL" type="text" value="" />');
    $('#copyURL').val(window.location.href).trigger('select');
    document.execCommand('copy');
    $('#copyURL').remove();
    this.authService.showToaster('', 'Search Link Copied to Clipboard!', 'info');
  }

  async exportToCSV () {
    this.exporting = 'pending';
    let filename =
      this.after === 'search'
        ? 'ChronHib_Search-' + this.tableData.currentApiQuery.id
        : 'ChronHib_Table_' + _.startCase(this.after);
    if (this.after !== 'text' && this.tableData.currentApiQuery.fval) {
      filename += '-' + this.tableData.currentApiQuery.fval;
    }
    filename += '.csv';
    // const tableName = this.before === 'morphology' ? this.before : this.after;
    const apiQuery = Object.assign({ ...this.tableData.currentApiQuery });
    apiQuery.limit = '9999999999999999999';
    console.log(apiQuery);
    jsonexport(await this.tableData.fetchTable(apiQuery, true), (err: any, csv: string | number | boolean) => {
      this.exporting = 'idle';

      if (err) {
        this.exporting = 'failed';
        setTimeout(() => {
          this.exporting = 'idle';
        }, 10000);
        return console.error(err);
      } else {
        this.exporting = 'success';
        setTimeout(() => {
          this.exporting = 'idle';
        }, 10000);
      }
      // console.log(csv);
      // Creates the download link button
      const dLink = document.createElement('a');
      dLink.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      dLink.setAttribute('download', filename);

      if (document.createEvent) {
        const event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        dLink.dispatchEvent(event);
      } else {
        dLink.click();
      }
    });
  }

  compareFunctionFactory (sortOrder: string) {
    const order = sortOrder === 'asc' ? true : false;
    return function comparator (a: string | number, b: string | number) {
      // console.log(typeof a);
      // console.log(typeof b);
      if (typeof a === 'number' && typeof b === 'number') {
        if (b === a) {
          return 0;
        } else {
          if (order) {
            return b - a > 0 ? 1 : -1;
          } else {
            return b - a > 0 ? -1 : 1;
          }
        }
      } else if (typeof a === 'string' && typeof b === 'string') {
        return order
          ? (new Intl.Collator().compare(a, b) as 0 | 1 | -1)
          : (new Intl.Collator().compare(b, a) as 0 | 1 | -1);
      } else {
        return 0;
      }
    };
  }

  async fetchedTable () {
    try {
      console.log('Fetching from table component:');
      console.log(this.tableData.currentApiQuery);
      console.log(this.after);
      const fetchedTableSub = this.tableData.fetchedTable.pipe(shareReplay(), last());
      const fetchedTableSub$ = fetchedTableSub.subscribe(async data => {

        this.updatePageForm();
        // console.table('After: ' + this.after);
        // console.table('Before: ' + this.before);
        console.log(`Datatable[${this.after}]: `);
        console.log(this.tableData.tables);
        // If this is a case where there is meant to be reference table
        if (this.before && this.before !== this.after) {
          this.tableData.tables['before'].headers = Object.keys(this.tableData.tables['before'].data[0]);
          // Moves Sort_ID to first while remove it from last in the before table
          this.tableData.tables['before'].headers.splice(0, 0, this.tableData.tables['before'].headers.pop());
        }
        // If this is a case where we're on the search table
        if (this.after === 'search') {
          // checks if there are results before adding the headers
          if (this.tableData.searchTable.data[0]) {
            this.tableData.searchTable.headers = Object.keys(this.tableData.searchTable.data[0]);
            // console.table(this.tableData.searchTable);
          }
        } else {
          this.tableData.tables['after'].headers = Object.keys(this.tableData.tables['after'].data[0]);
          // Moves Sort_ID to first while remove it from last in the after table
          this.tableData.tables['after'].headers.splice(0, 0, this.tableData.tables['after'].headers.pop());
          // console.table(this.tableData.tables);
        }

        this.columns = [];
        this.columnsMini = [];
        // If this is a case where there is meant to be reference table
        if (this.before && this.before !== this.after) {
          await this.tableData.tables['before'].headers.forEach((header: string) => {
            return this.columnRendererSettings(header, this.before, 'columnsMini');
          });
        }
        this.after === 'search'
          ? await this.tableData.searchTable.headers.forEach((header: string) => {
            return this.columnRendererSettings(header, this.after, 'columns');
          })
          : await this.tableData.tables['after'].headers.forEach((header: string) => {
            return this.columnRendererSettings(header, this.after, 'columns');
          });

        const columnFilter = ['Sort_ID'];
        if (this.pagination.hotRegisterer.getInstance(this.instance + 'Mini')) {
          const beforeColWidths = this.tableData.tables['before'].headers.map((_val: any, index: any) =>
            this.getColWidths(index, 'before')
          );
          const getBeforeColWidths = (index: string | number) => beforeColWidths[index];
          const headerArr =
            this.after === 'search' ? [...this.tableData.searchTable.headers] : [...this.tableData.tables['before'].headers];

          this.pagination.hotRegisterer.getInstance(this.instance + 'Mini').updateSettings({
            colWidths: getBeforeColWidths,
            hiddenColumns: {
              columns: headerArr
                .map((_val, i) => i)
                .filter(
                  val =>
                    columnFilter.includes(headerArr[val]) || (headerArr[val] === 'Text_ID' && this.before === 'morphology')
                )
            },
            multiColumnSorting: this.sort
              ? {
                compareFunctionFactory: this.compareFunctionFactory
              } : false,
            filters: this.filter && this.before === 'morphology' ? true : false,
            afterGetColHeader: this.filter && this.before === 'morphology' ? this.addInput : this.removeInput,
            beforeOnCellMouseDown: this.filter && this.before === 'morphology' ? this.doNotSelectColumn : undefined
          });
          this.getTableData(this.before);
        }
        if (this.pagination.hotRegisterer.getInstance(this.instance)) {
          const afterColWidths =
            this.after === 'search'
              ? this.tableData.searchTable.headers.map((_val: any, index: any) => this.getColWidths(index, 'search'))
              : this.tableData.tables['after'].headers.map((_val: any, index: any) => this.getColWidths(index, 'after'));
          const getAfterColWidths = (index: string | number) => afterColWidths[index];
          const headerArr =
            this.after === 'search' ? [...this.tableData.searchTable.headers] : [...this.tableData.tables['after'].headers];
          this.pagination.hotRegisterer.getInstance(this.instance).updateSettings({
            colWidths: getAfterColWidths,
            hiddenColumns: {
              columns: headerArr
                .map((_val, i) => i)
                .filter(
                  val =>
                    // hides the Text_ID on the Morphology table
                    columnFilter.includes(headerArr[val]) || (headerArr[val] === 'Text_ID' && this.after === 'morphology')
                )
            },
            multiColumnSorting: this.sort
              ? {
                compareFunctionFactory: this.compareFunctionFactory
              } : false,
            filters: this.filter ? true : false,
            afterGetColHeader: this.filter && this.before !== 'morphology' ? this.addInput : this.removeInput,
            beforeOnCellMouseDown: this.filter && this.before !== 'morphology' ? this.doNotSelectColumn : undefined
          });
          await this.getTableData(this.after);
        } else {
          // console.log('No Instance!', this.instance);
        }
        // console.log('I have finished!')
        fetchedTableSub$.unsubscribe();
      });
    } catch (error) {
      console.error(error);
      // TODO: Should redirect Search Query to not found page
      return error;
    }
  }

  columnRendererSettings (header: any, table: string, columnTableType: string) {
    const columns = [
      'Rel',
      'Trans',
      'Depend',
      'Depon',
      'Contr',
      'Augm',
      'Hiat',
      'Mut',
      'Causing_Mut',
      'Lemma',
      'Analysis',
      'Part_Of_Speech'
    ];
    if (columns.includes(header)) {
      return this[columnTableType].push(
        this.columnSettings(this, table, header, 'autocomplete',
          async (query, process) => {
            process(await this.tableData.dynamicAutoComplete(query, table, header));
          })
      );
    }
    switch (header) {
      case 'ID':
        return this[columnTableType].push(this.columnSettings(this, table, header, 'numeric'));
      case 'Sort_ID':
        return this[columnTableType].push(this.columnSettings(this, table, header, 'numeric'));
      default:
        return this[columnTableType].push(this.columnSettings(this, table, header, 'text'));
    }
  }

  columnSettings (that: any, table: string, header: string, type: string, source?: string[] | number[] |
    ((this: Handsontable.CellProperties, query: string,
      callback: (items: string[]) => void) => void), renderer?: string) {
    // console.log({ that, table, header, type, source, renderer });
    const settingsObj: Handsontable.ColumnSettings = {
      data: header,
      title: _.capitalize(header.replace(/_/g, ' ')),
      type,
      readOnly: header === 'ID' || !this.edit ? true : false,
      renderer:
        renderer ||
        function (
          _instance: any,
          td: HTMLTableCellElement,
          _row: number,
          _col: number,
          prop: string | string,
          value: Handsontable.CellValue,
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
            if (value) {
              // console.table({ table, before: that.before, after: that.after, prop });

              if (table === that.after && (table === 'text' || table === 'search') && prop === 'Text_ID') {
                /*
                If we're on the reference Text/Search table,
                and the we're on the Text ID column,
                go on to the Text > Sentences table
                */
                queryParams = {
                  page: 0,
                  limit: 0,
                  fprop: prop,
                  fval: value,
                  dtable: 'sentences',
                  ctable: 'text',
                  search: false
                };
              } else if ((table === 'text' || table === 'sentences') && prop === 'Text_ID') {
                /*
                If we're on the reference Text or main/reference Sentences table,
                and we're on the Text ID column,
                go back to the Text table
                */
                queryParams = {
                  page: 0,
                  limit: 0,
                  fprop: '',
                  fval: '',
                  dtable: 'text',
                  ctable: 'text',
                  search: false
                };
              } else if (
                ((table === that.before && table === 'sentences') ||
                  (table === that.after && table === 'morphology')) &&
                prop === 'Text_Unit_ID'
              ) {
                /*
                If we're on the reference Sentences or Morphology table,
                and we're on the Text Unit ID column,
                go back to the Text > Sentences table
                */
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
                /*
                  If we're on the reference Morphology or Search or Sentences table,
                  and we're on the Text Unit ID column,
                  go on to the Sentences > Morphology table
                */
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
                /*
                  If we're on the main/reference Morphology or Search or Lemmata table,
                  and we're on the Lemma column,
                  go on to the Morphology > Lemmata table
                */
                queryParams = {
                  page: 0,
                  limit: 0,
                  fprop: prop,
                  fval: value,
                  dtable: 'lemmata',
                  ctable: 'morphology',
                  search: false
                };
              } else if (
                // Not all ID Status in the Variations table are in Morphology
                // (table === 'variations' && prop === 'ID_Status') ||
                (table === 'morphology' && prop === 'Var_Status')) {
                /*
                  If we're on the Morphology table,
                  and we're on the Var Status column,
                  go on to the Variations table
                */
                queryParams = {
                  page: 0,
                  limit: 0,
                  fprop: 'Var_Status',
                  fval: value.split('; ')[0],
                  dtable: 'variations',
                  ctable: 'morphology',
                  search: false
                }
              } else {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                td.style.whiteSpace = that.wordWrap ? 'pre-wrap' : 'nowrap';
                return td;
              }
            } else {
              Handsontable.renderers.TextRenderer.apply(this, arguments);
              td.style.whiteSpace = that.wordWrap ? 'pre-wrap' : 'nowrap';
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
          td.style.whiteSpace = that.wordWrap ? 'pre-wrap' : 'nowrap';
          return td;
        }
    };
    if (source) {
      settingsObj.source = source;
    }
    if (type === 'autocomplete') {
      settingsObj.visible = 5;
      settingsObj.strict = false;
    }
    // console.log(settingsObj);

    return settingsObj;
  }

  getColWidths (index: number, table: string) {
    // console.log('Index: ', index + ' ' + that.tableData.tables['after'].headers[index]);
    const indexTitle = table === 'search' ?
      this.tableData.searchTable.headers[index]
      : this.tableData.tables[table].headers[index];
    switch (indexTitle) {
      case 'Abbreviation':
        return 150;
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
      case 'Reference':
        return 350;
      case 'Rel':
        return 75;
      case 'Secondary_Meaning':
        return 200;
      case 'SpecialCharacter':
        return 175;
      case 'Syntactic_Context':
        return 175;
      case 'Syntactic_Unit_Translation':
        return 250;
      case 'Text_ID':
        return 75;
      case 'Textual_Unit':
        return 300;
      case 'Title':
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
        return 175;
    }
  }

  getTableData (table: string) {
    return table === 'search' ? this.tableData.searchTable.data : this.tableData.tables[table === this.after ? 'after' : 'before'].data;
  }

  getRows (table: string | number) {
    return table === 'search' || (table === this.before && this.before !== this.after)
      ? this.tableData.searchTable.data.map((_row: any, index: number) => index + 1)
      : this.tableData.tables[table === this.after ? 'after' : 'before'].data.map((row: { Sort_ID: any }) => row.Sort_ID);
  }

  undo () {
    this.hotInstance = this.pagination.hotRegisterer.getInstance(this.instance);
    if ((this.hotInstance as any).isUndoAvailable()) {
      (this.hotInstance as any).undo();
    }
  }

  redo () {
    this.hotInstance = this.pagination.hotRegisterer.getInstance(this.instance);
    if ((this.hotInstance as any).isRedoAvailable()) {
      (this.hotInstance as any).redo();
    }
  }

  async refresh () {

    await this.fetchedTable();
    this.hotInstance = this.pagination.hotRegisterer.getInstance(this.instance + 'Mini');
    if (this.hotInstance) {
      this.hotInstance.loadData(this.getTableData(this.after));
      this.hotInstance.render();
    }
    this.hotInstance = this.pagination.hotRegisterer.getInstance(this.instance);
    if (this.hotInstance) {
      this.hotInstance.loadData(this.getTableData(this.after));
      this.hotInstance.render();
    }
  }

  toggleMode (variable: string) {
    // console.log('I was here!');
    try {
      switch (variable) {
        case 'edit':
          this.edit = !this.edit;
          this.hotInstance.updateSettings({
            manualRowMove: this.edit && !!this.before,
            manualColumnFreeze: this.edit,
            contextMenu: this.edit ? this.contextMenu[1] : this.contextMenu[0],
            readOnly: !this.edit,
            disableVisualSelection: !this.edit
          });
          this.columns.forEach(column => {
            column.readOnly = !this.edit;
          });
          this.columnsMini.forEach(column => {
            column.readOnly = !this.edit;
          });
          if (this.pagination.hotRegisterer.getInstance(this.instance + 'Mini')) {
            this.pagination.hotRegisterer.getInstance(this.instance + 'Mini').updateSettings({
              manualColumnFreeze: this.edit,
              contextMenu: this.edit ? this.contextMenu[1] : this.contextMenu[0],
              readOnly: !this.edit,
              disableVisualSelection: !this.edit
            });
          }
          break;
        case 'sort':
          this.sort = !this.sort;
          this.hotInstance.updateSettings({
            manualRowMove: !this.filter && !this.sort && this.edit && !!this.before
          });
          this.fetchedTable();
          break;
        case 'ref':
          this.ref = !this.ref;
          this.fetchedTable();
          break;
        case 'filter':
          // TODO: Find Out why hot instance is undefined
          this.filter = !this.filter;
          this.hotInstance.updateSettings({
            manualRowMove: !this.filter && !this.sort && this.edit && !!this.before,
          });
          this.fetchedTable();
          break;
        case 'wordWrap':
          this.wordWrap = !this.wordWrap;
          this.fetchedTable();
          break;
        default:
          break;
      }
      // console.log(variable, this[variable]);
    } catch (error) {
      console.log('Error:');
      console.error(error);
    }
  }

  changeID (direction: string) {
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
        urlParams.set('page', '0');
        // console.log(urlParams.toString());
        const queryParams = JSON.parse(
          '{"' + decodeURI(urlParams.toString()).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}'
        );
        // console.log(queryParams);
        this.router.navigate(['/tables'], { queryParams });
      }
    }
  }

  goBack () {
    this.location.back();
  }

  goForward () {
    this.location.forward();
  }

  updatePageForm () {
    this.pagination.pageForm.controls.page.setValidators([
      Validators.required,
      Validators.min(0),
      Validators.max(this.tableData.tableLength / this.pagination.getCurrentLimit())
    ]);

    this.pagination.pageForm.controls.page.updateValueAndValidity();
  }

  scrollToTable () {
    // console.log('App Table Height: ', this.appTable.nativeElement.scrollHeight);
    // window.scrollTo({ top: this.appTable.nativeElement.scrollHeight, behavior: 'smooth' })
    this.appTable.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
