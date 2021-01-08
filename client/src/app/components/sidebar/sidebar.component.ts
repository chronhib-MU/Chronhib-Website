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
import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import Fuse from 'fuse.js';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

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
export class SidebarComponent implements OnInit, OnDestroy {
  closeResult: string;

  public menuItems: any[];
  public isCollapsed = true;

  public focus: any;
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
  active = 'tableColumns';
  searchQuerySub$: any;
  constructor(
    public authService: AuthService,
    public tableData: TableDataService,
    location: Location,
    private element: ElementRef,
    private http: HttpClient,
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
    this.resetForm();
    this.searchQuerySub$ = this.tableData.searchQuerySub.subscribe(searchQueryVal => {
      const { tableColumns, conditions, options } = searchQueryVal;
      const accentTrueIndex = [];
      tableColumns.forEach((tableColumn: any, index: number) => {
        if (index > 0) {
          this.addFormGroup('tableColumns');
        }
      });
      conditions.forEach((condition: { accentSensitive: any }, index: number) => {
        if (index > 0) {
          this.addFormGroup('conditions');
        }
        if (condition.accentSensitive) {
          this.tableData.searchForm.get('conditions')['controls'][index].controls.caseSensitive.enable();
        }
      });
      this.tableData.searchForm.patchValue(searchQueryVal);
      this.tableData.searchForm.updateValueAndValidity();
    });
    this.router.events.subscribe(event => {
      this.isCollapsed = true;
    });
  }
  ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    this.searchQuerySub$.unsubscribe();
  }
  mapSearchData(data: any[]) {
    let res = [];
    res = data.map((value: { replaceAll: (arg0: string, arg1: string) => any }) => ({
      name: value.replaceAll('_', ' '),
      value
    }));
    return res;
  }
  onItemSelect(item: any, index: number) {
    // console.log(item);
    this.tableData.searchForm.get('tableColumns')['controls'][index].controls.column.patchValue(['ID']);
  }
  selectAll(i: string | number) {
    return this.tableData.searchForm
      .get('tableColumns')
      ['controls'][i].controls.column.patchValue(
        this.tableData.allHeaders[
          this.tableData.searchForm.get('tableColumns')['controls'][i].controls.table.value?.toLowerCase()
        ]
      );
  }

  unselectAll(i: string | number) {
    return this.tableData.searchForm.get('tableColumns')['controls'][i].controls.column.patchValue([]);
  }

  excludePreviousTableOptions(i: any) {
    return this.tableData.tables.names.filter((table: string) => {
      if (this.tableData.searchForm) {
        const searchFormTables = this.tableData.searchForm
          .get('tableColumns')
          ['controls'].map((val: { controls: { table: { value: any } } }) => val.controls.table.value)
          .filter((val: any, index: any) => index !== i);
        if (!searchFormTables.includes(table.toUpperCase())) {
          return true;
        }
      } else {
        // Form has not been created yet!
        return true;
      }
    });
  }
  createTableColumns(i: number) {
    return this.fb.group({
      table: [this.excludePreviousTableOptions(i)[0]?.toUpperCase(), Validators.required],
      column: [['ID'], Validators.required]
    });
  }
  createConditions(i: number) {
    return this.fb.group({
      table: ['TEXT', Validators.required],
      column: ['ID', Validators.required],
      negated: [''],
      caseSensitive: [{ value: false, disabled: true }, Validators.required],
      accentSensitive: [false, Validators.required],
      operator: i > 0 ? ['AND', Validators.required] : [''],
      comparator: ['contains', Validators.required],
      comparatorVal: ['']
    });
  }
  createOptions() {
    return {
      noConditions: [false, Validators.required],
      duplicateRows: [true, Validators.required],
      limit: [0, [Validators.required, Validators.min(0)]]
    };
  }

  addFormGroup(column: string, conditionsAcc?: { toggle: (arg0: string) => void }) {
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
        if (conditionsAcc) {
          setTimeout(() => {
            conditionsAcc.toggle('condition-' + (this.tableData.searchForm.get('conditions')['controls'].length - 1));
          }, 1);
        }
        break;
      default:
        break;
    }
  }
  removeFormGroup(
    column: string | number,
    index: number,
    conditionsAcc?: { activeIds: string[]; toggle: (arg0: string) => void }
  ) {
    switch (column) {
      case 'tableColumns':
        (this.tableData.searchForm.controls[column] as FormArray).removeAt(index);
        break;
      case 'conditions':
        (this.tableData.searchForm.controls[column] as FormArray).removeAt(index);
        if (
          conditionsAcc.activeIds[0] ===
          'condition-' + this.tableData.searchForm.get('conditions')['controls'].length
        ) {
          setTimeout(() => {
            console.log(conditionsAcc);

            conditionsAcc.toggle('condition-' + (this.tableData.searchForm.get('conditions')['controls'].length - 1));
          }, 1);
        }
        break;
      default:
        break;
    }
  }
  resetForm() {
    this.tableData.searchForm = this.fb.group({
      tableColumns: this.fb.array([this.createTableColumns(0)]),
      conditions: this.fb.array([this.createConditions(0)]),
      options: this.fb.group(this.createOptions())
    });
    this.tableData.searchForm.reset(this.tableData.searchForm.value);
  }
  get sF() {
    return this.tableData.searchForm.controls;
  }

  open(content: any, type: string, modalDimension: string) {
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
  updateCaseSensitive(i: string | number) {
    console.log(this.tableData.searchForm.get('conditions')['controls'][i].controls.accentSensitive.value, i);
    if (this.tableData.searchForm.get('conditions')['controls'][i].controls.accentSensitive.value === false) {
      this.tableData.searchForm.get('conditions')['controls'][i].controls.caseSensitive.patchValue(false);
      this.tableData.searchForm.get('conditions')['controls'][i].controls.caseSensitive.disable();
    } else {
      this.tableData.searchForm.get('conditions')['controls'][i].controls.caseSensitive.enable();
    }
    console.log(this.tableData.searchForm.get('conditions')['controls'][i].controls.caseSensitive);
  }

  async searchTable(close: () => void) {
    console.log(this.tableData.searchForm.value);
    console.log('Users Email:', this.authService.user.email);

    const id = await this.http
      .post(
        `${environment.apiUrl}?`,
        { query: JSON.stringify(this.tableData.searchForm.value), creator: this.authService.user.email || null },
        {
          headers: { 'content-type': 'application/json' }
        }
      )
      .toPromise();
    console.log(id);
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() =>
      this.router
        .navigate(['/tables'], {
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
        .then(() => this.resetForm())
    );
    close();
  }

  comparatorSearch(index: string | number) {
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
