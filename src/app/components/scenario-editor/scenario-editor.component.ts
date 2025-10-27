import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Device, DeviceType, DeviceStatus } from '../../models/device.model';
import { Scenario, ScenarioDifficulty } from '../../models/scenario.model';
import { ScenarioService } from '../../services/scenario.service';

@Component({
  selector: 'app-scenario-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './scenario-editor.component.html',
  styleUrl: './scenario-editor.component.css'
})
export class ScenarioEditorComponent implements OnInit {
  scenario: Scenario = {
    id: '',
    name: '',
    difficulty: 'Beginner',
    timeLimit: 30,
    passingScore: 70,
    description: '',
    devices: [],
    connections: []
  };

  difficultyOptions: ScenarioDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
  
  // Device drag and drop properties
  deviceTypes: DeviceType[] = ['router', 'switch', 'server', 'firewall', 'load balancer'];
  
  // Save properties
  isSaving = false;
  saveError: string | null = null;
  saveStep: string = ''; // Track current save step
  
  // Device configuration modal properties
  showDeviceConfigModal = false;
  selectedDevice: Device | null = null;

  constructor(private scenarioService: ScenarioService) {}

  ngOnInit(): void {
    this.loadScenarioFromUrl();
  }

  saveScenario(): void {
    if (!this.scenario.name.trim()) {
      alert('Please enter a scenario name before saving.');
      return;
    }

    this.isSaving = true;
    this.saveError = null;
    this.saveStep = 'Saving scenario...';

    // Generate unique ID if not set
    if (!this.scenario.id) {
      this.scenario.id = this.generateScenarioId();
    }

    // Check if backend is available
    if (!this.scenarioService.isBackendConnected()) {
      console.warn('Backend not available, saving to local storage');
      this.saveStep = 'Saving to local storage...';
      this.saveToLocalStorage();
      return;
    }

    // Use the new method that saves scenario and devices separately
    this.saveScenarioWithDevices();
  }

  private saveToLocalStorage(): void {
    try {
      const savedScenarios = JSON.parse(localStorage.getItem('savedScenarios') || '[]');
      const existingIndex = savedScenarios.findIndex((s: any) => s.id === this.scenario.id);
      
      if (existingIndex >= 0) {
        savedScenarios[existingIndex] = this.scenario;
      } else {
        savedScenarios.push(this.scenario);
      }
      
      localStorage.setItem('savedScenarios', JSON.stringify(savedScenarios));
      this.isSaving = false;
      this.saveStep = '';
      this.saveError = null;
      alert(`Scenario "${this.scenario.name}" saved to local storage!`);
    } catch (error) {
      console.error('Error saving to local storage:', error);
      this.isSaving = false;
      this.saveStep = '';
      this.saveError = 'Failed to save to local storage';
      alert('Error saving scenario to local storage');
    }
  }

  private saveScenarioWithDevices(): void {
    console.log('Starting save process for scenario:', this.scenario);
    console.log('Backend available:', this.scenarioService.isBackendConnected());
    
    this.scenarioService.saveScenarioWithDevices(this.scenario).subscribe({
      next: (savedScenario) => {
        console.log('Save successful:', savedScenario);
        this.scenario = savedScenario;
        this.isSaving = false;
        this.saveStep = '';
        this.saveError = null;
        alert(`Scenario "${this.scenario.name}" saved successfully with all devices and layout!`);
      },
      error: (error) => {
        console.error('Save failed with error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          body: error.error
        });
        
        this.isSaving = false;
        this.saveStep = '';
        
        // Check if it's actually an error or if the save succeeded
        let errorMessage = 'Failed to save scenario';
        
        if (error.status === 0) {
          errorMessage = 'Cannot connect to backend server. Please check if the server is running.';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid scenario data.';
        } else if (error.status === 404) {
          errorMessage = 'Scenario not found.';
        } else if (error.status === 500) {
          errorMessage = error.error?.message || 'Backend server error occurred.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.saveError = errorMessage;
        alert(`Error saving scenario: ${errorMessage}`);
      }
    });
  }


  private loadScenarioFromUrl(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const scenarioData = urlParams.get('scenario');
    
    if (scenarioData) {
      try {
        const scenario = JSON.parse(decodeURIComponent(scenarioData));
        this.scenario = {
          ...scenario,
          devices: scenario.devices || [],
          connections: scenario.connections || []
        };
      } catch (error) {
        console.error('Error loading scenario from URL:', error);
      }
    }
  }


  clearScenario(): void {
    if (confirm('Are you sure you want to clear the current scenario? This action cannot be undone.')) {
      this.scenario = {
        id: '',
        name: '',
        difficulty: 'Beginner',
        timeLimit: 30,
        passingScore: 70,
        description: '',
        devices: [],
        connections: []
      };
    }
  }

  // Drag and drop methods for adding devices to scenario
  onDeviceClick(deviceType: DeviceType): void {
    this.addDeviceToScenario(deviceType);
  }

  onDragStart(event: DragEvent, deviceType: DeviceType): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', deviceType);
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const deviceType = event.dataTransfer?.getData('text/plain') as DeviceType;
    
