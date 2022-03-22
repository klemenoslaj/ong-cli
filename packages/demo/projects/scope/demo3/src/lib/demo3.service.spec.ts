import { TestBed } from '@angular/core/testing';

import { Demo3Service } from './demo3.service';

describe('Demo3Service', () => {
  let service: Demo3Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Demo3Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
