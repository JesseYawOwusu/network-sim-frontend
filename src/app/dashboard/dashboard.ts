import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, effect, DestroyRef, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceDisplayComponent } from '../network-canvas/device-display/device-display';
import { NetworkCanvasComponent } from '../network-canvas/network-canvas';
import { DeviceService } from '../services/device.service';
import { Device } from '../models/device.model';
import { Connection } from '../models/connection.model';
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
        this.addSampleConnections();
        this.connectionsAdded = true;
      }
      
      // Reset flag if devices are cleared (for testing/reloading scenarios)
      if (devices.length === 0) {
        this.connectionsAdded = false;
      }
    });
  }

  ngOnInit() {
    // Add some sample devices for testing
    this.addSampleDevices();
  }

  // Method to reset connections (useful for testing or when devices are reloaded)
  resetConnections(): void {
    this.connectionsAdded = false;
    // Clear existing connections
    const connections = this.deviceService.connections();
    connections.forEach(connection => {
      this.deviceService.removeConnectionLocally(connection.id);
    });
  }

  ngOnDestroy(): void {
    if (this.effectRef) {
      this.effectRef.destroy();
    }
  }

  private addSampleDevices() {
    const sampleDevices: Omit<Device, 'id' | 'lastUpdated'>[] = [
      {
        name: 'Router A',
        type: 'Router',
        ip: '192.168.1.1',
        status: 'online',
        pingRate: 5,
        latency: 2,
        trafficLoad: 25,
        position: { x: 400, y: 80 } // Top center
      },
      {
        name: 'Switch B',
        type: 'Switch',
        ip: '192.168.1.2',
        status: 'offline',
        pingRate: 10,
        latency: 5,
        trafficLoad: 0,
        position: { x: 200, y: 200 } // Left side
      },
      {
        name: 'Server C',
        type: 'Server',
        ip: '192.168.1.3',
        status: 'online',
        pingRate: 8,
        latency: 3,
        trafficLoad: 60,
        position: { x: 600, y: 200 } // Right side
      },
      {
        name: 'Firewall D',
        type: 'Firewall',
        ip: '192.168.1.4',
        status: 'failed',
        pingRate: 15,
        latency: 10,
        trafficLoad: 0,
        position: { x: 150, y: 350 } // Bottom left
      },
      {
        name: 'Load Balancer E',
        type: 'Load Balancer',
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
