import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ValidationService, DeviceFormData } from '../../../services/validation.service';
import { Device, DeviceType, DEVICE_TYPES, DEVICE_VALIDATION_RANGES } from '../../../models/device.model';

@Component({
  selector: 'app-device-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './device-form.component.html',
  styleUrls: ['./device-form.component.css']
})
export class DeviceFormComponent {
  private validationService = inject(ValidationService);

  @Input() formData: DeviceFormData = {
    name: '',
    type: '',
    ip: '',
    pingRate: 10,
    latency: 5,
    trafficLoad: 25
  };

  @Input() isEditMode = false;
  @Input() submitButtonText = 'Save Device';
  @Input() cancelButtonText = 'Cancel';

  @Output() formSubmit = new EventEmitter<DeviceFormData>();
  @Output() formCancel = new EventEmitter<void>();
  @Output() formDataChange = new EventEmitter<DeviceFormData>();

  // Constants for template
  readonly deviceTypes = DEVICE_TYPES;
  readonly validationRanges = DEVICE_VALIDATION_RANGES;

  // Form state
  readonly fieldErrors = signal<Record<string, string[]>>({});

  /**
   * Update form data and emit changes
   */
  updateFormData(field: keyof DeviceFormData, value: any): void {
    const updatedData = { ...this.formData, [field]: value };
    this.formDataChange.emit(updatedData);
    this.validateField(field, value);
  }

  /**
   * Validate individual field
   */
  private validateField(field: keyof DeviceFormData, value: any): void {
    const validation = this.validationService.validateField(field, value);
    this.fieldErrors.update(errors => ({
      ...errors,
      [field]: validation.errors
    }));
  }

  /**
   * Get field errors
   */
  getFieldErrors(field: string): string[] {
    return this.fieldErrors()[field] || [];
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    const validation = this.validationService.validateDeviceForm(this.formData);
    return validation.isValid;
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.isFormValid()) {
      this.formSubmit.emit(this.formData);
    }
  }

  /**
   * Handle form cancellation
   */
  onCancel(): void {
    this.formCancel.emit();
  }

  /**
   * Get CSS classes for form control
   */
  getFormControlClasses(field: string): string {
    const hasErrors = this.getFieldErrors(field).length > 0;
    return `form-control ${hasErrors ? 'is-invalid' : ''}`;
  }
}
