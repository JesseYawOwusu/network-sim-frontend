import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device, DeviceType, DeviceStatus, DeviceInput } from '../../models/device.model';
import { DeviceService } from '../../services/device.service';
import { SocketService, DeviceUpdate } from '../../services/socket.service';
import { ScenarioService } from '../../services/scenario.service';
import { LocalStateService } from '../../services/local-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-device-display',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './device-display.component.html',
  styleUrls: ['./device-display.component.css']
})
export class DeviceDisplayComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef?: ElementRef;
  devices: Device[] = [];
  simulationRunning = false;
  selectedDevice: Device | null = null;
  showDeviceModal = false;
  private devicesSubscription?: Subscription;
  private socketSubscription?: Subscription;
  private autoRefreshInterval?: any;
  draggedDevice: Device | null = null;
  private dragOffset = { x: 0, y: 0 };
  private dragEndTime = 0;
  private boundMouseMove: (event: MouseEvent) => void;
  private boundMouseUp: () => void;

  // Simulation properties
  currentScenarioId: string | null = null;
  simulationParams = {
    Max_latency: 100,
    Min_latency: 0,
    error_probability: 50
  };
  private localSimulationInterval?: any;

  // Device library types
  deviceTypes: { type: DeviceType; icon: string; description: string }[] = [
    { type: 'router', icon: '🌐', description: 'Network routing device' },
    { type: 'switch', icon: '🔀', description: 'Network switching device' },
    { type: 'server', icon: '🖥️', description: 'Server device' },
    { type: 'firewall', icon: '🛡️', description: 'Network security device' },
    { type: 'load balancer', icon: '⚖️', description: 'Traffic distribution device' }
  ];

  constructor(
    private deviceService: DeviceService,
    private socketService: SocketService,
    public scenarioService: ScenarioService,
    public localStateService: LocalStateService
  ) {
    // Bind the mouse event handlers
    this.boundMouseMove = this.onGlobalMouseMove.bind(this);
    this.boundMouseUp = this.onGlobalMouseUp.bind(this);
  }

  ngOnInit(): void {
    console.log('🎯 Device Display Component Initializing...');
    console.log('Device types loaded:', this.deviceTypes);
    console.log('Device types count:', this.deviceTypes.length);
    
    
    this.devicesSubscription = this.deviceService.getDevices().subscribe(devices => {
      this.devices = devices;
      console.log('Devices updated:', devices.length, 'devices');
      // Redraw connections when devices change
      setTimeout(() => this.drawConnections(), 100);
    });
    this.simulationRunning = this.deviceService.isSimulationRunning();
    
    // Connect to Socket.IO only if backend is available
    if (this.scenarioService.isBackendConnected()) {
      console.log('🔌 Connecting to Socket.IO...');
      this.socketService.connect();
    } else {
      console.log('⚠️ Backend not available, skipping Socket.IO connection');
    }

    // Subscribe to real-time device updates
    this.socketSubscription = this.socketService.deviceUpdates$.subscribe(updates => {
      console.log('📡 Received Socket.IO updates:', updates);
      this.updateDevicesFromSocket(updates);
    });
    
    // Start auto-refresh every 30 seconds
    this.startAutoRefresh();
    
    console.log('✅ Device Display Component initialized successfully');
  }

  ngAfterViewInit(): void {
    // Initial connection drawing
    setTimeout(() => this.drawConnections(), 100);
  }

  ngOnDestroy(): void {
    if (this.devicesSubscription) {
      this.devicesSubscription.unsubscribe();
    }
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    // Clean up auto-refresh interval
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    // Clean up local simulation interval
    if (this.localSimulationInterval) {
      clearInterval(this.localSimulationInterval);
    }
    // Clean up any remaining event listeners
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    // Disconnect Socket.IO
    this.socketService.disconnect();
  }

  onStartSimulation(): void {
    console.log('🎯 Starting simulation...');
    console.log('Current scenario ID:', this.currentScenarioId);
    console.log('Simulation params:', this.simulationParams);
    console.log('Backend available:', this.scenarioService.isBackendConnected());
    console.log('Devices to save:', this.devices.length);
    
    if (!this.currentScenarioId) {
      alert('Please select a scenario first');
      return;
    }

    if (this.devices.length === 0) {
      alert('Please add some devices to the canvas before starting simulation');
      return;
    }

    // Create connections between all devices for simulation
    this.createSimulationConnections();
    
    // First, save the device layout to backend using full sync flow
    console.log('💾 Saving device layout to backend before simulation...');
    this.saveDeviceLayoutToBackend().then(() => {
      // After saving layout, start the simulation
      console.log('🚀 Starting simulation after layout save...');
      this.scenarioService.startSimulation(this.currentScenarioId!, this.simulationParams).subscribe({
        next: (response) => {
          console.log('✅ Simulation started successfully:', response);
          this.simulationRunning = true;
          
          // Join scenario room for real-time updates (if socket is connected)
          if (this.socketService.isSocketConnected()) {
            console.log('🔌 Joining Socket.IO room...');
            this.socketService.joinScenarioRoom(this.currentScenarioId!);
          } else {
            console.log('⚠️ Socket.IO not connected, using local simulation');
          }
          
          // Always start local simulation as fallback
          this.startLocalSimulation();
          
          // Force redraw connections with enhanced animation
          setTimeout(() => {
            console.log('🎨 Redrawing connections for simulation...');
            this.drawConnections();
            console.log('✨ Animated connections drawn');
          }, 200);
          
          // Show visual feedback
          this.showSimulationFeedback();
          alert('✅ Simulation started successfully!');
        },
        error: (error) => {
          console.error('❌ Error starting simulation:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url,
            body: error.error
          });
          
          // Start local simulation even when backend fails
          console.log('🔄 Starting local simulation due to backend error...');
          this.simulationRunning = true;
          this.startLocalSimulation();
          
          // Force redraw connections
          setTimeout(() => {
            console.log('🎨 Redrawing connections for local simulation...');
            this.drawConnections();
          }, 200);
          
          // Show visual feedback
          this.showSimulationFeedback();
          
          // Check if backend actually returned an error or if it's a network issue
          let errorMessage = 'Backend simulation failed, using local simulation';
          
          if (error.status === 0) {
            errorMessage = 'Cannot connect to backend server. Using local simulation.';
          } else if (error.status === 404) {
            errorMessage = 'Simulation endpoint not found. Using local simulation.';
          } else if (error.status === 400) {
            errorMessage = 'Invalid simulation parameters. Using local simulation.';
          } else if (error.status === 500) {
            errorMessage = 'Backend server error. Using local simulation.';
          }
          
          alert(`⚠️ ${errorMessage}`);
        }
      });
    }).catch((error) => {
      console.error('❌ Error saving device layout:', error);
      alert('Failed to save device layout. Starting local simulation only.');
      
      // Start local simulation even if layout save fails
      this.simulationRunning = true;
      this.startLocalSimulation();
      
      setTimeout(() => {
        this.drawConnections();
      }, 200);
      
      this.showSimulationFeedback();
    });
  }

  onStopSimulation(): void {
    if (!this.currentScenarioId) {
      return;
    }

    this.scenarioService.stopSimulation(this.currentScenarioId, this.simulationParams).subscribe({
      next: (response) => {
        console.log('⏹️ Simulation stopped:', response);
        this.simulationRunning = false;
        
        // Clean up local simulation
        if (this.localSimulationInterval) {
          clearInterval(this.localSimulationInterval);
          this.localSimulationInterval = undefined;
        }
        
        // Leave scenario room
        this.socketService.leaveScenarioRoom(this.currentScenarioId!);
        // Redraw connections without animation
        setTimeout(() => this.drawConnections(), 100);
      },
      error: (error) => {
        console.error('Error stopping simulation:', error);
        // Even if backend fails, stop local simulation
        this.simulationRunning = false;
        if (this.localSimulationInterval) {
          clearInterval(this.localSimulationInterval);
          this.localSimulationInterval = undefined;
        }
        setTimeout(() => this.drawConnections(), 100);
        alert('Simulation stopped locally (backend unavailable)');
      }
    });
  }

  /**
   * Update devices from Socket.IO real-time updates
   */
  updateDevicesFromSocket(updates: DeviceUpdate[]): void {
    console.log('Updating devices from Socket.IO:', updates);
    
    // Update devices with real-time data
    updates.forEach(update => {
      const deviceIndex = this.devices.findIndex(d => d.id === update.id);
      if (deviceIndex !== -1) {
        this.devices[deviceIndex] = {
          ...this.devices[deviceIndex],
          status: update.status,
          parameters: update.parameters,
          lastUpdated: update.lastUpdated,
          position: update.position || this.devices[deviceIndex].position
        };
      }
    });
    
    // Trigger change detection
    this.devices = [...this.devices];
    
    // Redraw connections with updated data
    setTimeout(() => this.drawConnections(), 100);
  }

  /**
   * Set current scenario for simulation
   */
  setCurrentScenario(scenarioId: string): void {
    this.currentScenarioId = scenarioId;
    console.log('Current scenario set to:', scenarioId);
  }

  /**
   * Save all local changes to backend using the new full sync flow
   */
  saveAllChanges(): void {
    if (!this.currentScenarioId) {
      alert('Please select a scenario first');
      return;
    }

    // Validate scenario ID is a number
    const scenarioIdNum = parseInt(this.currentScenarioId);
    if (isNaN(scenarioIdNum) || scenarioIdNum <= 0) {
      alert('Invalid scenario ID. Please enter a valid scenario ID.');
      return;
    }

    if (!this.localStateService.hasUnsavedChanges()) {
      alert('No changes to save');
      return;
    }

    // Check if backend is available
    if (!this.scenarioService.isBackendConnected()) {
      alert('Backend is not available. Cannot save changes.');
      return;
    }

    // Check what changes are being tracked
    const deviceChanges = this.localStateService.getDeviceChanges();
    const connectionChanges = this.localStateService.getConnectionChanges();
    console.log('Device changes:', deviceChanges.size);
    console.log('Connection changes:', connectionChanges.size);
    console.log('Has unsaved changes:', this.localStateService.hasUnsavedChanges());

    // Convert devices to the new DeviceInput format
    const deviceInputs = this.convertDevicesToDeviceInputs();
    
    // Validate device inputs
    if (deviceInputs.length === 0) {
      alert('No device changes to save');
      return;
    }
    
    // Validate each device has required parameters
    for (const device of deviceInputs) {
      if (device.pingRate && (device.pingRate < 1 || device.pingRate > 60)) {
        console.error('Invalid pingRate:', device);
        alert(`Device "${device.name}" has invalid pingRate (must be 1-60). Please check device configuration.`);
        return;
      }
      if (device.latency && (device.latency < 1 || device.latency > 1000)) {
        console.error('Invalid latency:', device);
        alert(`Device "${device.name}" has invalid latency (must be 1-1000). Please check device configuration.`);
        return;
      }
      if (device.trafficLoad && (device.trafficLoad < 0 || device.trafficLoad > 100)) {
        console.error('Invalid trafficLoad:', device);
        alert(`Device "${device.name}" has invalid trafficLoad (must be 0-100). Please check device configuration.`);
        return;
      }
    }
    
    console.log('Saving devices using full sync flow:', deviceInputs);
    console.log('Scenario ID:', scenarioIdNum);
    console.log('Backend available:', this.scenarioService.isBackendConnected());

    // Send to backend using the new full sync flow
    this.scenarioService.saveLayout(scenarioIdNum, deviceInputs).subscribe({
      next: (response) => {
        console.log('✅ Network layout saved successfully with full sync:', response);
        this.localStateService.clearAllChanges();
        alert('All changes saved successfully!');
      },
      error: (error) => {
        console.error('❌ Error saving network layout with full sync:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          body: error.error,
          url: error.url
        });
        
        let errorMessage = 'Failed to save changes. Please try again.';
        
        if (error.status === 0) {
          errorMessage = 'Cannot connect to backend server. Please check if the server is running.';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid layout data.';
        } else if (error.status === 404) {
          errorMessage = 'Scenario not found. Please check the scenario ID.';
        } else if (error.status === 500) {
          errorMessage = error.error?.message || 'Backend server error occurred.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        alert(`Error: ${errorMessage}`);
      }
    });
  }

  /**
   * Discard all local changes
   */
  discardChanges(): void {
    if (confirm('Are you sure you want to discard all unsaved changes?')) {
      this.localStateService.resetChanges();
      // Reload devices from backend
      this.loadDevicesFromBackend();
      alert('All changes discarded');
    }
  }

  /**
   * Load devices from backend
   */
  private loadDevicesFromBackend(): void {
    // This would load the current state from backend
    // Implementation depends on your backend API
    console.log('Loading devices from backend...');
  }

  /**
   * Generate a unique ID for devices
   */
  private generateId(): number {
    return Math.floor(Math.random() * 1000000) + Date.now();
  }

  /**
   * Convert devices to DeviceInput format for the new full sync flow
   * Uses string temp IDs for new devices and numeric IDs for existing devices
   */
  private convertDevicesToDeviceInputs(): DeviceInput[] {
    const deviceInputs: DeviceInput[] = [];
    let tempIdCounter = 1;

    // Create a mapping of device IDs to their new IDs for connections
    const deviceIdMap = new Map<number, string | number>();
    
    // First pass: assign IDs to all devices
    for (const device of this.devices) {
      const isNewDevice = this.isNewDevice(device);
      const deviceId = isNewDevice ? `temp-${tempIdCounter++}` : device.id;
      deviceIdMap.set(device.id, deviceId);
    }
    
    // Second pass: create DeviceInput objects with proper connections
    for (const device of this.devices) {
      const deviceId = deviceIdMap.get(device.id);
      if (!deviceId) continue;
      
      // Convert connections to use the mapped IDs
      const connections: Array<string | number> = [];
      if (device.connections) {
        for (const connectionId of device.connections) {
          // Find the connected device and get its mapped ID
          const connectedDevice = this.devices.find(d => d.id.toString() === connectionId.toString());
          if (connectedDevice) {
            const connectedDeviceId = deviceIdMap.get(connectedDevice.id);
            if (connectedDeviceId) {
              connections.push(connectedDeviceId);
            }
          }
        }
      }

      const deviceInput: DeviceInput = {
        id: deviceId,
        name: device.name,
        type: device.type,
        position: device.position || { x: 0, y: 0 },
        pingRate: device.parameters.pingRate,
        latency: device.parameters.latency,
        trafficLoad: device.parameters.trafficLoad,
        connections: connections.length > 0 ? connections : undefined
      };

      deviceInputs.push(deviceInput);
    }

    console.log('Converted devices to DeviceInput format:', deviceInputs);
    console.log('Device ID mapping:', Object.fromEntries(deviceIdMap));
    return deviceInputs;
  }

  /**
   * Create connections between all devices for simulation
   * This ensures the backend knows about the network topology
   */
  private createSimulationConnections(): void {
    console.log('🔗 Creating connections between all devices for simulation...');
    
    // Clear existing connections
    this.devices.forEach(device => {
      device.connections = [];
    });
    
    // Create connections between all devices (full mesh for simulation)
    for (let i = 0; i < this.devices.length; i++) {
      for (let j = i + 1; j < this.devices.length; j++) {
        const device1 = this.devices[i];
        const device2 = this.devices[j];
        
        // Add bidirectional connections
        if (!device1.connections) device1.connections = [];
        if (!device2.connections) device2.connections = [];
        
        device1.connections.push(device2.id.toString());
        device2.connections.push(device1.id.toString());
      }
    }
    
    console.log('✅ Created connections for simulation:', this.devices.map(d => ({
      name: d.name,
      connections: d.connections?.length || 0
    })));
  }

  /**
   * Determine if a device is new (not yet saved to backend)
   * This is a simple heuristic - in a real app, you'd track this more precisely
   */
  private isNewDevice(device: Device): boolean {
    // Simple heuristic: if device ID is very large, it's likely a temp ID
    // In a real implementation, you'd track this in your local state service
    return device.id > 1000000; // Assuming real DB IDs are smaller
  }

  onAddDevice(deviceType: DeviceType): void {
    console.log('Adding device:', deviceType);
    console.log('Device type validation:', typeof deviceType, deviceType);
    
    // Validate device type
    const validTypes: DeviceType[] = ['router', 'switch', 'server', 'firewall', 'load balancer'];
    if (!validTypes.includes(deviceType)) {
      console.error('Invalid device type:', deviceType);
      return;
    }
    
    // Assign random status with weighted distribution
    const randomStatus = this.getRandomDeviceStatus();
    
    const newDevice: Device = {
      id: this.generateId(), // Generate temporary ID
      name: `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} ${this.devices.length + 1}`,
      type: deviceType,
      ipAddress: this.generateIP(),
      status: randomStatus,
      position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
      parameters: randomStatus === 'online' ? {
        pingRate: Math.floor(Math.random() * 50) + 5,
        latency: Math.floor(Math.random() * 20) + 1,
        trafficLoad: Math.floor(Math.random() * 80) + 10
      } : {
        pingRate: 0,
        latency: 0,
        trafficLoad: 0
      },
      connections: [],
      lastUpdated: new Date().toISOString(),
      scenarioId: 1
    };
    
    console.log('New device created:', newDevice);
    
    // Add to local state (no immediate backend call)
    this.localStateService.addDevice(newDevice);
    
    // Add to local devices array for immediate UI feedback
    this.devices.push(newDevice);
    console.log('Device added to local state and UI');
  }

  onDeviceClick(device: Device, event?: MouseEvent): void {
    // Only prevent click if we're currently dragging
    if (this.draggedDevice) {
      return;
    }
    
    // Allow click even after recent dragging - user might want to configure
    console.log('Device clicked for configuration:', device);
    
    // Create a deep copy of the device for editing
    this.selectedDevice = {
      ...device,
      parameters: { ...device.parameters }
    };
    this.showDeviceModal = true;
    console.log('Modal should be opening now. showDeviceModal:', this.showDeviceModal, 'selectedDevice:', this.selectedDevice);
  }

  onCloseDeviceModal(): void {
    this.showDeviceModal = false;
    this.selectedDevice = null;
  }


  onSaveDeviceConfig(): void {
    if (!this.selectedDevice) return;

    console.log('Saving device configuration:', this.selectedDevice);
    
    // Update the device through the service (excluding status - that's managed by backend)
    this.deviceService.updateDevice(this.selectedDevice.id, {
      name: this.selectedDevice.name,
      ipAddress: this.selectedDevice.ipAddress,
      parameters: {
        pingRate: this.selectedDevice.parameters.pingRate,
        latency: this.selectedDevice.parameters.latency,
        trafficLoad: this.selectedDevice.parameters.trafficLoad
      }
    }).subscribe({
      next: (result) => {
        console.log('Device configuration saved successfully:', result);
        this.onCloseDeviceModal();
      },
      error: (error) => {
        console.error('Error saving device configuration:', error);
        alert('Error saving device configuration. Please try again.');
      }
    });
  }

  onUpdateDeviceName(newName: string): void {
    if (this.selectedDevice) {
      this.deviceService.updateDevice(this.selectedDevice.id, { name: newName }).subscribe();
    }
  }

  private startAutoRefresh(): void {
    // Refresh device data every 30 seconds
    this.autoRefreshInterval = setInterval(() => {
      console.log('Auto-refreshing device data from backend...');
      this.refreshDeviceData();
    }, 30000); // 30 seconds
  }

  private refreshDeviceData(): void {
    // Fetch fresh device data from backend
    this.deviceService.refreshDevices().subscribe({
      next: (devices) => {
        console.log('Device data refreshed from backend:', devices.length, 'devices');
        // The devices will be updated through the subscription in ngOnInit
      },
      error: (error) => {
        console.error('Error refreshing device data:', error);
      }
    });
  }

  private showSimulationFeedback(): void {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4caf50, #66bb6a);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      z-index: 1000;
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = '🚀 Simulation Started - Connections Active';
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }

  /**
   * Save device layout to backend using full sync flow
   */
  private async saveDeviceLayoutToBackend(): Promise<void> {
    if (!this.currentScenarioId) {
      throw new Error('No scenario ID provided');
    }

    // Validate scenario ID is a number
    const scenarioIdNum = parseInt(this.currentScenarioId);
    if (isNaN(scenarioIdNum) || scenarioIdNum <= 0) {
      throw new Error('Invalid scenario ID. Please enter a valid scenario ID.');
    }

    // Convert devices to DeviceInput format for full sync
    const deviceInputs = this.convertDevicesToDeviceInputs();
    
    if (deviceInputs.length === 0) {
      throw new Error('No devices to save');
    }
    
    console.log('💾 Saving device layout using full sync flow:', deviceInputs);
    console.log('Scenario ID:', scenarioIdNum);
    console.log('Backend available:', this.scenarioService.isBackendConnected());

    // Use the scenario service to save layout
    return new Promise((resolve, reject) => {
      this.scenarioService.saveLayout(scenarioIdNum, deviceInputs).subscribe({
        next: (response) => {
          console.log('✅ Device layout saved successfully:', response);
          resolve();
        },
        error: (error) => {
          console.error('❌ Error saving device layout:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            body: error.error,
            url: error.url
          });
          reject(error);
        }
      });
    });
  }

  /**
   * Start local simulation when backend is not available
   */
  private startLocalSimulation(): void {
    console.log('🔄 Starting local simulation...');
    
    // Clear any existing local simulation
    if (this.localSimulationInterval) {
      clearInterval(this.localSimulationInterval);
    }
    
    // Simulate device parameter updates every 2 seconds
    this.localSimulationInterval = setInterval(() => {
      if (!this.simulationRunning) {
        clearInterval(this.localSimulationInterval);
        this.localSimulationInterval = undefined;
        return;
      }
      
      // Update device parameters randomly
      this.devices.forEach(device => {
        if (device.status === 'online') {
          // Simulate parameter changes
          const newParams = {
            pingRate: Math.max(5, Math.min(100, device.parameters.pingRate + (Math.random() - 0.5) * 10)),
            latency: Math.max(1, Math.min(50, device.parameters.latency + (Math.random() - 0.5) * 5)),
            trafficLoad: Math.max(0, Math.min(100, device.parameters.trafficLoad + (Math.random() - 0.5) * 20))
          };
          
          // Update device parameters
          device.parameters = newParams;
          device.lastUpdated = new Date().toISOString();
        }
      });
      
      // Trigger change detection
      this.devices = [...this.devices];
      
      // Redraw connections with updated data
      this.drawConnections();
    }, 2000);
    
    console.log('✅ Local simulation started');
  }

  onDeviceMouseDown(event: MouseEvent, device: Device): void {
    event.preventDefault();
    event.stopPropagation();
    console.log('Mouse down on device:', device.name);
    this.draggedDevice = device;
    
    // Get the device card element
    const deviceElement = event.currentTarget as HTMLElement;
    const rect = deviceElement.getBoundingClientRect();
    
    this.dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // Add global mouse event listeners
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  onGlobalMouseMove(event: MouseEvent): void {
    if (this.draggedDevice && this.canvasRef) {
      event.preventDefault();
      const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
      const newX = event.clientX - canvasRect.left - this.dragOffset.x;
      const newY = event.clientY - canvasRect.top - this.dragOffset.y;
      
      console.log('Dragging device to:', newX, newY);
      
      // Update device position in local state only (no backend call)
      this.localStateService.updateDevice(this.draggedDevice.id, {
        position: { x: Math.max(0, newX), y: Math.max(0, newY) }
      });
      
      // Update local device array for immediate UI feedback
      const deviceIndex = this.devices.findIndex(d => d.id === this.draggedDevice!.id);
      if (deviceIndex !== -1) {
        this.devices[deviceIndex] = {
          ...this.devices[deviceIndex],
          position: { x: Math.max(0, newX), y: Math.max(0, newY) }
        };
      }
    }
  }

  onGlobalMouseUp(): void {
    if (this.draggedDevice) {
      this.dragEndTime = Date.now();
      this.draggedDevice = null;
      this.drawConnections(); // Redraw connections after drag
    }
    
    // Remove global event listeners
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
  }

  onCanvasMouseMove(event: MouseEvent): void {
    // This method is kept for compatibility but not used for dragging
  }

  onCanvasMouseUp(): void {
    // This method is kept for compatibility but not used for dragging
  }

  onDeviceDoubleClick(device: Device): void {
    // Toggle device status on double click
    this.deviceService.toggleDeviceStatus(device.id).subscribe();
  }

  onRemoveDevice(deviceId: number): void {
    this.deviceService.removeDevice(deviceId);
  }


  private centerViewOnDevices(): void {
    if (!this.canvasRef || this.devices.length === 0) return;

    const canvas = this.canvasRef.nativeElement;
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate bounding box of all devices
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    this.devices.forEach(device => {
      if (device.position) {
        minX = Math.min(minX, device.position.x);
        minY = Math.min(minY, device.position.y);
        maxX = Math.max(maxX, device.position.x + 160); // Approximate device width
        maxY = Math.max(maxY, device.position.y + 100); // Approximate device height
      }
    });
    
    // Calculate center point
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Calculate scroll position to center the view
    const scrollX = Math.max(0, centerX - canvasRect.width / 2);
    const scrollY = Math.max(0, centerY - canvasRect.height / 2);
    
    canvas.scrollTo(scrollX, scrollY);
  }

  onClearAll(): void {
    if (this.devices.length === 0) {
      alert('No devices to clear.');
      return;
    }
    
    if (confirm(`Are you sure you want to clear all ${this.devices.length} devices?`)) {
      // Create a copy of device IDs to avoid modification during iteration
      const deviceIds = this.devices.map(device => device.id);
      deviceIds.forEach(deviceId => {
        this.deviceService.removeDevice(deviceId);
      });
      
      // Clear connections after removing devices
      setTimeout(() => this.drawConnections(), 100);
      console.log('All devices cleared');
    }
  }

  getDeviceIcon(deviceType: DeviceType): string {
    switch (deviceType) {
      case 'router':
        return '🌐';
      case 'switch':
        return '🔀';
      case 'server':
        return '🖥️';
      case 'firewall':
        return '🛡️';
      case 'load balancer':
        return '⚖️';
      default:
        return '❓';
    }
  }

  getStatusColor(status: DeviceStatus): string {
    switch (status) {
      case 'online': return 'green';
      case 'offline': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  }

  getStatusText(status: DeviceStatus): string {
    switch (status) {
      case 'online': return '• online';
      case 'offline': return '• offline';
      case 'failed': return '• failed';
      default: return '• unknown';
    }
  }

  private generateIP(): string {
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  private getRandomDeviceStatus(): DeviceStatus {
    // Favor online devices: 70% online, 20% offline, 10% failed
    const random = Math.random();
    if (random < 0.7) {
      return 'online';
    } else if (random < 0.9) {
      return 'offline';
    } else {
      return 'failed';
    }
  }

  private drawConnections(): void {
    if (!this.canvasRef) return;

    const connectionsGroup = this.canvasRef.nativeElement.querySelector('.connections');
    if (!connectionsGroup) return;

    // Clear existing connections
    connectionsGroup.innerHTML = '';

    console.log('Drawing connections for', this.devices.length, 'devices');

    // If simulation is running, draw connections between all devices
    if (this.simulationRunning && this.devices.length > 1) {
      console.log('🎨 Drawing simulation connections between all devices');
      for (let i = 0; i < this.devices.length; i++) {
        for (let j = i + 1; j < this.devices.length; j++) {
          this.drawConnection(this.devices[i], this.devices[j], connectionsGroup);
        }
      }
    } else {
      // Draw connections based on device.connections array
      console.log('🎨 Drawing explicit connections');
      this.devices.forEach(device => {
        if (device.connections && device.connections.length > 0) {
          device.connections.forEach(connectedDeviceId => {
            const connectedDevice = this.devices.find(d => d.id.toString() === connectedDeviceId);
            if (connectedDevice) {
              this.drawConnection(device, connectedDevice, connectionsGroup);
            }
          });
        }
      });
      
      // If no explicit connections and we have devices, show a message
      if (this.devices.length > 1) {
        console.log('💡 No explicit connections found. Start simulation to see connections between all devices.');
      }
    }
  }

  private drawConnection(device1: Device, device2: Device, connectionsGroup: Element): void {
    if (!device1.position || !device2.position) {
      console.log('Skipping connection - missing positions:', device1.name, device2.name);
      return;
    }

    console.log('Drawing connection between:', device1.name, 'and', device2.name);
    
    // Create animated line group
    const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Calculate connection points (center of device cards)
    const x1 = device1.position.x + 80;
    const y1 = device1.position.y + 40;
    const x2 = device2.position.x + 80;
    const y2 = device2.position.y + 40;

    // Determine connection status and color
    const connectionStatus = this.getConnectionStatus(device1, device2);
    const connectionColor = this.getConnectionColor(connectionStatus);

    // Create the main connection line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1.toString());
    line.setAttribute('y1', y1.toString());
    line.setAttribute('x2', x2.toString());
    line.setAttribute('y2', y2.toString());
    line.setAttribute('stroke', connectionColor);
    line.setAttribute('stroke-width', '4');
    line.setAttribute('opacity', '1');

    // Add enhanced animation if simulation is running and connection is active
    if (this.simulationRunning && connectionStatus === 'active') {
      line.setAttribute('stroke-dasharray', '15,10');
      line.setAttribute('stroke-width', '4');
      line.setAttribute('opacity', '1');
      
      // Create flowing animation for data packets
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animate.setAttribute('attributeName', 'stroke-dashoffset');
      animate.setAttribute('values', '0;25');
      animate.setAttribute('dur', '2s');
      animate.setAttribute('repeatCount', 'indefinite');
      line.appendChild(animate);
      
      // Add glow effect
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', `glow-${device1.id}-${device2.id}`);
      const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      feGaussianBlur.setAttribute('stdDeviation', '3');
      feGaussianBlur.setAttribute('result', 'coloredBlur');
      const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
      const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      feMergeNode2.setAttribute('in', 'coloredBlur');
      feMerge.appendChild(feMergeNode1);
      feMerge.appendChild(feMergeNode2);
      filter.appendChild(feGaussianBlur);
      filter.appendChild(feMerge);
      
      // Add filter to line
      line.setAttribute('filter', `url(#glow-${device1.id}-${device2.id})`);
    } else {
      line.setAttribute('stroke-dasharray', '5,5');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('opacity', '0.6');
    }

    // Add connection status indicator (small circle)
    const statusCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    statusCircle.setAttribute('cx', midX.toString());
    statusCircle.setAttribute('cy', midY.toString());
    statusCircle.setAttribute('r', '4');
    statusCircle.setAttribute('fill', connectionColor);
    statusCircle.setAttribute('opacity', '0.9');

    // Add pulsing animation for active connections during simulation
    if (this.simulationRunning && connectionStatus === 'active') {
      const pulseAnimate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      pulseAnimate.setAttribute('attributeName', 'r');
      pulseAnimate.setAttribute('values', '4;6;4');
      pulseAnimate.setAttribute('dur', '2s');
      pulseAnimate.setAttribute('repeatCount', 'indefinite');
      statusCircle.appendChild(pulseAnimate);
    }

    lineGroup.appendChild(line);
    lineGroup.appendChild(statusCircle);
    connectionsGroup.appendChild(lineGroup);
    
    console.log('Connection line added to SVG:', {
      from: device1.name,
      to: device2.name,
      status: connectionStatus,
      animated: this.simulationRunning && connectionStatus === 'active'
    });
  }

  private getConnectionStatus(device1: Device, device2: Device): 'active' | 'inactive' | 'failed' {
    // Both devices must be online for active connection
    if (device1.status === 'online' && device2.status === 'online') {
      return 'active';
    }
    // If either device is failed, connection is failed
    if (device1.status === 'failed' || device2.status === 'failed') {
      return 'failed';
    }
    // Otherwise, connection is inactive
    return 'inactive';
  }

  private getConnectionColor(status: 'active' | 'inactive' | 'failed'): string {
    switch (status) {
      case 'active':
        return '#4caf50'; // Green for active connections
      case 'inactive':
        return '#ff9800'; // Orange for inactive connections
      case 'failed':
        return '#f44336'; // Red for failed connections
      default:
        return '#ccc'; // Gray for unknown status
    }
  }
}
