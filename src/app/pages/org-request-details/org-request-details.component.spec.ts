import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgRequestDetailsComponent } from './org-request-details.component';

describe('OrgRequestDetailsComponent', () => {
  let component: OrgRequestDetailsComponent;
  let fixture: ComponentFixture<OrgRequestDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgRequestDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrgRequestDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
