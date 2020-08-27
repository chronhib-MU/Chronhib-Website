import { AuthService } from './../../services/auth.service';
import { Component, OnInit, ElementRef } from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { Router } from '@angular/router';

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}
export const ROUTES: RouteInfo[] = [
  {
    path: '/dashboard',
    title: 'Dashboard',
    icon: 'ni-tv-2 text-marigold',
    class: ''
  },
  { path: '/user-profile', title: 'User profile', icon: 'ni-single-02 text-marigold', class: '' },
  { path: '/tables', title: 'Tables', icon: 'ni-bullet-list-67 text-marigold', class: '' },
  { path: '/login', title: 'Login', icon: 'ni-key-25 text-marigold', class: 'auth' },
  { path: '/register', title: 'Register', icon: 'ni-circle-08 text-marigold', class: 'auth' }
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  public menuItems: any[];
  public isCollapsed = true;

  public focus;
  public location: Location;
  constructor(
    public authService: AuthService,
    location: Location,
    private element: ElementRef,
    private router: Router
  ) {
    this.location = location;
  }

  ngOnInit() {
    this.menuItems = ROUTES.filter(menuItem => menuItem);
    // ROUTES[2].class = this.getTitle() === 'Register' ? 'd-none' : '';

    this.router.events.subscribe(event => {
      this.isCollapsed = true;
    });
  }
  getTitle() {
    let title = this.location.prepareExternalUrl(this.location.path());
    if (title.charAt(0) === '#') {
      title = title.slice(1);
    }
    // split by '/' and '?'
    title.split(/[?\/]+/);
    for (const page of title.split(/[?\/]+/)) {
      title = '/' + page;
      for (const menuItem of this.menuItems) {
        if (menuItem.path === title) {
          return menuItem.title;
        }
      }
    }
    return 'Dashboard';
  }
}
