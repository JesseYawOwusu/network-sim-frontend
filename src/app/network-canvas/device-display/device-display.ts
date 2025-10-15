import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../services/device.service';
import { Device, DeviceType } from '../../models/device.model';

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
  
  // Form state management using single object signals
  readonly newDeviceForm = signal<{
    name: string;
    type: DeviceType | '';
    ip: string;
    pingRate: number;
    latency: number;
    trafficLoad: number;
  }>({
    name: '',
    type: '',
    ip: '',
    pingRate: 10,
    latency: 5,
    trafficLoad: 25
  });
  
  readonly editDeviceForm = signal<{
    name: string;
    type: DeviceType | '';
    ip: string;
    pingRate: number;
    latency: number;
    trafficLoad: number;
  }>({
    name: '',
    type: '',
    ip: '',
    pingRate: 10,
    latency: 5,
    trafficLoad: 25
  });

  // Available device types for forms
  readonly deviceTypes: DeviceType[] = [
    'Router', 'Switch', 'Server', 'Workstation', 'Firewall', 'Access Point', 'Load Balancer'
  ];

  // Helper methods for form field updates
  updateNewDeviceForm(field: keyof ReturnType<typeof this.newDeviceForm>, value: any): void {
    this.newDeviceForm.update(form => ({ ...form, [field]: value }));
  }

  updateEditDeviceForm(field: keyof ReturnType<typeof this.editDeviceForm>, value: any): void {
    this.editDeviceForm.update(form => ({ ...form, [field]: value }));
  }

  toggleAddForm(): void {
    // Cancel any active editing when toggling add form
    if (this.editingDevice()) {
      this.cancelEditing();
    }
    
    this.showAddForm.update(show => !show);
    if (!this.showAddForm()) {
      this.resetNewDeviceForm();
    }
  }

  startEditing(device: Device): void {
    // Close add form if it's open
    if (this.showAddForm()) {
      this.showAddForm.set(false);
    }
    
    this.editingDevice.set(device.id);
    this.editDeviceForm.set({
      name: device.name,
      type: device.type,
      ip: device.ip,
      pingRate: device.pingRate,
      latency: device.latency,
      trafficLoad: device.trafficLoad
    });
  }

  cancelEditing(): void {
    this.editingDevice.set(null);
    this.resetEditDeviceForm();
  }

  saveDeviceEdit(deviceId: string): void {
    const form = this.editDeviceForm();
    const { name, type, ip, pingRate, latency, trafficLoad } = form;
    
    if (name && type && ip) {
      this.updateDevice(deviceId, { 
        name, 
        type: type as DeviceType, 
        ip, 
        pingRate, 
        latency, 
        trafficLoad 
      });
    }
  }

  saveDevice(): void {
    const form = this.newDeviceForm();
    const { name, type, ip, pingRate, latency, trafficLoad } = form;
    
    if (name && type && ip) {
      const deviceToAdd: Omit<Device, 'id' | 'lastUpdated'> = {
        name,
        type: type as DeviceType,
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
        error: (error) => {
          // Handle error silently or show user-friendly message
        }
      });
    }
  }

  updateDevice(id: string, updates: Partial<Device>): void {
    this.deviceService.updateDevice(id, updates).subscribe({
      next: (device) => {
        this.deviceService.updateDeviceLocally(id, device);
        this.cancelEditing();
      },
      error: (error) => {
        // Handle error silently or show user-friendly message
      }
    });
  }

  deleteDevice(id: string): void {
    if (confirm('Are you sure you want to delete this device?')) {
      this.deviceService.deleteDevice(id).subscribe({
        next: () => {
          this.deviceService.removeDeviceLocally(id);
        },
        error: (error) => {
          // Handle error silently or show user-friendly message
        }
      });
    }
  }

  private resetNewDeviceForm(): void {
    this.newDeviceForm.set({
      name: '',
      type: '',
      ip: '',
      pingRate: 10,
      latency: 5,
      trafficLoad: 25
    });
  }

  private resetEditDeviceForm(): void {
    this.editDeviceForm.set({
      name: '',
      type: '',
      ip: '',
      pingRate: 10,
      latency: 5,
      trafficLoad: 25
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
