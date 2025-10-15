import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, effect, DestroyRef, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceDisplayComponent } from '../network-canvas/device-display/device-display';
import { NetworkCanvasComponent } from '../network-canvas/network-canvas';
import { DeviceService } from '../services/device.service';
import { DataInitializationService } from '../services/data-initialization.service';
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
  private dataInitializationService = inject(DataInitializationService);
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
        // Connection seeding is now handled by the data initialization service
        this.connectionsAdded = true;
      }
      
      // Reset flag if devices are cleared (for testing/reloading scenarios)
      if (devices.length === 0) {
        this.connectionsAdded = false;
      }
    });
  }

  async ngOnInit() {
    try {
      // Initialize application data through the dedicated service
      await this.dataInitializationService.initializeApplicationData();
    } catch (error) {
      console.error('Failed to initialize application data:', error);
      // Handle error gracefully - app can still function without demo data
    }
  }

  // Method to reset application data (useful for testing or when devices are reloaded)
  async resetApplicationData(): Promise<void> {
    try {
      this.connectionsAdded = false;
      await this.dataInitializationService.resetApplicationData();
    } catch (error) {
      console.error('Failed to reset application data:', error);
      throw error;
    }
  }

  ngOnDestroy(): void {
    if (this.effectRef) {
      this.effectRef.destroy();
    }
  }
}
