import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceDisplay } from './device-display';

describe('DeviceDisplay', () => {
  let component: DeviceDisplay;
  let fixture: ComponentFixture<DeviceDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeviceDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
