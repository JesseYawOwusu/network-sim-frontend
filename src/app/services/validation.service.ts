import { Injectable } from '@angular/core';
import { DeviceType } from '../models/device.model';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface DeviceFormData {
  name: string;
  type: DeviceType | '';
  ip: string;
  pingRate: number;
  latency: number;
  trafficLoad: number;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  /**
   * Validates a complete device form
   */
  validateDeviceForm(formData: DeviceFormData): ValidationResult {
    const errors: string[] = [];

    // Name validation
    const nameValidation = this.validateName(formData.name);
    if (!nameValidation.isValid) {
      errors.push(...nameValidation.errors);
    }

    // Type validation
    const typeValidation = this.validateDeviceType(formData.type);
    if (!typeValidation.isValid) {
      errors.push(...typeValidation.errors);
    }

    // IP validation
    const ipValidation = this.validateIpAddress(formData.ip);
    if (!ipValidation.isValid) {
      errors.push(...ipValidation.errors);
    }

    // Ping rate validation
    const pingRateValidation = this.validatePingRate(formData.pingRate);
    if (!pingRateValidation.isValid) {
      errors.push(...pingRateValidation.errors);
    }

    // Latency validation
    const latencyValidation = this.validateLatency(formData.latency);
    if (!latencyValidation.isValid) {
      errors.push(...latencyValidation.errors);
    }

    // Traffic load validation
    const trafficLoadValidation = this.validateTrafficLoad(formData.trafficLoad);
    if (!trafficLoadValidation.isValid) {
      errors.push(...trafficLoadValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates device name
   */
  validateName(name: string): ValidationResult {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Device name is required');
    } else if (name.trim().length < 2) {
      errors.push('Device name must be at least 2 characters long');
    } else if (name.trim().length > 50) {
      errors.push('Device name must be less than 50 characters');
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
      errors.push('Device name can only contain letters, numbers, spaces, hyphens, and underscores');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates device type
   */
  validateDeviceType(type: DeviceType | ''): ValidationResult {
    const errors: string[] = [];

    if (!type) {
      errors.push('Device type is required');
    } else {
      const validTypes: DeviceType[] = [
        'Router', 'Switch', 'Server', 'Workstation', 'Firewall', 'Access Point', 'Load Balancer'
      ];
      
      // Type assertion is safe here since we've already checked it's not empty
      const deviceType = type as DeviceType;
      if (!validTypes.includes(deviceType)) {
        errors.push(`Device type must be one of: ${validTypes.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates IP address format
   */
  validateIpAddress(ip: string): ValidationResult {
    const errors: string[] = [];

    if (!ip || ip.trim().length === 0) {
      errors.push('IP address is required');
    } else {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      
      if (!ipRegex.test(ip.trim())) {
        errors.push('IP address must be in valid IPv4 format (e.g., 192.168.1.1)');
      } else {
        // Additional validation for common private IP ranges
        const parts = ip.trim().split('.').map(Number);
        const [first, second] = parts;
        
        // Check for invalid IP ranges
        if (first === 0 || first === 127) {
          errors.push('IP address cannot be in reserved ranges (0.x.x.x or 127.x.x.x)');
        } else if (first === 169 && second === 254) {
          errors.push('IP address cannot be in link-local range (169.254.x.x)');
        } else if (first >= 224) {
          errors.push('IP address cannot be in multicast range (224.x.x.x and above)');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates ping rate
   */
  validatePingRate(pingRate: number): ValidationResult {
    const errors: string[] = [];

    if (pingRate === null || pingRate === undefined || isNaN(pingRate)) {
      errors.push('Ping rate is required');
    } else if (pingRate < 1) {
      errors.push('Ping rate must be at least 1 ms');
    } else if (pingRate > 1000) {
      errors.push('Ping rate must be less than 1000 ms');
    } else if (!Number.isInteger(pingRate)) {
      errors.push('Ping rate must be a whole number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates latency
   */
  validateLatency(latency: number): ValidationResult {
    const errors: string[] = [];

    if (latency === null || latency === undefined || isNaN(latency)) {
      errors.push('Latency is required');
    } else if (latency < 0) {
      errors.push('Latency cannot be negative');
    } else if (latency > 500) {
      errors.push('Latency must be less than 500 ms');
    } else if (!Number.isInteger(latency)) {
      errors.push('Latency must be a whole number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates traffic load percentage
   */
  validateTrafficLoad(trafficLoad: number): ValidationResult {
    const errors: string[] = [];

    if (trafficLoad === null || trafficLoad === undefined || isNaN(trafficLoad)) {
      errors.push('Traffic load is required');
    } else if (trafficLoad < 0) {
      errors.push('Traffic load cannot be negative');
    } else if (trafficLoad > 100) {
      errors.push('Traffic load cannot exceed 100%');
    } else if (!Number.isInteger(trafficLoad)) {
      errors.push('Traffic load must be a whole number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates individual field for real-time validation
   */
  validateField(field: keyof DeviceFormData, value: any): ValidationResult {
    switch (field) {
      case 'name':
        return this.validateName(value);
      case 'type':
        return this.validateDeviceType(value);
      case 'ip':
        return this.validateIpAddress(value);
      case 'pingRate':
        return this.validatePingRate(value);
      case 'latency':
        return this.validateLatency(value);
      case 'trafficLoad':
        return this.validateTrafficLoad(value);
      default:
        return { isValid: true, errors: [] };
    }
  }
}
