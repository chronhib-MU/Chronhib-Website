import { Component } from '@angular/core';
import { TableDataService } from './services/table-data.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'chronhib2020';
  constructor(private tableData: TableDataService) {}
}
