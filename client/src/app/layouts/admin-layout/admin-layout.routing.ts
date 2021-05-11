import { Routes } from '@angular/router';

import { LandingComponent } from '../../pages/landing/landing.component';
import { MeetTheTeamComponent } from '../../pages/meet-the-team/meet-the-team.component';
import { TablesComponent } from '../../pages/tables/tables.component';
import { AuthGuard } from '../../guards/auth.guard';

export const AdminLayoutRoutes: Routes = [
  { path: 'landing', component: LandingComponent },
  { path: 'meet-the-team', component: MeetTheTeamComponent },
  { path: 'tables/:table', canActivate: [AuthGuard], pathMatch: 'full', component: TablesComponent },
  { path: 'tables', canActivate: [AuthGuard], component: TablesComponent }
];
