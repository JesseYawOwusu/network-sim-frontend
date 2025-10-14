export interface Device {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'failed';
  pingRate: number; // ms
  latency: number; // ms
  trafficLoad: number; // percentage (0-100)
  position: {
    x: number;
    y: number;
  };
  lastUpdated: Date;
}

export type DeviceStatus = Device['status'];
