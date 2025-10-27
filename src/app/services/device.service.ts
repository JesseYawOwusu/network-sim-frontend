import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Device, DeviceType, DeviceStatus, Position, DeviceParameters } from '../models/device.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface ApiResponse<T> {
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private devicesSubject = new BehaviorSubject<Device[]>([]);
  public devices$ = this.devicesSubject.asObservable();

  private simulationRunning = false;
  private simulationInterval: any;
  private isBackendAvailable = false;

  constructor(private http: HttpClient) {
    console.log('🔧 DeviceService constructor called');
    this.checkBackendHealth();
    this.startAutoRefresh();
  }

  /**
   * Check if backend is available
   */
  private checkBackendHealth(): void {
    console.log('🔍 Checking backend health at:', API_ENDPOINTS.HEALTH);
    this.http.get<{message: string}>(API_ENDPOINTS.HEALTH)
      .pipe(
        catchError((error) => {
          console.log('❌ Backend health check failed:', error.message);
          return of(null);
        })
      )
      .subscribe(response => {
        this.isBackendAvailable = response !== null;
        console.log('🔍 Backend health response:', response);
        console.log('🔍 Backend available:', this.isBackendAvailable);
        if (this.isBackendAvailable) {
          console.log('✅ Backend is available');
          this.loadDevices();
        } else {
          console.log('⚠️ Backend unavailable, using mock data');
          this.loadMockDevices();
        }
      });
  }

  /**
   * Get all devices
   */
  getDevices(): Observable<Device[]> {
    if (this.isBackendAvailable) {
      return this.http.get<ApiResponse<Device[]>>(API_ENDPOINTS.DEVICES.BASE)
        .pipe(
          map(response => {
            // Transform backend devices to include frontend-specific properties
            const devices = response.data.map(device => ({
              ...device,
              position: device.position || { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
              connections: device.connections || [],
              parameters: {
                pingRate: device.parameters.pingRate,
                latency: device.parameters.latency,
                trafficLoad: device.parameters.trafficLoad
              }
            }));
            return devices;
          }),
          tap(devices => this.devicesSubject.next(devices)),
          catchError(this.handleError)
        );
    } else {
      return this.devices$;
    }
  }

  /**
   * Get device by ID
   */
  getDeviceById(id: number): Observable<Device> {
    if (this.isBackendAvailable) {
      return this.http.get<ApiResponse<Device>>(API_ENDPOINTS.DEVICES.BY_ID(id.toString()))
        .pipe(
          map(response => ({
            ...response.data,
            position: response.data.position || { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
            connections: response.data.connections || []
          })),
          catchError(this.handleError)
        );
    } else {
      return new Observable(observer => {
        const devices = this.devicesSubject.value;
        const device = devices.find(d => d.id === id);
        if (device) {
          observer.next(device);
        } else {
          observer.error('Device not found');
        }
        observer.complete();
      });
    }
  }

  /**
   * Add a new device
   */
  addDevice(device: Omit<Device, 'id' | 'lastUpdated' | 'scenarioId'>): Observable<Device> {
    console.log('DeviceService.addDevice called with:', device);
    console.log('Backend available:', this.isBackendAvailable);
    if (this.isBackendAvailable) {
      // Transform frontend device to backend format
      const backendDevice = {
        name: device.name,
        type: device.type,
        ipAddress: device.ipAddress,
        status: device.status,
        pingRate: device.parameters.pingRate,
        latency: device.parameters.latency,
        trafficLoad: device.parameters.trafficLoad,
        scenarioId: 1 // Default scenario ID, should be configurable
      };

      return this.http.post<ApiResponse<Device>>(API_ENDPOINTS.DEVICES.CREATE, backendDevice)
        .pipe(
          map(response => ({
            ...response.data,
            position: device.position || { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
            connections: device.connections || []
          })),
          tap(newDevice => {
            const currentDevices = this.devicesSubject.value;
            this.devicesSubject.next([...currentDevices, newDevice]);
          }),
          catchError(this.handleError)
        );
    } else {
      console.log('Using mock device creation');
      try {
        const newDevice: Device = {
          ...device,
          id: this.generateId(),
          lastUpdated: new Date().toISOString(),
          scenarioId: 1
        };
        console.log('Created mock device:', newDevice);
        const currentDevices = this.devicesSubject.value;
        console.log('Current devices before adding:', currentDevices.length);
        
        // Update the devices list immediately
        this.devicesSubject.next([...currentDevices, newDevice]);
        console.log('Device added to subject, new count:', this.devicesSubject.value.length);
        
        return of(newDevice);
      } catch (error) {
        console.error('Error in mock device creation:', error);
        return throwError(() => new Error('Failed to create mock device: ' + error));
      }
    }
  }

  /**
   * Update an existing device
   */
  updateDevice(id: number, updates: Partial<Device>): Observable<Device> {
    if (this.isBackendAvailable) {
      // Transform frontend updates to backend format
      const backendUpdates: any = {};
      if (updates.name) backendUpdates.name = updates.name;
      if (updates.type) backendUpdates.type = updates.type;
      if (updates.ipAddress !== undefined) backendUpdates.ipAddress = updates.ipAddress;
      if (updates.status) backendUpdates.status = updates.status;
      if (updates.parameters) {
        backendUpdates.pingRate = updates.parameters.pingRate;
        backendUpdates.latency = updates.parameters.latency;
        backendUpdates.trafficLoad = updates.parameters.trafficLoad;
      }

      return this.http.put<ApiResponse<Device>>(API_ENDPOINTS.DEVICES.UPDATE(id.toString()), backendUpdates)
        .pipe(
          map(response => ({
            ...response.data,
            position: updates.position || response.data.position || { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
            connections: updates.connections || response.data.connections || []
          })),
          tap(updatedDevice => {
            const currentDevices = this.devicesSubject.value;
            const updatedDevices = currentDevices.map(device => 
              device.id === id ? updatedDevice : device
            );
            this.devicesSubject.next(updatedDevices);
          }),
          catchError(this.handleError)
        );
    } else {
      const currentDevices = this.devicesSubject.value;
      const updatedDevices = currentDevices.map(device => 
        device.id === id ? { ...device, ...updates } : device
      );
      this.devicesSubject.next(updatedDevices);
      const updatedDevice = updatedDevices.find(d => d.id === id);
      return of(updatedDevice!);
    }
  }

  /**
   * Remove a device
   */
  removeDevice(id: number): Observable<void> {
    if (this.isBackendAvailable) {
      return this.http.delete<void>(API_ENDPOINTS.DEVICES.DELETE(id.toString()))
        .pipe(
          tap(() => {
            const currentDevices = this.devicesSubject.value;
            const filteredDevices = currentDevices.filter(device => device.id !== id);
            this.devicesSubject.next(filteredDevices);
          }),
          catchError(this.handleError)
        );
    } else {
      const currentDevices = this.devicesSubject.value;
      const filteredDevices = currentDevices.filter(device => device.id !== id);
      this.devicesSubject.next(filteredDevices);
      return of(void 0);
    }
  }

  /**
   * Toggle device status
   */
  toggleDeviceStatus(id: number): Observable<Device> {
    const currentDevices = this.devicesSubject.value;
    const device = currentDevices.find(d => d.id === id);
    
    if (!device) {
      return throwError(() => new Error('Device not found'));
    }

    const newStatus: DeviceStatus = device.status === 'online' ? 'offline' : 'online';
    const updates: Partial<Device> = {
      status: newStatus,
      parameters: newStatus === 'offline' 
        ? { pingRate: 0, latency: 0, trafficLoad: 0 }
        : device.parameters
    };

    return this.updateDevice(id, updates);
  }

  /**
   * Start simulation
   */
  startSimulation(): void {
    this.simulationRunning = true;
    console.log('Simulation started');
  }

  /**
   * Stop simulation
   */
  stopSimulation(): void {
    this.simulationRunning = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    console.log('Simulation stopped');
  }

  /**
   * Check if simulation is running
   */
  isSimulationRunning(): boolean {
    return this.simulationRunning;
  }

  /**
   * Check if backend is available
   */
  isBackendConnected(): boolean {
    return this.isBackendAvailable;
  }

  /**
   * Refresh device data from backend
   */
  refreshDevices(): Observable<Device[]> {
    if (this.isBackendAvailable) {
      return this.getDevices();
    } else {
      // For mock data, just return current devices
      return of(this.devicesSubject.value);
    }
  }

  /**
   * Load devices from backend or use mock data
   */
  private loadDevices(): void {
    this.getDevices().subscribe({
      next: (devices) => {
        console.log('Devices loaded:', devices);
      },
      error: (error) => {
        console.error('Error loading devices:', error);
        this.loadMockDevices();
      }
    });
  }

  /**
   * Load mock devices as fallback - Start with empty canvas
   */
  private loadMockDevices(): void {
    const mockDevices: Device[] = []; // Start with completely blank canvas
    this.devicesSubject.next(mockDevices);
  }

  /**
   * Start auto-refresh for simulation
   */
  private startAutoRefresh(): void {
    // Simulate device parameter updates every 30 seconds
    this.simulationInterval = setInterval(() => {
      if (this.simulationRunning) {
        this.updateDeviceParameters();
      }
    }, 30000);
  }

  /**
   * Update device parameters during simulation
   */
  private updateDeviceParameters(): void {
    const currentDevices = this.devicesSubject.value;
    const updatedDevices = currentDevices.map(device => {
      // Randomly change device status (5% chance to change status)
      let newStatus = device.status;
      if (Math.random() < 0.05) { // 5% chance
        const statuses: DeviceStatus[] = ['online', 'offline', 'failed'];
        newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      }

      const updatedDevice = {
        ...device,
        status: newStatus,
        parameters: newStatus === 'online' ? {
          // More realistic parameter fluctuations
          pingRate: Math.max(5, Math.min(100, device.parameters.pingRate + (Math.random() - 0.5) * 15)),
          latency: Math.max(1, Math.min(50, device.parameters.latency + (Math.random() - 0.5) * 8)),
          trafficLoad: Math.max(0, Math.min(100, device.parameters.trafficLoad + (Math.random() - 0.5) * 25))
        } : {
          pingRate: 0,
          latency: 0,
          trafficLoad: 0
        }
      };
      
      // Update on backend if available
      if (this.isBackendAvailable) {
        this.updateDevice(device.id, { 
          status: updatedDevice.status,
          parameters: updatedDevice.parameters 
        }).subscribe();
      }
      
      return updatedDevice;
    });
    this.devicesSubject.next(updatedDevices);
  }

  /**
   * Generate unique ID
   */
  private generateId(): number {
    return Math.floor(Math.random() * 10000) + 1;
  }

  /**
   * Update devices list manually (useful for simulation updates)
   */
  updateDevicesList(devices: Device[]): void {
    this.devicesSubject.next(devices);
  }

  /**
   * Test method to create a simple device
   */
  testDeviceCreation(): void {
    console.log('🧪 Testing device creation...');
    const testDevice: Omit<Device, 'id' | 'lastUpdated' | 'scenarioId'> = {
      name: 'Test Device',
      type: 'router',
      ipAddress: '192.168.1.1',
      status: 'online',
      position: { x: 100, y: 100 },
      parameters: {
        pingRate: 10,
        latency: 5,
        trafficLoad: 20
      },
      connections: []
    };
    
    console.log('🧪 Test device created:', testDevice);
    this.addDevice(testDevice).subscribe({
      next: (result) => console.log('🧪 Test device added successfully:', result),
      error: (error) => console.error('🧪 Test device addition failed:', error)
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('HTTP Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
