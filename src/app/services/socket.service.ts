import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { BACKEND_BASE_URL } from '../constants/api-endpoints';

export interface DeviceUpdate {
  id: number;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'failed';
  parameters: {
    pingRate: number;
    latency: number;
    trafficLoad: number;
  };
  position?: {
    x: number;
    y: number;
  };
  lastUpdated: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private deviceUpdatesSubject = new BehaviorSubject<DeviceUpdate[]>([]);
  public deviceUpdates$ = this.deviceUpdatesSubject.asObservable();

  private isConnected = false;

  constructor() {}

  /**
   * Connect to Socket.IO server
   */
  connect(): void {
    if (!this.socket) {
      this.socket = io(BACKEND_BASE_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connected');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.isConnected = false;
      });

      // Listen for device updates from backend
      this.socket.on('deviceUpdate', (data: DeviceUpdate[]) => {
        console.log('Received device updates:', data);
        this.deviceUpdatesSubject.next(data);
      });

      // Listen for simulation status updates
      this.socket.on('simulationStatus', (status: { running: boolean; scenarioId: string }) => {
        console.log('Simulation status:', status);
      });
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if connected to Socket.IO
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Join a scenario room for real-time updates
   */
  joinScenarioRoom(scenarioId: string): void {
    if (this.socket) {
      this.socket.emit('joinScenario', scenarioId);
      console.log(`Joined scenario room: ${scenarioId}`);
    }
  }

  /**
   * Leave a scenario room
   */
  leaveScenarioRoom(scenarioId: string): void {
    if (this.socket) {
      this.socket.emit('leaveScenario', scenarioId);
      console.log(`Left scenario room: ${scenarioId}`);
    }
  }

  /**
   * Get current device updates
   */
  getCurrentDeviceUpdates(): DeviceUpdate[] {
    return this.deviceUpdatesSubject.value;
  }

  /**
   * Clear device updates
   */
  clearDeviceUpdates(): void {
    this.deviceUpdatesSubject.next([]);
  }
}

