import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiGetQuery } from '../interfaces/api-get-query';
import { ApiPostBody } from '../interfaces/api-post-body';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import * as qs from 'qs';
@Injectable({
  providedIn: 'root'
})
export class TableDataService {
  tables: any = {
    names: ['text', 'sentences', 'morphology', 'lemmata'],
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
  allHeaders = { text: [], sentences: [], morphology: [], lemmata: [] };
  fetchedTable: Observable<{ data: { afterTable: []; beforeTable: [] } }>;
  currentApiQuery: any;
  searchTable = { headers: [], data: [] };
  searchForm: FormGroup;
  searchQuerySub: Subject<any> = new Subject<FormGroup>();
  data: any;
  constructor(private router: Router, private http: HttpClient, private authService: AuthService) {}

  // Fetches the headers for each table
  fetchHeaders = async () => {
    try {
      await this.tables.names.forEach(async name => {
        // console.log(name);
        const fetchedHeaders: Observable<any> = this.http.get<any>(
          `${environment.apiUrl}${name}/headers`
        ) as Observable<any>;
        const { data } = await fetchedHeaders.toPromise();
        // console.log(data);
        this.allHeaders[name] = data;
      });
      // console.log(this.allHeaders);
    } catch (error) {
      console.log('Invalid request made!');
      return;
    }
  };

  // Fetches table data from the API
  fetchTable = async (apiQuery: ApiGetQuery | string) => {
    this.currentApiQuery = apiQuery;

    // console.log(window.location.origin);
    // console.log('apiQuery:', apiQuery);
    // console.log(environment.apiUrl);
    try {
      // Checks if the query was a table name e.g. 'text', 'sentences' etc. else it has to be an API query object
      if (this.tables.names.indexOf(apiQuery) > -1 && typeof apiQuery === 'string') {
        this.fetchedTable = this.http.get(`${environment.apiUrl}${apiQuery}`) as Observable<{
          data: { afterTable: []; beforeTable: [] };
        }>;
        const { data } = await this.fetchedTable.toPromise();
        // console.log(`${apiQuery}: `, data.afterTable);
        this.tables[apiQuery].data = data.afterTable;
        this.tables[apiQuery].headers = Object.keys(this.tables[apiQuery].data[0]);
        // console.log(this.tables[apiQuery].headers);
      }
      if (typeof apiQuery !== 'string') {
        // Object.keys(apiQuery)
        //   .map(key => key + '=' + apiQuery[key])
        //   .join('&');
        console.log(apiQuery);
        const search = apiQuery.search === 'true' ? true : false;
        const queryString = qs.stringify(apiQuery);
        this.fetchedTable = this.http.get(`${environment.apiUrl}?${queryString}`) as Observable<{
          data: { afterTable: []; beforeTable: [] };
        }>;
        const fetchedData = await this.fetchedTable.toPromise();
        const data = fetchedData.data;
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
          if (apiQuery.dtable !== apiQuery.ctable) {
            this.tables[apiQuery.ctable].data = data.beforeTable;
            this.tables[apiQuery.ctable].headers = Object.keys(this.tables[apiQuery.ctable].data[0]);
          }
          this.tables[apiQuery.dtable].data = data.afterTable;
          this.tables[apiQuery.dtable].headers = Object.keys(this.tables[apiQuery.dtable].data[0]);
          // console.log(this.tables[apiQuery.dtable].headers);
        }
      }
      return;
    } catch (error) {
      console.log(error);
      console.log('Invalid request made!');
      return;
    }
  };

  updateTable = async (apiBody: ApiPostBody) => {
    if (apiBody.command !== 'loadData') {
      const filteredApiBody = {
        table: apiBody.table,
        values: [],
        command: apiBody.command,
        requestedBy: this.authService.user
      };
      if (filteredApiBody.command === 'moveRow') {
        // filteredApiBody.values.push(apiBody.values[0]);
        const tableData = this.tables[filteredApiBody.table].data;
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
      // const queryString = Object.keys(filteredApiBody)
      //   .map(key => key + '=' + filteredApiBody[key])
      //   .join('&');
      // console.log(`Before ${apiBody.table} with `, apiBody, `to ${environment.apiUrl}?`);

      // console.log(`Updated ${filteredApiBody.table} with `, filteredApiBody, `to ${environment.apiUrl}?`);
      if (filteredApiBody.values.length > 0) {
        const postedTable: Observable<ApiPostBody> = this.http.post<ApiPostBody>(
          `${environment.apiUrl}?`,
          JSON.stringify(filteredApiBody),
          { headers: { 'content-type': 'application/json' } }
        ) as Observable<ApiPostBody>;
        await postedTable.toPromise();
        // console.log('Table has finished updating!');
      } else {
        console.log('The values were the same! No changes made.');
      }
    } else {
      console.log(`Load Data doesn't need to update the table...`);
    }
  };
}
