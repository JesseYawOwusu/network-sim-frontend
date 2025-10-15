import { Injectable, signal, computed, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, catchError, of, Subscription } from 'rxjs';
import { Device } from '../models/device.model';
import { Connection } from '../models/connection.model';
import { BrowserCompatibilityService } from './browser-compatibility.service';

@Injectable({
  providedIn: 'root'
})
export class DeviceService implements OnDestroy {
  private readonly devicesSignal = signal<Device[]>([]);
  private readonly connectionsSignal = signal<Connection[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly simulationRunningSignal = signal<boolean>(false);
  private pollingSubscription?: Subscription;

  // Public readonly signals
  readonly devices = this.devicesSignal.asReadonly();
  readonly connections = this.connectionsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly simulationRunning = this.simulationRunningSignal.asReadonly();

  // Computed signals
  readonly onlineDevices = computed(() => 
    this.devicesSignal().filter(device => device.status === 'online')
  );
  
  readonly offlineDevices = computed(() => 
    this.devicesSignal().filter(device => device.status === 'offline' || device.status === 'failed')
  );

  readonly activeConnections = computed(() => 
    this.connectionsSignal().filter(connection => connection.status === 'active')
  );

  readonly failedConnections = computed(() => 
    this.connectionsSignal().filter(connection => connection.status === 'failed')
  );

  private browserCompatibilityService = inject(BrowserCompatibilityService);

  constructor(private http: HttpClient) {
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  private startPolling(): void {
    // Poll every 30 seconds as per requirements
    this.pollingSubscription = interval(30000)
      .pipe(
        startWith(0), // Start immediately
        switchMap(() => this.fetchDevices()),
        catchError(error => {
          this.errorSignal.set('Failed to fetch devices: ' + error.message);
          return of({ devices: [], connections: [] });
        })
      )
      .subscribe(response => {
        this.devicesSignal.set(response.devices);
        this.connectionsSignal.set(response.connections);
        this.loadingSignal.set(false);
        this.errorSignal.set(null);
      });
  }

  private fetchDevices(): Observable<{devices: Device[], connections: Connection[]}> {
    this.loadingSignal.set(true);
    // Mock backend simulation - simulate device status changes
    return this.simulateBackendResponse();
  }

  private simulateBackendResponse(): Observable<{devices: Device[], connections: Connection[]}> {
    // Simulate network delay
    return new Observable(observer => {
      setTimeout(() => {
        const currentDevices = this.devicesSignal();
        const currentConnections = this.connectionsSignal();
        const isSimulationRunning = this.simulationRunningSignal();
        
        const updatedDevices = currentDevices.map(device => {
          // Only simulate changes if simulation is running
          if (!isSimulationRunning) {
            return device; // Return device unchanged
          }
          
          // Randomly change device statuses to simulate real network conditions
          const random = Math.random();
          let newStatus = device.status;
          
          if (random < 0.1) { // 10% chance to change status
            const statuses: Device['status'][] = ['online', 'offline', 'failed'];
            newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          }
          
          return {
            ...device,
            status: newStatus,
            pingRate: Math.max(1, device.pingRate + (Math.random() - 0.5) * 2),
            latency: Math.max(0, device.latency + (Math.random() - 0.5) * 1),
            trafficLoad: Math.max(0, Math.min(100, device.trafficLoad + (Math.random() - 0.5) * 10))
            // Don't update lastUpdated during simulation - only during user actions
          };
        });

        const updatedConnections = currentConnections.map(connection => {
          // Update connection status based on device statuses
          const fromDevice = updatedDevices.find(d => d.id === connection.fromDeviceId);
          const toDevice = updatedDevices.find(d => d.id === connection.toDeviceId);
          
          let newStatus: Connection['status'] = 'active';
          if (!fromDevice || !toDevice || fromDevice.status === 'failed' || toDevice.status === 'failed') {
            newStatus = 'failed';
          } else if (fromDevice.status === 'offline' || toDevice.status === 'offline') {
            newStatus = 'inactive';
          }
          
          // Only simulate parameter changes if simulation is running
          if (!isSimulationRunning) {
            return {
              ...connection,
              status: newStatus
              // Keep original parameters when simulation is not running
            };
          }
          
          return {
            ...connection,
            status: newStatus,
            latency: Math.max(1, connection.latency + (Math.random() - 0.5) * 2),
            bandwidth: Math.max(1, connection.bandwidth + (Math.random() - 0.5) * 10),
            trafficLoad: Math.max(0, Math.min(100, connection.trafficLoad + (Math.random() - 0.5) * 5)),
            lastUpdated: new Date()
          };
        });
        
        observer.next({ devices: updatedDevices, connections: updatedConnections });
        observer.complete();
      }, 500); // Simulate 500ms network delay
    });
  }

  addDevice(device: Omit<Device, 'id' | 'lastUpdated'>): Observable<Device> {
    // Mock backend response
    return new Observable(observer => {
      setTimeout(() => {
        const newDevice: Device = {
          ...device,
          id: this.browserCompatibilityService.generateUUID(),
          lastUpdated: new Date()
        };
        observer.next(newDevice);
        observer.complete();
      }, 200);
    });
  }

  updateDevice(id: string, updates: Partial<Device>): Observable<Device> {
    // Mock backend response
    return new Observable(observer => {
      setTimeout(() => {
        const currentDevices = this.devicesSignal();
        const device = currentDevices.find(d => d.id === id);
        if (device) {
          const updatedDevice = { ...device, ...updates, lastUpdated: new Date() };
          observer.next(updatedDevice);
        }
        observer.complete();
      }, 200);
    });
  }

  deleteDevice(id: string): Observable<void> {
    // Mock backend response
    return new Observable(observer => {
      setTimeout(() => {
        observer.next();
        observer.complete();
      }, 200);
    });
  }

  // Local state management methods
  addDeviceLocally(device: Device): void {
    this.devicesSignal.update(devices => [...devices, device]);
  }

  updateDeviceLocally(id: string, updates: Partial<Device>): void {
    this.devicesSignal.update(devices => 
      devices.map(device => 
        device.id === id 
          ? { ...device, ...updates, lastUpdated: new Date() }
          : device
      )
    );
  }

  removeDeviceLocally(id: string): void {
    this.devicesSignal.update(devices => 
      devices.filter(device => device.id !== id)
    );
  }

  // Connection management methods
  addConnectionLocally(connection: Connection): void {
    this.connectionsSignal.update(connections => [...connections, connection]);
  }

  updateConnectionLocally(id: string, updates: Partial<Connection>): void {
    this.connectionsSignal.update(connections => 
      connections.map(connection => 
        connection.id === id 
          ? { ...connection, ...updates, lastUpdated: new Date() }
          : connection
      )
    );
  }

  removeConnectionLocally(id: string): void {
    this.connectionsSignal.update(connections => 
      connections.filter(connection => connection.id !== id)
    );
  }

  // Simulation control methods
  startSimulation(): void {
    this.simulationRunningSignal.set(true);
  }

  stopSimulation(): void {
    this.simulationRunningSignal.set(false);
  }

  // Helper method to create connections between devices
  createConnectionBetweenDevices(
    fromDeviceId: string, 
    toDeviceId: string, 
    latency: number = 5, 
    bandwidth: number = 100, 
    trafficLoad: number = 25
  ): Connection {
    return {
      id: crypto.randomUUID(),
      fromDeviceId,
      toDeviceId,
      status: 'active',
      latency,
      bandwidth,
      trafficLoad,
      lastUpdated: new Date()
    };
  }
}
