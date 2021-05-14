import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  currentSection = 'AboutUs';
  sections = [
    'About Us',
    'CorPH Guidelines',
    'Project Output',
    'Publications'
  ]
  fragment$: Subscription;
  constructor (private route: ActivatedRoute) { }

  ngOnInit () {

  }
  ngAfterViewInit (): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.fragment$ = this.route.fragment.subscribe(fragment => {
      // console.log(fragment)
      const element = document.querySelector("#" + fragment)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ block: 'start', behavior: 'smooth' })
          this.currentSection = fragment;
        }, 50)
      };
    })
  }

  ngOnDestroy (): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.fragment$.unsubscribe();
  }
  onSectionChange (sectionId: string) {
    this.currentSection = sectionId;
  }

  scrollTop () {
    document
      .querySelector('#AboutUs')
      .scrollIntoView({ block: 'start', behavior: 'smooth' });
    document
      .querySelector('#sidenav-main')
      .scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  scrollTo (section) {
    document
      .querySelector('#' + section)
      .scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
}
