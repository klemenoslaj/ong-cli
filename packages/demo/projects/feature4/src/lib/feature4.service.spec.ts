import { TestBed } from '@angular/core/testing';

import { Feature4Service } from './feature4.service';

describe('Feature4Service', () => {
  let service: Feature4Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Feature4Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
