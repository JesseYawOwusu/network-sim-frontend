import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Scenario, ScenarioDifficulty } from '../../models/scenario.model';
import { Device, DeviceType, DeviceStatus } from '../../models/device.model';
import { Connection, ConnectionStatus } from '../../models/connection.model';
import { DeviceListComponent } from '../device-list/device-list.component';
import { ScenarioService } from '../../services/scenario.service';

@Component({
  selector: 'app-scenario-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DeviceListComponent, HttpClientModule],
  templateUrl: './scenario-editor.component.html',
  styleUrl: './scenario-editor.component.css'
})
export class ScenarioEditorComponent implements OnInit {
  scenario: Scenario = {
    id: '',
    name: '',
    difficulty: 'Beginner',
    timeLimit: 15,
    devices: [],
    connections: []
  };

  difficultyOptions: ScenarioDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
  
  // Device positioning properties
  selectedDevice: Device | null = null;
  isDragging = false;
  dragOffset = { x: 0, y: 0 };
  
  // Connection drawing properties
  isDrawingConnection = false;
  connectionStartDevice: Device | null = null;
  connectionPreview = { x: 0, y: 0 };
  
  // Backend integration properties
  isBackendAvailable = false;
  isSaving = false;
  saveError: string | null = null;

  constructor(private scenarioService: ScenarioService) {}

  ngOnInit(): void {
    this.checkBackendHealth();
  }

  private checkBackendHealth(): void {
    this.scenarioService.checkBackendHealth().subscribe({
      next: () => {
        this.isBackendAvailable = true;
        this.scenarioService.loadScenarios();
      },
      error: () => {
        this.isBackendAvailable = false;
        console.warn('Backend not available, using local storage only');
      }
    });
  }

  saveScenario(): void {
    if (!this.scenario.name.trim()) {
      alert('Please enter a scenario name before saving.');
      return;
    }

    this.isSaving = true;
    this.saveError = null;

    // Generate unique ID if not set
    if (!this.scenario.id) {
      this.scenario.id = this.generateId();
    }

    if (this.isBackendAvailable) {
      // Save to backend
      this.scenarioService.saveScenario(this.scenario).subscribe({
        next: (savedScenario) => {
          this.scenario = savedScenario;
          this.isSaving = false;
          alert(`Scenario "${this.scenario.name}" saved to backend successfully!`);
        },
        error: (error) => {
          this.isSaving = false;
          this.saveError = error.message;
          console.error('Error saving to backend:', error);
          // Fallback to local download
          this.saveScenarioLocally();
        }
      });
    } else {
      // Fallback to local download
      this.saveScenarioLocally();
    }
  }

