import { TestBed } from '@angular/core/testing';

import { Feature1Service } from './feature1.service';

describe('Feature1Service', () => {
  let service: Feature1Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Feature1Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
