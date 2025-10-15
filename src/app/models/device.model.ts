export interface Device {
  id: string;
  name: string;
  type: string;
  ip: string;
  status: 'online' | 'offline' | 'failed';
  pingRate: number; // ms (simulated)
  latency: number; // ms (simulated)
  trafficLoad: number; // percentage (0-100) (simulated)
  position: {
    x: number;
    y: number;
  };
  lastUpdated: Date;
}

export type DeviceStatus = Device['status'];
