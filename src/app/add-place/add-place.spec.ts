import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPlace } from './add-place';

describe('AddPlace', () => {
  let component: AddPlace;
  let fixture: ComponentFixture<AddPlace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPlace]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPlace);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
