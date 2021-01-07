import { Routes } from '@angular/router';

import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { UserProfileComponent } from '../../pages/user-profile/user-profile.component';
import { TablesComponent } from '../../pages/tables/tables.component';
import { AuthGuard } from '../../guards/auth.guard';

export const AdminLayoutRoutes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'user-profile', canActivate: [AuthGuard], component: UserProfileComponent },
  { path: 'tables/:table', canActivate: [AuthGuard], pathMatch: 'full', component: TablesComponent },
  { path: 'tables', canActivate: [AuthGuard], component: TablesComponent }
];
