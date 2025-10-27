export interface Device {
  id: number; // Backend uses numeric IDs
  name: string;
  type: DeviceType;
  ipAddress: string | null; // Backend uses ipAddress and it can be null
  status: DeviceStatus;
  position?: Position; // Optional for frontend use
  parameters: DeviceParameters;
  connections?: string[]; // Array of device IDs this device is connected to (frontend only)
  lastUpdated: string; // ISO date string from backend
  scenarioId: number; // Backend includes scenarioId
}

export type DeviceType = 'router' | 'switch' | 'server' | 'firewall' | 'load balancer';

export type DeviceStatus = 'online' | 'offline' | 'failed';

export interface Position {
  x: number;
  y: number;
}

export interface DeviceParameters {
  pingRate: number; // Backend uses pingRate
  latency: number; // in milliseconds
  trafficLoad: number; // Backend uses trafficLoad instead of load
}

export interface DeviceConnection {
  from: string; // device ID
  to: string; // device ID
}

export interface DeviceInput {
  id: string | number;
  name: string;
  type: DeviceType;
  position: Position;
  pingRate: number;
  latency: number;
  trafficLoad: number;
  connections?: Array<string | number>;
}
