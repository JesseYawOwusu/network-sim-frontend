import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../services/device.service';
import { ValidationService, DeviceFormData } from '../../services/validation.service';
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
  private validationService = inject(ValidationService);
  
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
  readonly newDeviceForm = signal<DeviceFormData>({
    name: '',
    type: '',
    ip: '',
    pingRate: 10,
    latency: 5,
    trafficLoad: 25
  });
  
  readonly editDeviceForm = signal<DeviceFormData>({
    name: '',
    type: '',
    ip: '',
    pingRate: 10,
    latency: 5,
    trafficLoad: 25
  });

  // Validation error signals
  readonly newDeviceFormErrors = signal<string[]>([]);
  readonly editDeviceFormErrors = signal<string[]>([]);
  readonly fieldErrors = signal<Record<string, string[]>>({});

  // Available device types for forms
  readonly deviceTypes: DeviceType[] = [
    'Router', 'Switch', 'Server', 'Workstation', 'Firewall', 'Access Point', 'Load Balancer'
  ];

  // Helper methods for form field updates with validation
  updateNewDeviceForm(field: keyof DeviceFormData, value: any): void {
    this.newDeviceForm.update(form => ({ ...form, [field]: value }));
    this.validateNewDeviceForm();
  }

  updateEditDeviceForm(field: keyof DeviceFormData, value: any): void {
    this.editDeviceForm.update(form => ({ ...form, [field]: value }));
    this.validateEditDeviceForm();
  }

  // Validation methods
  private validateNewDeviceForm(): void {
    const form = this.newDeviceForm();
    const validation = this.validationService.validateDeviceForm(form);
    this.newDeviceFormErrors.set(validation.errors);
    this.updateFieldErrors('new', validation.errors);
  }

  private validateEditDeviceForm(): void {
    const form = this.editDeviceForm();
    const validation = this.validationService.validateDeviceForm(form);
    this.editDeviceFormErrors.set(validation.errors);
    this.updateFieldErrors('edit', validation.errors);
  }

  private updateFieldErrors(formType: 'new' | 'edit', errors: string[]): void {
    const fieldErrorMap: Record<string, string[]> = {};
    
    errors.forEach(error => {
      // Map errors to specific fields based on error message content
      if (error.includes('name')) {
        fieldErrorMap[`${formType}_name`] = fieldErrorMap[`${formType}_name`] || [];
        fieldErrorMap[`${formType}_name`].push(error);
      } else if (error.includes('type')) {
        fieldErrorMap[`${formType}_type`] = fieldErrorMap[`${formType}_type`] || [];
        fieldErrorMap[`${formType}_type`].push(error);
      } else if (error.includes('IP')) {
        fieldErrorMap[`${formType}_ip`] = fieldErrorMap[`${formType}_ip`] || [];
        fieldErrorMap[`${formType}_ip`].push(error);
      } else if (error.includes('Ping rate')) {
        fieldErrorMap[`${formType}_pingRate`] = fieldErrorMap[`${formType}_pingRate`] || [];
        fieldErrorMap[`${formType}_pingRate`].push(error);
      } else if (error.includes('Latency')) {
        fieldErrorMap[`${formType}_latency`] = fieldErrorMap[`${formType}_latency`] || [];
        fieldErrorMap[`${formType}_latency`].push(error);
      } else if (error.includes('Traffic load')) {
        fieldErrorMap[`${formType}_trafficLoad`] = fieldErrorMap[`${formType}_trafficLoad`] || [];
        fieldErrorMap[`${formType}_trafficLoad`].push(error);
      }
    });

    this.fieldErrors.update(current => ({ ...current, ...fieldErrorMap }));
  }

  // Helper method to get field errors
  getFieldErrors(formType: 'new' | 'edit', field: string): string[] {
    return this.fieldErrors()[`${formType}_${field}`] || [];
  }

  // Helper method to check if form is valid
  isNewDeviceFormValid(): boolean {
    const form = this.newDeviceForm();
    const validation = this.validationService.validateDeviceForm(form);
    return validation.isValid;
  }

  isEditDeviceFormValid(): boolean {
    const form = this.editDeviceForm();
    const validation = this.validationService.validateDeviceForm(form);
    return validation.isValid;
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
    if (!this.isEditDeviceFormValid()) {
      return; // Don't save if form is invalid
    }

    const form = this.editDeviceForm();
    const { name, type, ip, pingRate, latency, trafficLoad } = form;
    
    this.updateDevice(deviceId, { 
      name, 
      type: type as DeviceType, 
      ip, 
      pingRate, 
      latency, 
      trafficLoad 
    });
  }

  saveDevice(): void {
    if (!this.isNewDeviceFormValid()) {
      return; // Don't save if form is invalid
    }

    const form = this.newDeviceForm();
    const { name, type, ip, pingRate, latency, trafficLoad } = form;
    
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
    this.newDeviceFormErrors.set([]);
    this.clearFieldErrors('new');
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
    this.editDeviceFormErrors.set([]);
    this.clearFieldErrors('edit');
  }

  private clearFieldErrors(formType: 'new' | 'edit'): void {
    this.fieldErrors.update(current => {
      const updated = { ...current };
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${formType}_`)) {
          delete updated[key];
        }
      });
      return updated;
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
