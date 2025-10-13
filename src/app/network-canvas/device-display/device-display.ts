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
  readonly newDevice = signal({
    name: '',
    ip: '',
    pingRate: 10,
    latency: 5,
    trafficLoad: 0,
    position: { x: 100, y: 100 }
  });

  toggleAddForm(): void {
    this.showAddForm.update(show => !show);
    if (!this.showAddForm()) {
      this.resetNewDevice();
    }
  }

  startEditing(device: Device): void {
    this.editingDevice.set(device.id);
  }

  cancelEditing(): void {
    this.editingDevice.set(null);
  }

  saveDevice(): void {
    const newDeviceData = this.newDevice();
    if (newDeviceData.name && newDeviceData.ip) {
      const deviceToAdd: Omit<Device, 'id' | 'lastUpdated'> = {
        ...newDeviceData,
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
    this.newDevice.set({
      name: '',
      ip: '',
      pingRate: 10,
      latency: 5,
      trafficLoad: 0,
      position: { x: 100, y: 100 }
    });
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
