import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HotTableModule } from '@handsontable/angular';

import { ClipboardModule } from 'ngx-clipboard';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AdminLayoutRoutes } from './admin-layout.routing';
import { LandingComponent } from '../../pages/landing/landing.component';
import { MeetTheTeamComponent } from '../../pages/meet-the-team/meet-the-team.component';
import { TablesComponent } from '../../pages/tables/tables.component';
import { TableComponent } from '../../pages/tables/table/table.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    MatInputModule,
    MatPaginatorModule,
    HotTableModule.forRoot(),
    ClipboardModule
  ],
  declarations: [LandingComponent, MeetTheTeamComponent, TablesComponent, TableComponent],
  bootstrap: [MeetTheTeamComponent]
})
export class AdminLayoutModule { }
