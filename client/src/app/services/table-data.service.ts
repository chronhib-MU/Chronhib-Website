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
    sentences: [],
    morphology: [],
    lemmata: []
  };
  constructor(private http: HttpClient) {}

  fetchTables = table => {
    this.getTable(table).subscribe(({ data }) => {
      this.tables[table] = data;
      // console.log(`${table}: `, this.tables[table]);
      this.tables[table].headers = Object.keys(this.tables[table][0]);
      this.tables[table].data = this.tables[table].filter(row => row.ID_unique_number);
    });
  };
  getTable = table => {
    console.log(window.location.origin);
    return this.http.get(`${environment.apiUrl}${table}`) as Observable<{ data: [] }>;
  };
}
