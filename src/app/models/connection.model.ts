export interface Connection {
  id: string;
  fromDeviceId: string;
  toDeviceId: string;
  status: 'active' | 'inactive' | 'failed';
  latency: number; // ms
  bandwidth: number; // Mbps
  trafficLoad: number; // percentage (0-100)
  lastUpdated: Date;
}

export type ConnectionStatus = Connection['status'];
