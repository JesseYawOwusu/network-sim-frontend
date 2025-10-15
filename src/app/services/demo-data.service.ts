import { Injectable, inject } from '@angular/core';
import { Device, DeviceType } from '../models/device.model';
import { Connection } from '../models/connection.model';
import { DeviceService } from './device.service';

export interface DemoDataConfig {
  enabled: boolean;
  autoSeed: boolean;
  deviceCount: number;
  connectionDensity: 'low' | 'medium' | 'high';
}

@Injectable({
  providedIn: 'root'
})
export class DemoDataService {
  private deviceService = inject(DeviceService);
  
  private readonly defaultConfig: DemoDataConfig = {
    enabled: true,
    autoSeed: true,
    deviceCount: 5,
    connectionDensity: 'medium'
  };

  /**
   * Initialize demo data based on configuration
   * This should be called from the application bootstrap or a resolver
   */
  initializeDemoData(config: Partial<DemoDataConfig> = {}): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    if (!finalConfig.enabled) {
      return;
    }

    if (finalConfig.autoSeed) {
      this.seedDevices(finalConfig.deviceCount);
      // Connections will be added automatically via the effect in DashboardComponent
      // or we can add them here if we want to decouple completely
    }
  }

  /**
   * Seed sample devices for demo/testing purposes
   */
  seedDevices(count: number = 5): void {
    const sampleDevices = this.generateSampleDevices(count);
    
    sampleDevices.forEach(device => {
      this.deviceService.addDeviceLocally({
        ...device,
        id: this.generateId(),
        lastUpdated: new Date()
      });
    });
  }

  /**
   * Seed sample connections between devices
   */
  seedConnections(density: 'low' | 'medium' | 'high' = 'medium'): void {
    const devices = this.deviceService.devices();
    
    if (devices.length < 2) {
      return;
    }

    const connections = this.generateSampleConnections(devices, density);
    
    connections.forEach(connection => {
      this.deviceService.addConnectionLocally(connection);
    });
  }

  /**
   * Clear all demo data
   */
  clearDemoData(): void {
    const devices = this.deviceService.devices();
    const connections = this.deviceService.connections();
    
    // Remove all connections first
    connections.forEach(connection => {
      this.deviceService.removeConnectionLocally(connection.id);
    });
    
    // Remove all devices
    devices.forEach(device => {
      this.deviceService.removeDeviceLocally(device.id);
    });
  }

  /**
   * Reset demo data (clear and reseed)
   */
  resetDemoData(config: Partial<DemoDataConfig> = {}): void {
    this.clearDemoData();
    const finalConfig = { ...this.defaultConfig, ...config };
    this.initializeDemoData(finalConfig);
  }

  private generateSampleDevices(count: number): Omit<Device, 'id' | 'lastUpdated'>[] {
    const deviceTemplates: Array<{
      name: string;
      type: DeviceType;
      ip: string;
      status: 'online' | 'offline' | 'failed';
      pingRate: number;
      latency: number;
      trafficLoad: number;
      position: { x: number; y: number };
    }> = [
      {
        name: 'Router A',
        type: 'Router',
        ip: '192.168.1.1',
        status: 'online',
        pingRate: 5,
        latency: 2,
        trafficLoad: 25,
        position: { x: 400, y: 80 }
      },
      {
        name: 'Switch B',
        type: 'Switch',
        ip: '192.168.1.2',
        status: 'offline',
        pingRate: 10,
        latency: 5,
        trafficLoad: 0,
        position: { x: 200, y: 200 }
      },
      {
        name: 'Server C',
        type: 'Server',
        ip: '192.168.1.3',
        status: 'online',
        pingRate: 8,
        latency: 3,
        trafficLoad: 60,
        position: { x: 600, y: 200 }
      },
      {
        name: 'Firewall D',
        type: 'Firewall',
        ip: '192.168.1.4',
        status: 'failed',
        pingRate: 15,
        latency: 10,
        trafficLoad: 0,
        position: { x: 150, y: 350 }
      },
      {
        name: 'Load Balancer E',
        type: 'Load Balancer',
        ip: '192.168.1.5',
        status: 'online',
        pingRate: 6,
        latency: 2,
        trafficLoad: 40,
        position: { x: 650, y: 350 }
      },
      {
        name: 'Access Point F',
        type: 'Access Point',
        ip: '192.168.1.6',
        status: 'online',
        pingRate: 12,
        latency: 4,
        trafficLoad: 30,
        position: { x: 300, y: 100 }
      },
      {
        name: 'Workstation G',
        type: 'Workstation',
        ip: '192.168.1.7',
        status: 'offline',
        pingRate: 20,
        latency: 8,
        trafficLoad: 0,
        position: { x: 500, y: 400 }
      }
    ];

    // Return the requested number of devices, cycling through templates if needed
    return deviceTemplates.slice(0, Math.min(count, deviceTemplates.length));
  }

  private generateSampleConnections(devices: Device[], density: 'low' | 'medium' | 'high'): Connection[] {
    const connections: Connection[] = [];
    
    // Define connection patterns based on density
    const connectionPatterns = {
      low: [
        [0, 1], // Router to Switch
        [1, 2]  // Switch to Server
      ],
      medium: [
        [0, 1], [0, 2], // Router to Switch and Server
        [1, 3], [2, 4], // Switch to Firewall, Server to Load Balancer
        [3, 4]          // Firewall to Load Balancer
      ],
      high: [
        [0, 1], [0, 2], [0, 5], // Router to Switch, Server, Access Point
        [1, 2], [1, 3], [1, 5], // Switch to Server, Firewall, Access Point
        [2, 4], [2, 6],          // Server to Load Balancer, Workstation
        [3, 4], [3, 6],          // Firewall to Load Balancer, Workstation
        [4, 6], [5, 6]           // Load Balancer to Workstation, Access Point to Workstation
      ]
    };

    const pattern = connectionPatterns[density];
    
    pattern.forEach(([fromIndex, toIndex]) => {
      if (fromIndex < devices.length && toIndex < devices.length) {
        connections.push(
          this.deviceService.createConnectionBetweenDevices(
            devices[fromIndex].id,
            devices[toIndex].id
          )
        );
      }
    });

    return connections;
  }

  /**
   * Generate a unique ID with fallback for environments without crypto.randomUUID
   */
  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback for older browsers or environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
