import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  currentDate: Date = new Date();
  routeParams: any;
  route: string;

  constructor (private router: Router) {
    this.routeParams = this.router.events.subscribe(val => {

      if (val instanceof NavigationEnd) this.route = val.url.substring(1, val.url.length);// console.log(val.url); }
    });
  }

  ngOnInit () {

  }

  ngOnDestroy (): void {
    this.routeParams.unsubscribe();
  }

  refresh () {
    throw new Error('Method not implemented.');
  }

}
