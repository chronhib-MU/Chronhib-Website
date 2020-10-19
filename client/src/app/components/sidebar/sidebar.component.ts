import { TableDataService } from './../../services/table-data.service';
import { AuthService } from './../../services/auth.service';
import { Component, OnInit, ElementRef } from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import * as qs from 'qs';

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
  public finalQuery = '';
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
      searchQuery: this.fb.array([this.createSearchQuery(0)]),
      referenceColumn: false
    });
    this.menuItems = ROUTES.filter(menuItem => menuItem);
    // ROUTES[2].class = this.getTitle() === 'Register' ? 'd-none' : '';

    this.router.events.subscribe(event => {
      this.isCollapsed = true;
    });
  }
  createSearchQuery(i) {
    return this.fb.group({
      table: ['TEXT', Validators.required],
      column: [['Text_ID'], Validators.required],
      operator: [i > 1 ? 'AND' : ''],
      comparator: [i !== 0 ? 'contains' : ''],
      comparatorVal: i !== 0 ? ['', Validators.required] : ['']
    });
  }

  searchTable(close) {
    console.log(this.searchForm.value.searchQuery);
    /* const { searchQuery, referenceColumn } = this.searchForm.value;
    console.log(referenceColumn);
    console.log(searchQuery);
    const selectedTablesArr = [],
      fromTablesArr = [],
      fromTablesInnerJoins = {
        TEXT: `(((TEXT
            INNER JOIN SENTENCES ON TEXT.Text_ID = SENTENCES.Text_ID)
            INNER JOIN MORPHOLOGY ON TEXT.Text_ID = MORPHOLOGY.Text_ID)
            INNER JOIN LEMMATA ON TEXT.Text_ID = MORPHOLOGY.Text_ID AND MORPHOLOGY.Lemma = LEMMATA.Lemma)`,
        SENTENCES: `(((SENTENCES
            INNER JOIN TEXT ON SENTENCES.Text_ID = TEXT.Text_ID)
            INNER JOIN MORPHOLOGY ON SENTENCES.Text_Unit_ID = MORPHOLOGY.Text_Unit_ID)
            INNER JOIN LEMMATA ON SENTENCES.Text_Unit_ID = MORPHOLOGY.Text_Unit_ID AND MORPHOLOGY.Lemma = LEMMATA.Lemma)`,
        MORPHOLOGY: `(((MORPHOLOGY
            INNER JOIN TEXT ON MORPHOLOGY.Text_ID = TEXT.Text_ID)
            INNER JOIN SENTENCES ON MORPHOLOGY.Text_Unit_ID = SENTENCES.Text_Unit_ID)
            INNER JOIN LEMMATA ON MORPHOLOGY.Lemma = LEMMATA.Lemma)`,
        LEMMATA: `(((LEMMATA
            INNER JOIN TEXT ON LEMMATA.Lemma = MORPHOLOGY.Lemma AND TEXT.Text_ID = MORPHOLOGY.Text_ID)
            INNER JOIN SENTENCES ON LEMMATA.Lemma = MORPHOLOGY.Lemma AND SENTENCES.Text_Unit_ID = MORPHOLOGY.Text_Unit_ID)
            INNER JOIN MORPHOLOGY ON LEMMATA.Lemma = MORPHOLOGY.Lemma)`
      },
      whereConditionsArr = [];
    searchQuery.forEach((val, i) => {
      val.column.forEach(column => {
        if (i === 0 || referenceColumn) {
          // Creates the string that goes after the SELECT DISTINCT part
          let selectedTable = '`' + val.table + '` . ';
          selectedTable += '`' + column + '`';
          if (!selectedTablesArr.includes(selectedTable)) {
            selectedTablesArr.push(selectedTable);
          }
        }
      });

      // Adds all the tables for the FROM part
      fromTablesArr.push(val.table);
      let whereCondition = '';
      if (val.comparator) {
        if (val.operator) {
          // Adds AND/ORs if they exist
          whereCondition += val.operator + ' ';
        }
        // Adds the table.column reference
        whereCondition += '`' + val.table + '` . `' + val.column[0] + '` ';
        // Converts the comparator to sql where conditions
        switch (val.comparator) {
          case 'contains':
            whereCondition += 'LIKE ' + '%' + val.comparatorVal + '%';
            break;
          case 'starts with':
            whereCondition += 'LIKE ' + val.comparatorVal + '%';
            break;
          case 'ends with':
            whereCondition += 'LIKE ' + '%' + val.comparatorVal;
            break;
          default:
            whereCondition += val.comparator + ' ' + val.comparatorVal;
            break;
        }
      }
      whereConditionsArr.push(whereCondition);
    });
    const selectedTables = selectedTablesArr.join(', '),
      whereConditions = whereConditionsArr.join(' ');
    let fromTables = '';
    if (searchQuery.length === 1) {
      // Removes duplicates from the array
      fromTables = fromTablesArr.filter((val, index, self) => index === self.indexOf(val)).join(', ');
    } else {
      fromTables = fromTablesInnerJoins[searchQuery[0].table];
    }
    // Just checking to see if we've gotten everything right so far
    console.log('selectedTables: ', selectedTables);
    console.log('fromTables: ', fromTables);
    console.log('whereConditions: ', whereConditions);
    this.finalQuery =
      'SELECT DISTINCT ' +
      selectedTables +
      ' FROM ' +
      fromTables +
      (whereConditions ? ' WHERE ' + whereConditions : '') +
      ';';
    console.log(this.finalQuery);
    this.searchForm = this.fb.group({
      searchQuery: this.fb.array([this.createSearchQuery(0)])
    }); */
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
          value: qs.stringify(this.searchForm.value)
        }
      })
    );
    close();
    // this.finalQuery = '';
    // this.searchForm.reset(this.searchForm.value);
  }
  addNext() {
    (this.searchForm.controls['searchQuery'] as FormArray).push(
      this.createSearchQuery((this.searchForm.controls['searchQuery'] as FormArray).length)
    );
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
            searchQuery: this.fb.array([this.createSearchQuery(0)]),
            referenceColumn: false
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
