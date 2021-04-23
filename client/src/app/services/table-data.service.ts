import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiGetQuery } from '../interfaces/api-get-query';
import { ApiPostBody } from '../interfaces/api-post-body';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import * as qs from 'qs';
import Fuse from 'fuse.js';
import { last, shareReplay } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class TableDataService {
  tables: any = {
    names: ['text', 'sentences', 'morphology', 'lemmata'],
    before: {
      headers: [],
      data: []
    },
    after: {
      headers: [],
      data: []
    }
  };
  allHeaders = { text: [], sentences: [], morphology: [], lemmata: [] };
  fetchedTable: Observable<{ data: { afterTable: []; beforeTable: []; numRows?: number } }>;
  currentApiQuery: ApiGetQuery;
  searchTable: any = { headers: [], data: [] };
  searchForm: FormGroup;
  searchQuerySub: Subject<any> = new Subject<FormGroup>();
  fetchedTableColumnRows: Observable<any>;
  tableLength = 0;
  page = 0;
  columnVals: any;

  constructor (public router: Router, private http: HttpClient, private authService: AuthService) {
  }

  // Fetches the headers for each table (mainly for search)
  fetchHeaders = async () => {
    try {
      await this.tables.names.forEach(async (name: string) => {
        // console.log(name);
        // console.log('apiQuery:', `${environment.apiUrl}${name}/headers`);
        const fetchedHeaders: Observable<any> = this.http.get<any>(
          `${environment.apiUrl}${name}/headers`
        ) as Observable<any>;
        const { data } = await fetchedHeaders.toPromise();
        // console.log(data);
        // const excludeColumns = ['Sort_ID'];
        this.allHeaders[name] = data;
        // .filter((column: string) => !excludeColumns.includes(column));
      });
      // console.log(this.allHeaders);
    } catch (error) {
      console.log('Invalid request made!');
      return;
    }
  };

  // Fetches table data from the API
  fetchTable = async (apiQuery: ApiGetQuery, toBeExported = false) => {
    console.log('Fetching from table data service:');
    console.log(apiQuery);
    if (toBeExported) {
      const search = apiQuery.search === 'true' ? true : false;
      const queryString = qs.stringify(apiQuery);
      console.log('apiQuery:', `${environment.apiUrl}${search ? 'search/' : 'tables/'}?${queryString}`);
      const { data } = await (this.http.get(`${environment.apiUrl}${search ? 'search/' : 'tables/'}?${queryString}`) as Observable<{
        data: { afterTable: []; beforeTable: []; numRows?: number };
      }>).toPromise();
      console.log('To be exported: ', data.afterTable);
      // Adds the index of the row to the exported data
      return data.afterTable.map((row, index) => Object.assign({ Index: index + 1 }, row));
    }
    this.currentApiQuery = apiQuery;

    this.page = this.currentApiQuery?.page ? parseInt(this.currentApiQuery?.page, 10) : 0;

    // }
    // console.log(window.location.origin);
    // console.log(environment.apiUrl);
    try {
      // Checks if the query was a table name e.g. 'text', 'sentences' etc. else it has to be an API query object
      if (this.tables.names.indexOf(apiQuery) > -1 && typeof apiQuery === 'string') {
        console.log('apiQuery:', `${environment.apiUrl}${apiQuery}`);
        this.fetchedTable = (this.http.get(`${environment.apiUrl}${apiQuery}`) as Observable<{
          data: { afterTable: []; beforeTable: []; numRows?: number };
        }>);
        const { data } = await this.fetchedTable.toPromise();
        // console.log(`${apiQuery}: `, data.afterTable);
        this.tables['after'].data = data.afterTable;
        this.tables['after'].headers = Object.keys(this.tables['after'].data[0]);
        // Moves Sort_ID to first while remove it from last in the before table
        this.tables['after'].headers.splice(0, 0, this.tables['after'].headers.pop());
        // console.log(this.tables[apiQuery].headers);
      } else if (typeof apiQuery !== 'string') {
        // Object.keys(apiQuery)
        //   .map(key => key + '=' + apiQuery[key])
        //   .join('&');
        const search = apiQuery.search === 'true' ? true : false;
        const queryString = qs.stringify(apiQuery);
        // console.log('apiQuery:', `${environment.apiUrl}${search ? 'search/' : 'tables/'}?${queryString}`);
        this.fetchedTable = this.http.get(`${environment.apiUrl}${search ? 'search/' : 'tables/'}?${queryString}`) as Observable<{
          data: { afterTable: []; beforeTable: []; numRows?: number };
        }>;
        const { data } = await this.fetchedTable.toPromise();
        this.tableLength = data.numRows;
        // console.log(data);
        if (search) {
          // beforeTable contains the Search Query
          // console.log(data.beforeTable);
          this.searchQuerySub.next(data.beforeTable);
          // afterTable contains the Search Result Data
          this.searchTable.data = data.afterTable;
          if (this.searchTable.data[0]) {
            this.searchTable.headers = Object.keys(this.searchTable.data[0]);
          }
          // console.log(`${qs.stringify(apiQuery)}: `, data);
        } else {
          if (apiQuery.dtable !== apiQuery.ctable && apiQuery.ctable) {
            this.tables['before'].data = data.beforeTable;
            this.tables['before'].headers = Object.keys(this.tables['before'].data[0]);
            this.tables['before'].headers.splice(0, 0, this.tables['before'].headers.pop());
          }
          this.tables['after'].data = data.afterTable;
          this.tables['after'].headers = Object.keys(this.tables['after'].data[0]);
          this.tables['after'].headers.splice(0, 0, this.tables['after'].headers.pop());
          // console.log(this.tables['after'].headers);
          // console.log(this.tables['after'].data);
        }
      }
    } catch (error) {
      console.log('Error Fetching Table:');
      console.log(error);
      console.log('Invalid request made!');
      const { message, title, type } = error;
      this.authService.showToaster(message, title, type);
      return;
    }
  };

  // Fetches the rows from a particular column in a given table
  fetchTableColumnRows = (table: string, column: string, filter: string = null) => {
    // console.log('Table-Column', table + '-' + column);
    table = table.toUpperCase();
    const queryString = qs.stringify({ table, column, filter });
    console.log('apiQuery:', `${environment.apiUrl}tableColumnRows/?${queryString}`);
    this.fetchedTableColumnRows = this.http.get<any>(
      `${environment.apiUrl}tableColumnRows/?${queryString}`
    ) as Observable<any>;
    return this.fetchedTableColumnRows;
  }

  async dynamicAutoComplete (query: string | Fuse.Expression, table: string, column: string) {
    const options = {
      threshold: 0.1,
      includeScore: true,
      isCaseSensitive: true
    };
    const data = await this.fetchTableColumnRows(table, column).toPromise();
    if (data) {
      const fuse = new Fuse(data, options);
      const result = fuse.search(query);
      if (query === '') {
        return data;
      } else {
        return result.map(res => res.item);
      }
    } else {
      return [];
    }
  }

  updateTable = async (apiBody: ApiPostBody) => {
    if (apiBody.command !== 'loadData') {
      const filteredApiBody = {
        table: apiBody.table,
        values: [],
        command: apiBody.command,
        user: this.authService.user,
        token: this.authService.token
      };
      if (filteredApiBody.command === 'moveRow') {
        // filteredApiBody.values.push(apiBody.values[0]);
        const tableData = this.tables['after'].data;
        const newData = apiBody.values[0];
        for (let i = 0; i < tableData.length; i++) {
          const row = tableData[i];
          const newDataRow = newData.find((r: { ID: any }) => r.ID === row.ID);
          if (typeof newDataRow !== 'undefined') {
            row.Sort_ID = newDataRow.Sort_ID;
          }
        }
        filteredApiBody.values.push(tableData);
      } else {
        filteredApiBody.values = [...apiBody.values];
      }
      // console.log(`Before ${apiBody.table} with `, apiBody, `to ${environment.apiUrl}?`);

      // console.log(`Updated ${filteredApiBody.table} with `, filteredApiBody, `to ${environment.apiUrl}?`);
      if (filteredApiBody.values.length > 0 || filteredApiBody.command === 'createRow') {
        let postedTable: Observable<ApiPostBody>;
        switch (filteredApiBody.command) {
          case 'createRow':
            console.log('ApiQuery: ', `${environment.apiUrl}rows/?`,
              JSON.stringify(filteredApiBody));
            postedTable = this.http.post<ApiPostBody>(
              `${environment.apiUrl}rows/?`,
              JSON.stringify(filteredApiBody),
              { headers: { 'content-type': 'application/json' } }
            ) as Observable<ApiPostBody>;
            break;
          case 'moveRow':
            console.log('ApiQuery: ', `${environment.apiUrl}rows/?`,
              JSON.stringify(filteredApiBody));
            postedTable = this.http.patch<ApiPostBody>(
              `${environment.apiUrl}rows/?`,
              JSON.stringify(filteredApiBody),
              { headers: { 'content-type': 'application/json' } }
            ) as Observable<ApiPostBody>;
            break;
          case 'removeRow':
            console.log('Delete: ', filteredApiBody);
            const queryString = qs.stringify(filteredApiBody);
            console.log('ApiQuery: ', `${environment.apiUrl}rows/?`,
              JSON.stringify(filteredApiBody));
            postedTable = this.http.delete<ApiPostBody>(
              `${environment.apiUrl}rows/?${queryString}`,
            ) as Observable<ApiPostBody>;
            break;
          case 'updateRow':
            console.log('ApiQuery: ', `${environment.apiUrl}rows/?`,
              JSON.stringify(filteredApiBody));
            postedTable = this.http.patch<ApiPostBody>(
              `${environment.apiUrl}rows/?`,
              JSON.stringify(filteredApiBody),
              { headers: { 'content-type': 'application/json' } }
            ) as Observable<ApiPostBody>;
            break;
          default:
            break;
        }
        return await postedTable.toPromise();
        // console.log('Table has finished updating!');
      } else {
        console.log('The values were the same! No changes made.');
      }
    } else {
      console.log(`Load Data doesn't need to update the table...`);
    }
  };
}
