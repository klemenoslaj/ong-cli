import { TestBed } from '@angular/core/testing';

import { Demo2Service } from './demo2.service';

describe('Demo2Service', () => {
  let service: Demo2Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Demo2Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
