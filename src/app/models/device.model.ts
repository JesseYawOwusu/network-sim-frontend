export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  ip: string;
  status: DeviceStatus;
  position: Position;
}

export type DeviceType = 'Router' | 'Switch' | 'Server' | 'Firewall' | 'Load balancer';

export type DeviceStatus = 'active' | 'inactive' | 'failed';

export interface Position {
  x: number;
  y: number;
}
