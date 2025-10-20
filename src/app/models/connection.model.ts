export interface Connection {
  fromDeviceId: string;
  toDeviceId: string;
  status: ConnectionStatus;
}

export type ConnectionStatus = 'active' | 'failed' | 'disabled';
