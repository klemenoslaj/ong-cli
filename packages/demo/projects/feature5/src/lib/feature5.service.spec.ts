import { TestBed } from '@angular/core/testing';

import { Feature5Service } from './feature5.service';

describe('Feature5Service', () => {
  let service: Feature5Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Feature5Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
