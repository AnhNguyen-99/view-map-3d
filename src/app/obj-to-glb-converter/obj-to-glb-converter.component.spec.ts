import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjToGlbConverterComponent } from './obj-to-glb-converter.component';

describe('ObjToGlbConverterComponent', () => {
  let component: ObjToGlbConverterComponent;
  let fixture: ComponentFixture<ObjToGlbConverterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObjToGlbConverterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObjToGlbConverterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
