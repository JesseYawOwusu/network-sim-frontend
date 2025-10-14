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
  
  // Editing signals
  readonly editingDeviceName = signal('');
  readonly editingDeviceType = signal('');
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
    this.editingDeviceType.set(device.type);
    this.editingDeviceIp.set(device.ip);
  }

  cancelEditing(): void {
    this.editingDevice.set(null);
    this.editingDeviceName.set('');
    this.editingDeviceType.set('');
    this.editingDeviceIp.set('');
  }

  saveDeviceEdit(deviceId: string): void {
    const name = this.editingDeviceName();
    const type = this.editingDeviceType();
    const ip = this.editingDeviceIp();
    
    if (name && type && ip) {
      this.updateDevice(deviceId, { name, type, ip });
    }
  }

  saveDevice(): void {
    const name = this.newDeviceName();
    const type = this.newDeviceType();
    const ip = this.newDeviceIp();
    
    if (name && type && ip) {
      const deviceToAdd: Omit<Device, 'id' | 'lastUpdated'> = {
        name,
        type,
        ip,
        pingRate: Math.floor(Math.random() * 20) + 5, // Simulated: 5-25ms
        latency: Math.floor(Math.random() * 15) + 1, // Simulated: 1-16ms
        trafficLoad: Math.floor(Math.random() * 80) + 10, // Simulated: 10-90%
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

  private   resetNewDevice(): void {
    this.newDeviceName.set('');
    this.newDeviceType.set('');
    this.newDeviceIp.set('');
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
