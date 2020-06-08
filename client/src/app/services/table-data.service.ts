import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
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
  constructor(private http: HttpClient) {}

  fetchTables = table => {
    this.getTable(table).subscribe(({ data }) => {
      // this.tables[table] = data;
      // console.log(`${table}: `, this.tables[table]);
      // this.tables[table].headers.push(Object.keys(this.tables[table][0]));
      // this.tables[table].data.push(this.tables[table]);
      console.log(`${table}: `, data);
      this.tables[table].data = data;
      this.tables[table].headers = Object.keys(this.tables[table].data[0]);
      // console.log(this.tables[table].headers);
    });
  };
  getTable = table => {
    console.log(window.location.origin);
    return this.http.get(`${environment.apiUrl}${table}`) as Observable<{ data: [] }>;
  };

}
