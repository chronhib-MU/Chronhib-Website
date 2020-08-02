import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiGetQuery } from '../interfaces/api-get-query';
import { ApiPostBody } from '../interfaces/api-post-body';
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
  fetchedTable: Observable<{ data: { afterTable: []; beforeTable: [] } }>;
  currentApiQuery: ApiGetQuery | string;
  constructor (private http: HttpClient) { }
  // Fetches table data from the API
  fetchTable = async (apiQuery: ApiGetQuery | string) => {
    this.currentApiQuery = apiQuery;
    const queryString = Object.keys(apiQuery)
      .map(key => key + '=' + apiQuery[key])
      .join('&');
    // console.log(window.location.origin);
    // console.log('apiQuery:', apiQuery);
    console.log(environment.apiUrl);
    // Checks if the query was a table name e.g. 'text', 'sentences' etc. else it has to be an API query object
    if (this.tables.names.indexOf(apiQuery) > -1 && typeof apiQuery === 'string') {
      this.fetchedTable = this.http.get(`${environment.apiUrl}${apiQuery}`) as Observable<{
        data: { afterTable: []; beforeTable: [] };
      }>;
      const { data } = await this.fetchedTable.toPromise();
      console.log(`${apiQuery}: `, data.afterTable);
      this.tables[apiQuery].data = data.afterTable;
      this.tables[apiQuery].headers = Object.keys(this.tables[apiQuery].data[0]);
      // console.log(this.tables[apiQuery].headers);
    } else if (typeof apiQuery !== 'string') {
      this.fetchedTable = this.http.get(`${environment.apiUrl}?${queryString}`) as Observable<{
        data: { afterTable: []; beforeTable: [] };
      }>;
      const { data } = await this.fetchedTable.toPromise();
      console.log(`${queryString}: `, data);
      if (apiQuery.dtable !== apiQuery.ctable) {
        this.tables[apiQuery.ctable].data = data.beforeTable;
        this.tables[apiQuery.ctable].headers = Object.keys(this.tables[apiQuery.ctable].data[0]);
      }
      this.tables[apiQuery.dtable].data = data.afterTable;
      this.tables[apiQuery.dtable].headers = Object.keys(this.tables[apiQuery.dtable].data[0]);
      // console.log(this.tables[apiQuery.dtable].headers);
    }
  };
  updateTable = async (apiBody: ApiPostBody) => {
    if (apiBody.command !== 'loadData') {
      const filteredApiBody = {
        table: apiBody.table,
        values: [],
        command: apiBody.command
      };
      if (filteredApiBody.command === 'moveRow') {
        // filteredApiBody.values.push(apiBody.values[0]);
        let tableData = this.tables[filteredApiBody.table].data;
        let newData = apiBody.values[0];
        for (let i = 0; i < tableData.length; i++) {
          let row = tableData[i];
          let newDataRow = newData.find(r => r.ID_unique_number === row.ID_unique_number);
          if (typeof newDataRow !== "undefined") {
            row.Sort_ID = newDataRow.Sort_ID;
          }
        }
        filteredApiBody.values.push(tableData);
      }
      else {
        filteredApiBody.values = [...apiBody.values];
      }
      // const queryString = Object.keys(filteredApiBody)
      //   .map(key => key + '=' + filteredApiBody[key])
      //   .join('&');
      console.log(`Before ${apiBody.table} with `, apiBody, `to ${environment.apiUrl}?`);

      console.log(`Updated ${filteredApiBody.table} with `, filteredApiBody, `to ${environment.apiUrl}?`);
      if (filteredApiBody.values.length > 0) {
        const postedTable: Observable<ApiPostBody> = this.http.post<ApiPostBody>(`${environment.apiUrl}?`, filteredApiBody) as Observable<
          ApiPostBody
        >;
        await postedTable.toPromise();
        console.log('Done updating!');
      } else {
        console.log('The values were the same! No changes made.');
      }
    } else {
      console.log(`Load Data doesn't need to update the table...`);
    }
  };
}