    if (deviceType && this.deviceTypes.includes(deviceType)) {
      this.addDeviceToScenario(deviceType);
    }
  }

  private addDeviceToScenario(deviceType: DeviceType): void {
    // Assign random status with weighted distribution
    const randomStatus = this.getRandomDeviceStatus();
    
    const newDevice: Device = {
      id: this.generateId(),
      name: `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} ${this.scenario.devices.length + 1}`,
      type: deviceType,
      ipAddress: this.generateIP(),
      status: randomStatus,
      position: { x: 0, y: 0 },
      parameters: randomStatus === 'online' ? {
        pingRate: Math.floor(Math.random() * 50) + 5,
        latency: Math.floor(Math.random() * 20) + 1,
        trafficLoad: Math.floor(Math.random() * 80) + 10
      } : {
        pingRate: 1,
        latency: 1,
        trafficLoad: 0
      },
      connections: [],
      lastUpdated: new Date().toISOString(),
      scenarioId: this.scenario.id ? parseInt(this.scenario.id) : 1
    };
    
    this.scenario.devices.push(newDevice);
  }

  removeDeviceFromScenario(device: Device): void {
    const index = this.scenario.devices.indexOf(device);
    if (index > -1) {
      this.scenario.devices.splice(index, 1);
    }
  }

  // Device configuration methods
  onDeviceItemClick(device: Device): void {
    this.selectedDevice = { ...device }; // Create a copy to avoid direct modification
    this.showDeviceConfigModal = true;
  }

  onCloseDeviceConfigModal(): void {
    this.showDeviceConfigModal = false;
    this.selectedDevice = null;
  }

  onSaveDeviceConfig(): void {
    if (!this.selectedDevice) return;

    // Validate and fix parameter values to meet backend requirements
    this.selectedDevice.parameters = {
      pingRate: Math.max(1, this.selectedDevice.parameters.pingRate),
      latency: Math.max(1, this.selectedDevice.parameters.latency),
      trafficLoad: Math.max(0, this.selectedDevice.parameters.trafficLoad)
    };

    // Find the device in the scenario and update it
    const deviceIndex = this.scenario.devices.findIndex(d => d.id === this.selectedDevice!.id);
    if (deviceIndex !== -1) {
      // Update the device with the modified values, preserving position
      this.scenario.devices[deviceIndex] = { 
        ...this.selectedDevice,
        position: this.scenario.devices[deviceIndex].position || { x: 0, y: 0 }
      };
    }

    this.onCloseDeviceConfigModal();
  }

  /**
   * Update device position in scenario
   */
  updateDevicePosition(deviceId: number, position: { x: number, y: number }): void {
    const deviceIndex = this.scenario.devices.findIndex(d => d.id === deviceId);
    if (deviceIndex !== -1) {
      this.scenario.devices[deviceIndex] = {
        ...this.scenario.devices[deviceIndex],
        position: position
      };
      
    }
  }

  /**
   * Update device connections in scenario
   */
  updateDeviceConnections(deviceId: number, connections: number[]): void {
    const deviceIndex = this.scenario.devices.findIndex(d => d.id === deviceId);
    if (deviceIndex !== -1) {
      this.scenario.devices[deviceIndex] = {
        ...this.scenario.devices[deviceIndex],
        connections: connections.map((id: number) => id.toString())
      };
      
    }
  }


  /**
   * Save layout changes to backend (for real-time updates)
   */
  saveLayoutChanges(): void {
    if (!this.scenario.id || this.scenario.devices.length === 0) {
      console.log('No scenario ID or devices to save layout for');
      return;
    }

    // Create layout data in the format expected by backend
    const layoutData = {
      devices: this.scenario.devices.map(device => ({
        id: device.id,
        name: device.name,
        type: device.type,
        position: device.position || { x: 0, y: 0 },
        pingRate: Math.max(1, device.parameters.pingRate),
        latency: Math.max(1, device.parameters.latency),
        trafficLoad: Math.max(0, device.parameters.trafficLoad),
        connections: (device.connections || []).map((id: string) => parseInt(id.toString()))
      }))
    };

    console.log('Saving layout changes:', JSON.stringify(layoutData, null, 2));

    this.scenarioService.saveNetworkLayout(this.scenario.id, layoutData).subscribe({
      next: (response) => {
        console.log('Layout changes saved successfully:', response);
      },
      error: (error) => {
        console.error('Error saving layout changes:', error);
      }
    });
  }

  exportScenario(): void {
    const exportData = {
      ...this.scenario,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      exportedBy: 'Network Simulator'
    };
    
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.scenario.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_backup.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert(`Scenario "${this.scenario.name}" exported as backup file!`);
  }

  private generateId(): number {
    return Math.floor(Math.random() * 10000) + 1;
  }

  private generateScenarioId(): string {
    return Math.random().toString(36).substring(2, 11);
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
        return '📱';
    }
  }







  trackByDeviceId(index: number, device: Device): number {
    return device.id;
  }

}