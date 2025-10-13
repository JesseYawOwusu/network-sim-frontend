import { Component, ChangeDetectionStrategy, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceDisplayComponent } from './network-canvas/device-display/device-display';
import { NetworkCanvasComponent } from './network-canvas/network-canvas';
import { DeviceService } from './services/device.service';
import { Device } from './models/device.model';
import { Connection } from './models/connection.model';

@Component({
  selector: 'app-root',
  imports: [CommonModule, DeviceDisplayComponent, NetworkCanvasComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  private deviceService = inject(DeviceService);
  private connectionsAdded = false;

  constructor() {
    // Watch for devices to be loaded, then add connections
    effect(() => {
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
    const connections: Connection[] = [
      // Router A connects to Switch B and Server C
      this.deviceService.createConnectionBetweenDevices(devices[0].id, devices[1].id),
      this.deviceService.createConnectionBetweenDevices(devices[0].id, devices[2].id),
      
      // Switch B connects to Firewall D
      this.deviceService.createConnectionBetweenDevices(devices[1].id, devices[3].id),
      
      // Server C connects to Load Balancer E
      this.deviceService.createConnectionBetweenDevices(devices[2].id, devices[4].id),
      
      // Firewall D connects to Load Balancer E
      this.deviceService.createConnectionBetweenDevices(devices[3].id, devices[4].id),
      
      // Bidirectional connections for redundancy
      this.deviceService.createConnectionBetweenDevices(devices[1].id, devices[2].id),
    ];
    
    connections.forEach(connection => {
      this.deviceService.addConnectionLocally(connection);
    });
  }
}
