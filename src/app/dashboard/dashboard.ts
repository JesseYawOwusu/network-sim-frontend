import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, effect, DestroyRef, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceDisplayComponent } from '../network-canvas/device-display/device-display';
import { NetworkCanvasComponent } from '../network-canvas/network-canvas';
import { DeviceService } from '../services/device.service';
import { DemoDataService } from '../services/demo-data.service';
import { Device } from '../models/device.model';
import { Connection } from '../models/connection.model';
import { environment } from '../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DeviceDisplayComponent, NetworkCanvasComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private deviceService = inject(DeviceService);
  private demoDataService = inject(DemoDataService);
  private destroyRef = inject(DestroyRef);
  private connectionsAdded = false;
  private effectRef?: EffectRef;

  constructor() {
    // Watch for devices to be loaded, then add connections
    this.effectRef = effect(() => {
      const devices = this.deviceService.devices();
      const connections = this.deviceService.connections();
      
      // Add connections if we have devices but no connections yet
      if (devices.length > 0 && connections.length === 0 && !this.connectionsAdded) {
        this.demoDataService.seedConnections('medium');
        this.connectionsAdded = true;
      }
      
      // Reset flag if devices are cleared (for testing/reloading scenarios)
      if (devices.length === 0) {
        this.connectionsAdded = false;
      }
    });
  }

  ngOnInit() {
    // Initialize demo data through the dedicated service using environment configuration
    this.demoDataService.initializeDemoData(environment.demoData);
  }

  // Method to reset demo data (useful for testing or when devices are reloaded)
  resetDemoData(): void {
    this.connectionsAdded = false;
    this.demoDataService.resetDemoData(environment.demoData);
  }

  ngOnDestroy(): void {
    if (this.effectRef) {
      this.effectRef.destroy();
    }
  }
}
