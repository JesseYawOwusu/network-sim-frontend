export type DeviceType = 'Router' | 'Switch' | 'Server' | 'Workstation' | 'Firewall' | 'Access Point' | 'Load Balancer';
export type DeviceStatus = 'online' | 'offline' | 'failed';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  ip: string;
  status: DeviceStatus;
  pingRate: number; // ms (simulated)
  latency: number; // ms (simulated)
  trafficLoad: number; // percentage (0-100) (simulated)
  position: {
    x: number;
    y: number;
  };
  lastUpdated: Date;
}

// Constants for validation
export const DEVICE_TYPES: readonly DeviceType[] = [
  'Router', 'Switch', 'Server', 'Workstation', 'Firewall', 'Access Point', 'Load Balancer'
] as const;

export const DEVICE_STATUSES: readonly DeviceStatus[] = [
  'online', 'offline', 'failed'
] as const;

// Validation ranges
export const DEVICE_VALIDATION_RANGES = {
  pingRate: { min: 1, max: 1000 },
  latency: { min: 0, max: 500 },
  trafficLoad: { min: 0, max: 100 }
} as const;
