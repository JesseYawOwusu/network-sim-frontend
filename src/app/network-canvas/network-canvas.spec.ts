import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkCanvas } from './network-canvas';

describe('NetworkCanvas', () => {
  let component: NetworkCanvas;
  let fixture: ComponentFixture<NetworkCanvas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetworkCanvas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NetworkCanvas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
