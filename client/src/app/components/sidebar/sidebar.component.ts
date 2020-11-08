import {
  Analysis,
  Augm,
  CausingMut,
  Contr,
  Depend,
  Depon,
  Hiat,
  MSChecked,
  Mut,
  PartOfSpeech,
  Rel,
  Trans
} from './../../model/columnOpts.model';
import { TableDataService } from './../../services/table-data.service';
import { AuthService } from './../../services/auth.service';
import { Component, OnInit, ElementRef } from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import Fuse from 'fuse.js';

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

  public menuItems: any[];
  public isCollapsed = true;

  public focus;
  public location: Location;
  public columnSearchArray = [
    'Analysis',
    'Augm',
    'Causing_Mut',
    'Contr',
    'Depend',
    'Depon',
    'Hiat',
    'MS_Checked',
    'Mut',
    'Part_Of_Speech',
    'Rel',
    'Trans'
  ];
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
    this.menuItems = ROUTES.filter(menuItem => menuItem);
    // ROUTES[2].class = this.getTitle() === 'Register' ? 'd-none' : '';
    this.tableData.searchForm = this.fb.group({
      tableColumns: this.fb.array([this.createTableColumns(0)]),
      conditions: this.fb.array([this.createConditions(0)]),
      options: this.fb.group(this.createOptions(0))
    });
    this.router.events.subscribe(event => {
      this.isCollapsed = true;
    });
  }
  mapSearchData(data) {
    let res = [];
    res = data.map(value => ({ name: value.replaceAll('_', ' '), value }));
    return res;
  }
  onItemSelect(item: any, index: number) {
    console.log(item);
    this.tableData.searchForm.get('tableColumns')['controls'][index].controls.column.patchValue(['ID']);
  }

  excludePreviousTableOptions(i) {
    return this.tableData.tables.names.filter(table => {
      if (this.tableData.searchForm) {
        const searchFormTables = this.tableData.searchForm
          .get('tableColumns')
          ['controls'].map(val => val.controls.table.value)
          .filter((val, index) => index !== i);
        if (!searchFormTables.includes(table.toUpperCase())) {
          return true;
        }
      } else {
        // Form has not been created yet!
        return true;
      }
    });
  }
  createTableColumns(i) {
    return this.fb.group({
      table: [this.excludePreviousTableOptions(i)[0].toUpperCase(), Validators.required],
      column: [['ID'], Validators.required]
    });
  }
  createConditions(i) {
    return this.fb.group({
      table: ['TEXT', Validators.required],
      column: ['ID', Validators.required],
      operator: i > 0 ? ['AND', Validators.required] : [''],
      comparator: ['contains', Validators.required],
      comparatorVal: ['']
    });
  }
  createOptions(i) {
    return {
      noConditions: [false, Validators.required],
      duplicateRows: [true, Validators.required],
      limit: [0, [Validators.required, Validators.min(0)]]
    };
  }

  addFormGroup(column) {
    switch (column) {
      case 'tableColumns':
        (this.tableData.searchForm.controls[column] as FormArray).push(
          this.createTableColumns((this.tableData.searchForm.controls[column] as FormArray).length)
        );
        break;
      case 'conditions':
        (this.tableData.searchForm.controls[column] as FormArray).push(
          this.createConditions((this.tableData.searchForm.controls[column] as FormArray).length)
        );
        break;
      default:
        break;
    }
  }
  removeFormGroup(column, index) {
    switch (column) {
      case 'tableColumns':
        (this.tableData.searchForm.controls[column] as FormArray).removeAt(index);
        break;
      case 'conditions':
        (this.tableData.searchForm.controls[column] as FormArray).removeAt(index);
        break;
      default:
        break;
    }
  }

  resetForm() {
    this.tableData.searchForm = this.fb.group({
      tableColumns: this.fb.array([this.createTableColumns(0)]),
      conditions: this.fb.array([this.createConditions(0)]),
      options: this.fb.group(this.createOptions(0))
    });
    this.tableData.searchForm.reset(this.tableData.searchForm.value);
  }
  get sF() {
    return this.tableData.searchForm.controls;
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
          this.closeResult = 'Dismissed $this.getDismissReason(reason)';
        }
      );
    }
  }

  searchTable(close) {
    console.log(this.tableData.searchForm.value);
    const id = performance.now().toString().split('.').join('');
    console.log(id);
    localStorage.setItem(id, JSON.stringify(this.tableData.searchForm.value));
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() =>
      this.router.navigate(['/tables'], {
        queryParams: {
          page: 0,
          limit: 0,
          fprop: '',
          fval: '',
          dtable: 'search',
          ctable: '',
          search: true,
          id
        }
      })
    );
    close();
  }

  comparatorSearch(index) {
    const name = this.tableData.searchForm.get('conditions')['controls'][index].controls.column.value;
    const input = this.tableData.searchForm.get('conditions')['controls'][index].controls.comparatorVal.value;

    let columnVals = [];
    switch (name) {
      case 'Analysis':
        columnVals = Analysis;
        break;
      case 'Augm':
        return Augm;
      case 'Causing_Mut':
        return CausingMut;
      case 'Contr':
        return Contr;
      case 'Depend':
        return Depend;
      case 'Depon':
        return Depon;
      case 'Hiat':
        return Hiat;
      case 'MS_Checked':
        return MSChecked;
      case 'Mut':
        return Mut;
      case 'Part_Of_Speech':
        columnVals = PartOfSpeech;
        break;
      case 'Rel':
        return Rel;
      case 'Trans':
        return Trans;
      default:
        break;
    }
    const options = {
      includeScore: true,
      isCaseSensitive: true
    };

    const fuse = new Fuse(columnVals, options);

    const result = fuse.search(input);
    return result.map(res => res.item);
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
