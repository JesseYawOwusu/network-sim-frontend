import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Device } from '../models/device.model';
import { Connection } from '../models/connection.model';

export interface DeviceChange {
  id: number;
  type: 'new' | 'updated' | 'deleted';
  device: Device;
  originalDevice?: Device;
}

export interface ConnectionChange {
  id: string;
  type: 'new' | 'updated' | 'deleted';
  connection: Connection;
  originalConnection?: Connection;
}

export interface NetworkLayout {
  devices: Array<{
    id: number;
    name: string;
    type: string;
    position: { x: number; y: number };
    pingRate: number;
    latency: number;
    trafficLoad: number;
    connections: number[];
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class LocalStateService {
  private deviceChangesSubject = new BehaviorSubject<Map<number, DeviceChange>>(new Map());
  private connectionChangesSubject = new BehaviorSubject<Map<string, ConnectionChange>>(new Map());
  private hasUnsavedChangesSubject = new BehaviorSubject<boolean>(false);

  public deviceChanges$ = this.deviceChangesSubject.asObservable();
  public connectionChanges$ = this.connectionChangesSubject.asObservable();
  public hasUnsavedChanges$ = this.hasUnsavedChangesSubject.asObservable();

  private deviceChanges = new Map<number, DeviceChange>();
  private connectionChanges = new Map<string, ConnectionChange>();

  constructor() {}

  /**
   * Add a new device to local state
   */
  addDevice(device: Device): void {
    const change: DeviceChange = {
      id: device.id,
      type: 'new',
      device: { ...device }
    };
    
    this.deviceChanges.set(device.id, change);
    this.updateChangeState();
    console.log('Device added to local state:', device);
  }

  /**
   * Update device position or properties
   */
  updateDevice(deviceId: number, updates: Partial<Device>): void {
    const existingChange = this.deviceChanges.get(deviceId);
    
    if (existingChange) {
      // Update existing change
      existingChange.device = { ...existingChange.device, ...updates };
      existingChange.type = existingChange.type === 'new' ? 'new' : 'updated';
    } else {
      // Create new update change
      const change: DeviceChange = {
        id: deviceId,
        type: 'updated',
        device: updates as Device,
        originalDevice: undefined // We don't have the original in this case
      };
      this.deviceChanges.set(deviceId, change);
    }
    
    this.updateChangeState();
    console.log('Device updated in local state:', deviceId, updates);
  }

  /**
   * Delete a device
   */
  deleteDevice(deviceId: number): void {
    const existingChange = this.deviceChanges.get(deviceId);
    
    if (existingChange && existingChange.type === 'new') {
      // Remove from changes if it was a new device
      this.deviceChanges.delete(deviceId);
    } else {
      // Mark as deleted
      const change: DeviceChange = {
        id: deviceId,
        type: 'deleted',
        device: existingChange?.device || { id: deviceId } as Device
      };
      this.deviceChanges.set(deviceId, change);
    }
    
    this.updateChangeState();
    console.log('Device deleted from local state:', deviceId);
  }

  /**
   * Add a new connection
   */
  addConnection(connection: Connection): void {
    const change: ConnectionChange = {
      id: connection.id,
      type: 'new',
      connection: { ...connection }
    };
    
    this.connectionChanges.set(connection.id, change);
    this.updateChangeState();
    console.log('Connection added to local state:', connection);
  }

  /**
   * Update a connection
   */
  updateConnection(connectionId: string, updates: Partial<Connection>): void {
    const existingChange = this.connectionChanges.get(connectionId);
    
    if (existingChange) {
      existingChange.connection = { ...existingChange.connection, ...updates };
      existingChange.type = existingChange.type === 'new' ? 'new' : 'updated';
    } else {
      const change: ConnectionChange = {
        id: connectionId,
        type: 'updated',
        connection: updates as Connection
      };
      this.connectionChanges.set(connectionId, change);
    }
    
    this.updateChangeState();
    console.log('Connection updated in local state:', connectionId, updates);
  }

  /**
   * Delete a connection
   */
  deleteConnection(connectionId: string): void {
    const existingChange = this.connectionChanges.get(connectionId);
    
    if (existingChange && existingChange.type === 'new') {
      this.connectionChanges.delete(connectionId);
    } else {
      const change: ConnectionChange = {
        id: connectionId,
        type: 'deleted',
        connection: existingChange?.connection || { id: connectionId } as Connection
      };
      this.connectionChanges.set(connectionId, change);
    }
    
    this.updateChangeState();
    console.log('Connection deleted from local state:', connectionId);
  }

  /**
   * Get all current changes
   */
  getDeviceChanges(): Map<number, DeviceChange> {
    return new Map(this.deviceChanges);
  }

  getConnectionChanges(): Map<string, ConnectionChange> {
    return new Map(this.connectionChanges);
  }

  /**
   * Get all devices from current changes (for full sync flow)
   */
  getAllDevices(): Device[] {
    const devices: Device[] = [];
    
    for (const [deviceId, change] of this.deviceChanges) {
      if (change.type !== 'deleted') {
        devices.push(change.device);
      }
    }
    
    return devices;
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges(): boolean {
    return this.hasUnsavedChangesSubject.value;
  }

  /**
   * Generate network layout for backend
   */
  generateNetworkLayout(scenarioId: number): NetworkLayout {
    const devices: NetworkLayout['devices'] = [];
    
    // Process device changes
    for (const [deviceId, change] of this.deviceChanges) {
      if (change.type === 'deleted') continue;
      
      const device = change.device;
      
      // Ensure all parameters meet backend validation requirements
      const validDevice = {
        id: device.id,
        name: device.name,
        type: device.type,
        position: { 
          x: Math.max(0, device.position?.x || 0), 
          y: Math.max(0, device.position?.y || 0) 
        },
        pingRate: Math.max(1, Math.floor(device.parameters?.pingRate || 1)),
        latency: Math.max(1, Math.floor(device.parameters?.latency || 1)),
        trafficLoad: Math.max(0, Math.min(100, Math.floor(device.parameters?.trafficLoad || 0))),
        connections: (device.connections || []).map(id => parseInt(id.toString())).filter(id => !isNaN(id) && id > 0)
      };
      
      console.log('Validating device before sending:', validDevice);
      devices.push(validDevice);
    }
    
    console.log('Generated network layout with', devices.length, 'devices');
    return {
      devices
    };
  }

  /**
   * Clear all changes (after successful save)
   */
  clearAllChanges(): void {
    this.deviceChanges.clear();
    this.connectionChanges.clear();
    this.deviceChangesSubject.next(new Map());
    this.connectionChangesSubject.next(new Map());
    this.hasUnsavedChangesSubject.next(false);
    console.log('All local changes cleared');
  }

  /**
   * Reset to original state (discard changes)
   */
  resetChanges(): void {
    this.clearAllChanges();
    console.log('Local changes reset');
  }

  /**
   * Update change state and notify subscribers
   */
  private updateChangeState(): void {
    this.deviceChangesSubject.next(new Map(this.deviceChanges));
    this.connectionChangesSubject.next(new Map(this.connectionChanges));
    
    const hasChanges = this.deviceChanges.size > 0 || this.connectionChanges.size > 0;
    this.hasUnsavedChangesSubject.next(hasChanges);
  }

  /**
   * Get change summary for UI
   */
  getChangeSummary(): { devices: number; connections: number; total: number } {
    const deviceCount = this.deviceChanges.size;
    const connectionCount = this.connectionChanges.size;
    
    return {
      devices: deviceCount,
      connections: connectionCount,
      total: deviceCount + connectionCount
    };
  }
}
