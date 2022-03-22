import { TestBed } from '@angular/core/testing';

import { Feature3Service } from './feature3.service';

describe('Feature3Service', () => {
  let service: Feature3Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Feature3Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
