import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceDisplayComponent } from './network-canvas/device-display/device-display';
import { NetworkCanvasComponent } from './network-canvas/network-canvas';
import { DeviceService } from './services/device.service';
import { Device } from './models/device.model';
import { Connection } from './models/connection.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [CommonModule, DeviceDisplayComponent, NetworkCanvasComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private deviceService = inject(DeviceService);
  private destroyRef = inject(DestroyRef);
  private connectionsAdded = false;
  private effectCleanup?: () => void;

  constructor() {
    // Watch for devices to be loaded, then add connections
    this.effectCleanup = effect(() => {
      const devices = this.deviceService.devices();
      if (devices.length > 0 && !this.connectionsAdded) {
        this.addSampleConnections();
        this.connectionsAdded = true;
      }
    });
  }

  ngOnInit() {
    // Add some sample devices for testing
    this.addSampleDevices();
  }

  ngOnDestroy(): void {
    if (this.effectCleanup) {
      this.effectCleanup();
    }
  }

  private addSampleDevices() {
    const sampleDevices: Omit<Device, 'id' | 'lastUpdated'>[] = [
      {
        name: 'Router A',
        ip: '192.168.1.1',
        status: 'online',
        pingRate: 5,
        latency: 2,
        trafficLoad: 25,
        position: { x: 400, y: 80 } // Top center
      },
      {
        name: 'Switch B',
        ip: '192.168.1.2',
        status: 'offline',
        pingRate: 10,
        latency: 5,
        trafficLoad: 0,
        position: { x: 200, y: 200 } // Left side
      },
      {
        name: 'Server C',
        ip: '192.168.1.3',
        status: 'online',
        pingRate: 8,
        latency: 3,
        trafficLoad: 60,
        position: { x: 600, y: 200 } // Right side
      },
      {
        name: 'Firewall D',
        ip: '192.168.1.4',
        status: 'failed',
        pingRate: 15,
        latency: 10,
        trafficLoad: 0,
        position: { x: 150, y: 350 } // Bottom left
      },
      {
        name: 'Load Balancer E',
        ip: '192.168.1.5',
        status: 'online',
        pingRate: 6,
        latency: 2,
        trafficLoad: 40,
        position: { x: 650, y: 350 } // Bottom right
      }
    ];

    sampleDevices.forEach(device => {
      this.deviceService.addDeviceLocally({
        ...device,
        id: crypto.randomUUID(),
        lastUpdated: new Date()
      });
    });
  }

  private addSampleConnections() {
    const devices = this.deviceService.devices();
    
    if (devices.length < 2) {
      return;
    }

    // Create connections between devices to simulate a network topology
    const connections: Connection[] = [];
    
    // Router A (index 0) connects to Switch B (index 1) and Server C (index 2)
    if (devices.length > 1) {
      connections.push(this.deviceService.createConnectionBetweenDevices(devices[0].id, devices[1].id));
    }
    if (devices.length > 2) {
      connections.push(this.deviceService.createConnectionBetweenDevices(devices[0].id, devices[2].id));
    }
    
    // Switch B (index 1) connects to Firewall D (index 3)
    if (devices.length > 3) {
      connections.push(this.deviceService.createConnectionBetweenDevices(devices[1].id, devices[3].id));
    }
    
    // Server C (index 2) connects to Load Balancer E (index 4)
    if (devices.length > 4) {
      connections.push(this.deviceService.createConnectionBetweenDevices(devices[2].id, devices[4].id));
    }
    
    // Firewall D (index 3) connects to Load Balancer E (index 4)
    if (devices.length > 4) {
      connections.push(this.deviceService.createConnectionBetweenDevices(devices[3].id, devices[4].id));
    }
    
    // Bidirectional connections for redundancy (Switch B to Server C)
    if (devices.length > 2) {
      connections.push(this.deviceService.createConnectionBetweenDevices(devices[1].id, devices[2].id));
    }
    
    connections.forEach(connection => {
      this.deviceService.addConnectionLocally(connection);
    });
  }
}
