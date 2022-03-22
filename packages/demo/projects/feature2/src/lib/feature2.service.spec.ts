import { TestBed } from '@angular/core/testing';

import { Feature2Service } from './feature2.service';

describe('Feature2Service', () => {
  let service: Feature2Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Feature2Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
