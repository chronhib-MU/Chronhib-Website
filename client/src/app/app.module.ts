import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';

import { AppRoutingModule } from './app.routing';
import { TableDataService } from './services/table-data.service';
import { AuthService } from './services/auth.service';
import { ToastrModule } from 'ngx-toastr';
import { NgFusePipe } from './pipe/ngfuse.pipe';
import { NgFuseService } from './services/ngfuse.service';
@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    MatInputModule,
    MatPaginatorModule,
    NgSelectModule,
    // NgOptionHighlightModule,
    RouterModule,
    AppRoutingModule,
    ToastrModule.forRoot({
      timeOut: 5000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true
    })
  ],
  declarations: [AppComponent, AdminLayoutComponent, AuthLayoutComponent, FooterComponent, NavbarComponent, SidebarComponent, NgFusePipe],
  providers: [TableDataService, AuthService, NgFuseService],
  bootstrap: [AppComponent]
})
export class AppModule { }
