import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceType } from '../../models/device.model';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-list.component.html',
  styleUrl: './device-list.component.css'
})
export class DeviceListComponent {
  @Output() deviceSelected = new EventEmitter<DeviceType>();
  
  deviceTypes: DeviceType[] = ['router', 'switch', 'server', 'firewall', 'load balancer'];

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

  getDeviceDescription(deviceType: DeviceType): string {
    switch (deviceType) {
      case 'router':
        return 'Routes traffic between networks';
      case 'switch':
        return 'Connects devices within a network';
      case 'server':
        return 'Provides services and applications';
      case 'firewall':
        return 'Protects network from threats';
      case 'load balancer':
        return 'Distributes traffic across servers';
      default:
        return 'Network device';
    }
  }

  onDeviceClick(deviceType: DeviceType): void {
    console.log('Device clicked:', deviceType);
    // Emit event or handle device addition
    // This component is used in different contexts, so we'll emit an event
    // that parent components can listen to
    this.deviceSelected.emit(deviceType);
  }

  onDragStart(event: DragEvent, deviceType: DeviceType): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', deviceType);
      event.dataTransfer.effectAllowed = 'copy';
    }
  }
}
