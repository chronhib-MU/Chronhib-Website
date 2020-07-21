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
  postedTable: Observable<ApiPostBody>;
  constructor (private http: HttpClient) { }
  // Fetches table data from the API
  fetchTable = (apiQuery: ApiGetQuery | string) => {
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
      const fetchedTable$ = this.fetchedTable.subscribe(({ data }) => {
        console.log(`${apiQuery}: `, data.afterTable);
        this.tables[apiQuery].data = data.afterTable;
        this.tables[apiQuery].headers = Object.keys(this.tables[apiQuery].data[0]);
        // console.log(this.tables[apiQuery].headers);
      });
    } else if (typeof apiQuery !== 'string') {
      this.fetchedTable = this.http.get(`${environment.apiUrl}?${queryString}`) as Observable<{
        data: { afterTable: []; beforeTable: [] };
      }>;
      const fetchedTable$ = this.fetchedTable.subscribe(({ data }) => {
        console.log(`${queryString}: `, data);
        if (apiQuery.dtable !== apiQuery.ctable) {
          this.tables[apiQuery.ctable].data = data.beforeTable;
          this.tables[apiQuery.ctable].headers = Object.keys(this.tables[apiQuery.ctable].data[0]);
        }
        this.tables[apiQuery.dtable].data = data.afterTable;
        this.tables[apiQuery.dtable].headers = Object.keys(this.tables[apiQuery.dtable].data[0]);
        // console.log(this.tables[apiQuery.dtable].headers);
      });
      fetchedTable$.unsubscribe();
    }
  };
  updateTable = (apiBody: ApiPostBody) => {
    if (apiBody.command !== 'loadData') {
      const filteredApiBody = {
        table: apiBody.table,
        values: [],
        command: apiBody.command
      };
      if (filteredApiBody.command === 'moveRow') {
        filteredApiBody.values.push(apiBody.values[0]);
      }
      else {
        apiBody.values.forEach((value, index) => {
          apiBody.values[index][0] = this.tables[filteredApiBody.table].data[value[0]].ID_unique_number;
          console.log(apiBody.values[index][2], ' != ', apiBody.values[index][3]);
          if (apiBody.values[index][2] !== apiBody.values[index][3]) {
            filteredApiBody.values.push(apiBody.values[index]);
          }
        });
      }
      // const queryString = Object.keys(filteredApiBody)
      //   .map(key => key + '=' + filteredApiBody[key])
      //   .join('&');
      console.log(`Before ${apiBody.table} with `, apiBody, `to ${environment.apiUrl}?`);

      console.log(`Updated ${filteredApiBody.table} with `, filteredApiBody, `to ${environment.apiUrl}?`);
      if (filteredApiBody.values.length > 0) {
        console.log(filteredApiBody.values[0]);
        this.postedTable = this.http.post<ApiPostBody>(`${environment.apiUrl}?`, filteredApiBody) as Observable<
          ApiPostBody
        >;
        const postedTable$ = this.postedTable.subscribe(() => {
          postedTable$.unsubscribe();
        });
        console.log('Done updating!');
      } else {
        console.log('The values were the same! No changes made.');
      }
    } else {
      console.log(`Load Data doesn't need to update the table...`);
    }
  };
}
