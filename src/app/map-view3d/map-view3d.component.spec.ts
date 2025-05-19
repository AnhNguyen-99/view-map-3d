import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapView3dComponent } from './map-view3d.component';

describe('MapView3dComponent', () => {
  let component: MapView3dComponent;
  let fixture: ComponentFixture<MapView3dComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MapView3dComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapView3dComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
