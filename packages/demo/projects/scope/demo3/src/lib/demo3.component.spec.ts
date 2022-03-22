import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Demo3Component } from './demo3.component';

describe('Demo3Component', () => {
  let component: Demo3Component;
  let fixture: ComponentFixture<Demo3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Demo3Component],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Demo3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
