import { TestBed } from '@angular/core/testing';

import { NgfuseService } from './ngfuse.service';

describe('NgfuseService', () => {
  let service: NgfuseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgfuseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
