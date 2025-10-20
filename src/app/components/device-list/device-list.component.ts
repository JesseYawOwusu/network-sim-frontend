import { Component } from '@angular/core';
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
  deviceTypes: DeviceType[] = ['Router', 'Switch', 'Server', 'Firewall', 'Load balancer'];

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

  getDeviceDescription(deviceType: DeviceType): string {
    switch (deviceType) {
      case 'Router':
        return 'Routes traffic between networks';
      case 'Switch':
        return 'Connects devices within a network';
      case 'Server':
        return 'Provides services and applications';
      case 'Firewall':
        return 'Protects network from threats';
      case 'Load balancer':
        return 'Distributes traffic across servers';
      default:
        return 'Network device';
    }
  }
}
