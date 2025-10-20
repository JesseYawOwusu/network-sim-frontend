export interface Connection {
  id: string;
  fromDeviceId: string;
  toDeviceId: string;
  status: ConnectionStatus;
}

export type ConnectionStatus = 'active' | 'failed' | 'disabled';