  private saveScenarioLocally(): void {
    const jsonData = JSON.stringify(this.scenario, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.scenario.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    this.isSaving = false;
    alert(`Scenario "${this.scenario.name}" saved locally (backend unavailable)!`);
  }

  loadScenario(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const scenarioData = JSON.parse(e.target?.result as string);
          this.scenario = {
            ...scenarioData,
            devices: scenarioData.devices || [],
            connections: scenarioData.connections || []
          };
          alert(`Scenario "${this.scenario.name}" loaded successfully!`);
        } catch (error) {
          alert('Error loading scenario file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }

  clearScenario(): void {
    if (confirm('Are you sure you want to clear the current scenario? This action cannot be undone.')) {
      this.scenario = {
        id: '',
        name: '',
        difficulty: 'Beginner',
        timeLimit: 15,
        devices: [],
        connections: []
      };
    }
  }

  exportScenario(): void {
    const exportData = {
      ...this.scenario,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.scenario.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Backend integration methods
  loadScenariosFromBackend(): void {
    if (this.isBackendAvailable) {
      this.scenarioService.getAllScenarios().subscribe({
        next: (scenarios) => {
          if (scenarios.length > 0) {
            const scenarioNames = scenarios.map(s => s.name).join(', ');
            const selectedName = prompt(`Available scenarios: ${scenarioNames}\nEnter scenario name to load:`);
            if (selectedName) {
              const selectedScenario = scenarios.find(s => s.name === selectedName);
              if (selectedScenario) {
                this.scenario = selectedScenario;
                alert(`Scenario "${selectedScenario.name}" loaded from backend!`);
              } else {
                alert('Scenario not found!');
              }
            }
          } else {
            alert('No scenarios found in backend.');
          }
        },
        error: (error) => {
          console.error('Error loading scenarios from backend:', error);
          alert('Error loading scenarios from backend.');
        }
      });
    } else {
      alert('Backend not available. Please check your connection.');
    }
  }

  deleteScenarioFromBackend(): void {
    if (this.isBackendAvailable && this.scenario.id) {
      if (confirm(`Are you sure you want to delete scenario "${this.scenario.name}" from the backend?`)) {
        this.scenarioService.deleteScenario(this.scenario.id).subscribe({
          next: () => {
            alert(`Scenario "${this.scenario.name}" deleted from backend!`);
            this.clearScenario();
          },
          error: (error) => {
            console.error('Error deleting scenario from backend:', error);
            alert('Error deleting scenario from backend.');
          }
        });
      }
    } else {
      alert('Backend not available or no scenario ID.');
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const deviceType = event.dataTransfer?.getData('text/plain') as DeviceType;
    
    if (deviceType && this.deviceTypes.includes(deviceType)) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newDevice: Device = {
        id: this.generateId(),
        name: `${deviceType} ${this.scenario.devices.length + 1}`,
        type: deviceType,
        ip: this.generateIP(),
        status: 'active' as DeviceStatus,
        position: { x, y }
      };
      
      this.scenario.devices.push(newDevice);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateIP(): string {
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  private deviceTypes: DeviceType[] = ['Router', 'Switch', 'Server', 'Firewall', 'Load balancer'];

  getDeviceIcon(deviceType: DeviceType): string {
    switch (deviceType) {
      case 'Router':
        return '🌐';
      case 'Switch':
        return '🔀';
      case 'Server':
        return '🖥️';
      case 'Firewall':
        return '🛡️';
      case 'Load balancer':
        return '⚖️';
      default:
        return '📱';
    }
  }

  // Device positioning methods
  onDeviceMouseDown(event: MouseEvent, device: Device): void {
    event.preventDefault();
    this.selectedDevice = device;
    this.isDragging = true;
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.selectedDevice) {
      const canvas = event.currentTarget as HTMLElement;
      const rect = canvas.getBoundingClientRect();
      
      const newX = event.clientX - rect.left - this.dragOffset.x;
      const newY = event.clientY - rect.top - this.dragOffset.y;
      
      // Constrain to canvas bounds
      const constrainedX = Math.max(0, Math.min(newX, rect.width - 80));
      const constrainedY = Math.max(0, Math.min(newY, rect.height - 60));
      
      this.selectedDevice.position = { x: constrainedX, y: constrainedY };
    }
  }

  onCanvasMouseUp(): void {
    this.isDragging = false;
    this.selectedDevice = null;
  }

  onDeviceDoubleClick(device: Device): void {
    // Allow renaming device
    const newName = prompt('Enter new device name:', device.name);
    if (newName && newName.trim()) {
      device.name = newName.trim();
    }
  }

  // Connection drawing methods
  startConnectionDrawing(device: Device, event: MouseEvent): void {
    event.stopPropagation();
    this.isDrawingConnection = true;
    this.connectionStartDevice = device;
  }

  onCanvasMouseMoveForConnection(event: MouseEvent): void {
    if (this.isDrawingConnection) {
      const canvas = event.currentTarget as HTMLElement;
      const rect = canvas.getBoundingClientRect();
      this.connectionPreview = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
  }

  endConnectionDrawing(targetDevice: Device, event: MouseEvent): void {
    event.stopPropagation();
    
    if (this.isDrawingConnection && this.connectionStartDevice && 
        this.connectionStartDevice.id !== targetDevice.id) {
      
      // Check if connection already exists
      const existingConnection = this.scenario.connections.find(conn => 
        (conn.fromDeviceId === this.connectionStartDevice!.id && conn.toDeviceId === targetDevice.id) ||
        (conn.fromDeviceId === targetDevice.id && conn.toDeviceId === this.connectionStartDevice!.id)
      );

      if (!existingConnection) {
        const newConnection: Connection = {
          id: this.generateId(),
          fromDeviceId: this.connectionStartDevice.id,
          toDeviceId: targetDevice.id,
          status: 'active' as ConnectionStatus
        };
        
        this.scenario.connections.push(newConnection);
      }
    }
    
    this.cancelConnectionDrawing();
  }

  cancelConnectionDrawing(): void {
    this.isDrawingConnection = false;
    this.connectionStartDevice = null;
  }

  deleteConnection(connection: Connection): void {
    const index = this.scenario.connections.indexOf(connection);
    if (index > -1) {
      this.scenario.connections.splice(index, 1);
    }
  }

  getConnectionPath(connection: Connection): string {
    const fromDevice = this.scenario.devices.find(d => d.id === connection.fromDeviceId);
    const toDevice = this.scenario.devices.find(d => d.id === connection.toDeviceId);
    
    if (!fromDevice || !toDevice) return '';
    
    const startX = fromDevice.position.x + 40; // Center of device
    const startY = fromDevice.position.y + 30;
    const endX = toDevice.position.x + 40;
    const endY = toDevice.position.y + 30;
    
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }
}
