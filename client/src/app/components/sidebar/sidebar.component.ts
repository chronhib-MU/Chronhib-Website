import { TableDataService } from './../../services/table-data.service';
import { AuthService } from './../../services/auth.service';
import { Component, OnInit, ElementRef } from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

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
  closeResult: string;
  searchForm: FormGroup;

  public menuItems: any[];
  public isCollapsed = true;

  public focus;
  public location: Location;
  constructor(
    public authService: AuthService,
    public tableData: TableDataService,
    location: Location,
    private element: ElementRef,
    private router: Router,
    private fb: FormBuilder,
    private modalService: NgbModal
  ) {
    this.location = location;
  }

  ngOnInit() {
    this.tableData.fetchHeaders();
    this.searchForm = this.fb.group({
      columns: this.fb.array([this.createColumns()])
    });
    this.menuItems = ROUTES.filter(menuItem => menuItem);
    // ROUTES[2].class = this.getTitle() === 'Register' ? 'd-none' : '';

    this.router.events.subscribe(event => {
      this.isCollapsed = true;
    });
  }
  createColumns() {
    return this.fb.group({
      table: ['TEXT'],
      column: ['*'],
      operator: [''],
      comparator: [''],
      comparatorVal: ['']
    });
  }
  test() {
    console.log(this.searchForm.get('columns')['controls'][0].controls.table.value.toLowerCase);
  }

  searchTable(close) {
    this.searchForm = this.fb.group({
      columns: this.fb.array([this.createColumns()])
    });
    close();
    this.searchForm.reset(this.searchForm.value);
  }
  addNext() {
    (this.searchForm.controls['columns'] as FormArray).push(this.createColumns());
  }

  get sF() {
    return this.searchForm.controls;
  }

  open(content, type, modalDimension) {
    if (modalDimension === 'sm' && type === 'modal_mini') {
      this.modalService.open(content, { windowClass: 'modal-mini', size: 'sm', centered: true }).result.then(
        result => {
          this.closeResult = 'Closed with: $result';
        },
        reason => {
          this.closeResult = 'Dismissed $this.getDismissReason(reason)';
        }
      );
    } else if (modalDimension === '' && type === 'Notification') {
      this.modalService.open(content, { windowClass: 'modal-danger', centered: true }).result.then(
        result => {
          this.closeResult = 'Closed with: $result';
        },
        reason => {
          this.closeResult = 'Dismissed $this.getDismissReason(reason)';
        }
      );
    } else {
      this.modalService.open(content, { centered: true }).result.then(
        result => {
          this.closeResult = 'Closed with: $result';
        },
        reason => {
          this.searchForm = this.fb.group({
            columns: this.fb.array([this.createColumns()])
          });
          this.searchForm.reset(this.searchForm.value);

          this.closeResult = 'Dismissed $this.getDismissReason(reason)';
        }
      );
    }
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return 'with: $reason';
    }
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
