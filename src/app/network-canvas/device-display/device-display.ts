import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../services/device.service';
import { Device } from '../../models/device.model';

@Component({
  selector: 'app-device-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './device-display.html',
  styleUrls: ['./device-display.css']
})
export class DeviceDisplayComponent {
  private deviceService = inject(DeviceService);
  
  // Signals
  readonly devices = this.deviceService.devices;
  readonly loading = this.deviceService.loading;
  readonly error = this.deviceService.error;
  readonly onlineDevices = this.deviceService.onlineDevices;
  readonly offlineDevices = this.deviceService.offlineDevices;
  
  // Local state
  readonly showAddForm = signal(false);
  readonly editingDevice = signal<string | null>(null);
  
  // Individual form field signals for two-way binding
  readonly newDeviceName = signal('');
  readonly newDeviceType = signal('');
  readonly newDeviceIp = signal('');
  readonly newDevicePingRate = signal(10);
  readonly newDeviceLatency = signal(5);
  readonly newDeviceTrafficLoad = signal(25);
  
  // Editing signals
  readonly editingDeviceName = signal('');
  readonly editingDeviceType = signal('');
  readonly editingDeviceIp = signal('');
  readonly editingDevicePingRate = signal(10);
  readonly editingDeviceLatency = signal(5);
  readonly editingDeviceTrafficLoad = signal(25);

  toggleAddForm(): void {
    // Cancel any active editing when toggling add form
    if (this.editingDevice()) {
      this.cancelEditing();
    }
    
    this.showAddForm.update(show => !show);
    if (!this.showAddForm()) {
      this.resetNewDevice();
    }
  }

  startEditing(device: Device): void {
    // Close add form if it's open
    if (this.showAddForm()) {
      this.showAddForm.set(false);
    }
    
    this.editingDevice.set(device.id);
    this.editingDeviceName.set(device.name);
    this.editingDeviceType.set(device.type);
    this.editingDeviceIp.set(device.ip);
    this.editingDevicePingRate.set(device.pingRate);
    this.editingDeviceLatency.set(device.latency);
    this.editingDeviceTrafficLoad.set(device.trafficLoad);
  }

  cancelEditing(): void {
    this.editingDevice.set(null);
    this.editingDeviceName.set('');
    this.editingDeviceType.set('');
    this.editingDeviceIp.set('');
    this.editingDevicePingRate.set(10);
    this.editingDeviceLatency.set(5);
    this.editingDeviceTrafficLoad.set(25);
  }

  saveDeviceEdit(deviceId: string): void {
    const name = this.editingDeviceName();
    const type = this.editingDeviceType();
    const ip = this.editingDeviceIp();
    const pingRate = this.editingDevicePingRate();
    const latency = this.editingDeviceLatency();
    const trafficLoad = this.editingDeviceTrafficLoad();
    
    if (name && type && ip) {
      this.updateDevice(deviceId, { 
        name, 
        type, 
        ip, 
        pingRate, 
        latency, 
        trafficLoad 
      });
    }
  }

  saveDevice(): void {
    const name = this.newDeviceName();
    const type = this.newDeviceType();
    const ip = this.newDeviceIp();
    const pingRate = this.newDevicePingRate();
    const latency = this.newDeviceLatency();
    const trafficLoad = this.newDeviceTrafficLoad();
    
    if (name && type && ip) {
      const deviceToAdd: Omit<Device, 'id' | 'lastUpdated'> = {
        name,
        type,
        ip,
        pingRate,
        latency,
        trafficLoad,
        position: { x: 100, y: 100 },
        status: 'online'
      };
      
      this.deviceService.addDevice(deviceToAdd).subscribe({
        next: (device) => {
          this.deviceService.addDeviceLocally(device);
          this.toggleAddForm();
        },
        error: (error) => console.error('Failed to add device:', error)
      });
    }
  }

  updateDevice(id: string, updates: Partial<Device>): void {
    this.deviceService.updateDevice(id, updates).subscribe({
      next: (device) => {
        this.deviceService.updateDeviceLocally(id, device);
        this.cancelEditing();
      },
      error: (error) => console.error('Failed to update device:', error)
    });
  }

  deleteDevice(id: string): void {
    if (confirm('Are you sure you want to delete this device?')) {
      this.deviceService.deleteDevice(id).subscribe({
        next: () => {
          this.deviceService.removeDeviceLocally(id);
        },
        error: (error) => console.error('Failed to delete device:', error)
      });
    }
  }

  private resetNewDevice(): void {
    this.newDeviceName.set('');
    this.newDeviceType.set('');
    this.newDeviceIp.set('');
    this.newDevicePingRate.set(10);
    this.newDeviceLatency.set(5);
    this.newDeviceTrafficLoad.set(25);
  }


  getStatusClass(status: Device['status']): string {
    switch (status) {
      case 'online': return 'status-online';
      case 'offline': return 'status-offline';
      case 'failed': return 'status-failed';
      default: return 'status-unknown';
    }
  }
}
