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
  readonly newDeviceIp = signal('');
  readonly newDevicePingRate = signal(10);
  readonly newDeviceLatency = signal(5);
  readonly newDeviceTrafficLoad = signal(0);
  
  // Editing signals
  readonly editingDeviceName = signal('');
  readonly editingDeviceIp = signal('');

  toggleAddForm(): void {
    this.showAddForm.update(show => !show);
    if (!this.showAddForm()) {
      this.resetNewDevice();
    }
  }

  startEditing(device: Device): void {
    this.editingDevice.set(device.id);
    this.editingDeviceName.set(device.name);
    this.editingDeviceIp.set(device.ip);
  }

  cancelEditing(): void {
    this.editingDevice.set(null);
    this.editingDeviceName.set('');
    this.editingDeviceIp.set('');
  }

  saveDeviceEdit(deviceId: string): void {
    const name = this.editingDeviceName();
    const ip = this.editingDeviceIp();
    
    if (name && ip) {
      this.updateDevice(deviceId, { name, ip });
    }
  }

  saveDevice(): void {
    const name = this.newDeviceName();
    const ip = this.newDeviceIp();
    
    if (name && ip) {
      const deviceToAdd: Omit<Device, 'id' | 'lastUpdated'> = {
        name,
        ip,
        pingRate: this.newDevicePingRate(),
        latency: this.newDeviceLatency(),
        trafficLoad: this.newDeviceTrafficLoad(),
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
    this.newDeviceIp.set('');
    this.newDevicePingRate.set(10);
    this.newDeviceLatency.set(5);
    this.newDeviceTrafficLoad.set(0);
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
