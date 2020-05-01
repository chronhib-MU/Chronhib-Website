import { Routes } from '@angular/router';

import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { UserProfileComponent } from '../../pages/user-profile/user-profile.component';
import { TablesComponent } from '../../pages/tables/tables.component';

export const AdminLayoutRoutes: Routes = [
         { path: 'dashboard', component: DashboardComponent },
         { path: 'user-profile', component: UserProfileComponent },
         { path: 'tables/:table', pathMatch: 'full', component: TablesComponent },
         { path: 'tables', component: TablesComponent },
       ];
