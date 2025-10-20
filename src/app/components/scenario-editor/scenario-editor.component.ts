import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Scenario, ScenarioDifficulty } from '../../models/scenario.model';
import { Device, DeviceType, DeviceStatus } from '../../models/device.model';
import { DeviceListComponent } from '../device-list/device-list.component';

@Component({
  selector: 'app-scenario-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DeviceListComponent],
  templateUrl: './scenario-editor.component.html',
  styleUrl: './scenario-editor.component.css'
})
export class ScenarioEditorComponent {
  scenario: Scenario = {
    id: '',
    name: '',
    difficulty: 'Beginner',
    timeLimit: 15,
    devices: [],
    connections: []
  };

  difficultyOptions: ScenarioDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

  saveScenario(): void {
    const jsonData = JSON.stringify(this.scenario, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.scenario.name || 'scenario'}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
}
