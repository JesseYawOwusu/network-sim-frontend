import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '../services/device.service';
import { Device } from '../models/device.model';
import { Connection } from '../models/connection.model';

@Component({
  selector: 'app-network-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './network-canvas.html',
  styleUrls: ['./network-canvas.css']
})
export class NetworkCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('networkCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D | null;
  private deviceService = inject(DeviceService);
  private animationId: number | null = null;
  private lastTime = 0;
  
  // Animation state
  private hoveredDevice: string | null = null;
  private connectionAnimations = new Map<string, number>();
  private deviceAnimations = new Map<string, { scale: number; colorProgress: number }>();
  
  // Signals
  readonly devices = this.deviceService.devices;
  readonly connections = this.deviceService.connections;

  constructor() {
    // Initialize device animations
    effect(() => {
      const devices = this.devices();
      devices.forEach(device => {
        if (!this.deviceAnimations.has(device.id)) {
          this.deviceAnimations.set(device.id, { scale: 1.0, colorProgress: 0 });
        }
      });
    });

    // Start animation loop when canvas is ready
    effect(() => {
      const devices = this.devices();
      const connections = this.connections();
      if (this.ctx && (devices.length > 0 || connections.length > 0)) {
        this.startAnimationLoop();
      }
    });
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');

    if (this.ctx) {
      this.setupCanvas();
      this.drawGrid();
      this.startAnimationLoop();
    }
  }

  private startAnimationLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - this.lastTime;
      this.lastTime = currentTime;
      
      this.updateAnimations(deltaTime);
      this.redrawCanvas();
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  private updateAnimations(deltaTime: number) {
    // Update connection draw-in animations
    this.connections().forEach(connection => {
      const currentProgress = this.connectionAnimations.get(connection.id) || 0;
      const targetProgress = 1.0;
      const speed = 0.002; // Animation speed
      
      if (currentProgress < targetProgress) {
        const newProgress = Math.min(currentProgress + speed * deltaTime, targetProgress);
        this.connectionAnimations.set(connection.id, newProgress);
      }
    });

    // Update device hover animations
    this.devices().forEach(device => {
      const animation = this.deviceAnimations.get(device.id);
      if (animation) {
        const targetScale = this.hoveredDevice === device.id ? 1.2 : 1.0;
        const scaleSpeed = 0.01;
        
        if (Math.abs(animation.scale - targetScale) > 0.01) {
          animation.scale += (targetScale - animation.scale) * scaleSpeed;
        }
      }
    });
  }

  // Utility methods for smooth interpolation
  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }

  private interpolateColor(color1: string, color2: string, factor: number): string {
    // Simple color interpolation (you could use a more sophisticated method)
    return factor < 0.5 ? color1 : color2;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private setupCanvas() {
    if (!this.ctx) return;
    
    // Set canvas size
    const canvas = this.ctx.canvas;
    canvas.width = 800;
    canvas.height = 500;
    
    // Set default styles
    this.ctx.lineWidth = 1;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
  }

  private drawGrid() {
    if (!this.ctx) return;
    
    const spacing = 50;
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 0.5;

    // Draw vertical lines
    for (let x = 0; x < this.ctx.canvas.width; x += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.ctx.canvas.height);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y < this.ctx.canvas.height; y += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.ctx.canvas.width, y);
      this.ctx.stroke();
    }
  }


  private drawConnections() {
    if (!this.ctx) return;
    
    const connections = this.connections();
    const devices = this.devices();
    
    connections.forEach(connection => {
      const fromDevice = devices.find(d => d.id === connection.fromDeviceId);
      const toDevice = devices.find(d => d.id === connection.toDeviceId);
      
      if (fromDevice && toDevice) {
        this.drawConnection(connection, fromDevice, toDevice);
      }
    });
  }

  private drawConnection(connection: Connection, fromDevice: Device, toDevice: Device) {
    if (!this.ctx) return;
    
    const { x: x1, y: y1 } = fromDevice.position;
    const { x: x2, y: y2 } = toDevice.position;
    
    // Get animation progress for draw-in effect
    const drawProgress = this.connectionAnimations.get(connection.id) || 0;
    const easedProgress = this.easeInOutCubic(drawProgress);
    
    // Set connection color based on status with smooth transitions
    let strokeColor: string;
    let lineWidth: number;
    let glowIntensity = 0;
    
    switch (connection.status) {
      case 'active':
        strokeColor = '#28a745'; // Green
        lineWidth = 2 + (connection.trafficLoad / 100) * 3; // Thickness based on traffic
        glowIntensity = 10;
        break;
      case 'inactive':
        strokeColor = '#ffc107'; // Yellow
        lineWidth = 1.5;
        glowIntensity = 5;
        break;
      case 'failed':
        strokeColor = '#dc3545'; // Red
        lineWidth = 2;
        glowIntensity = 8;
        break;
      default:
        strokeColor = '#6c757d'; // Gray
        lineWidth = 1;
        glowIntensity = 0;
    }
    
    // Add pulsing glow effect for active connections
    if (connection.status === 'active' && glowIntensity > 0) {
      const time = Date.now() * 0.003;
      const pulse = Math.sin(time) * 0.5 + 0.5;
      this.ctx.shadowColor = strokeColor;
      this.ctx.shadowBlur = glowIntensity * (0.5 + pulse * 0.5);
    } else {
      this.ctx.shadowBlur = 0;
    }
    
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = lineWidth;
    this.ctx.setLineDash(connection.status === 'failed' ? [5, 5] : []);
    
    // Calculate control points for smooth curve
    const controlOffset = Math.abs(x2 - x1) * 0.3;
    const cp1x = x1 + controlOffset;
    const cp1y = y1;
    const cp2x = x2 - controlOffset;
    const cp2y = y2;
    
    // Draw animated dashed connection line
    this.drawAnimatedDashedLine(x1, y1, x2, y2, cp1x, cp1y, cp2x, cp2y, easedProgress, lineWidth);
    
    // Reset effects
    this.ctx.shadowBlur = 0;
    this.ctx.setLineDash([]);
    
    // Add traffic flow animation for active connections
    if (connection.status === 'active' && connection.trafficLoad > 0 && easedProgress > 0.5) {
      this.drawTrafficFlow(x1, y1, x2, y2, connection.trafficLoad, cp1x, cp1y, cp2x, cp2y);
    }
    
    // Draw connection info in the middle of the line
    if (easedProgress > 0.8) {
      this.drawConnectionInfo(connection, x1, y1, x2, y2);
    }
  }

  private drawAnimatedDashedLine(x1: number, y1: number, x2: number, y2: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, progress: number, lineWidth: number) {
    if (!this.ctx) return;
    
    // Calculate the total length of the bezier curve
    const totalLength = this.getBezierLength(x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2);
    const dashLength = 8;
    const gapLength = 4;
    const dashPattern = dashLength + gapLength;
    
    // Calculate how many dashes should be visible based on progress
    const visibleLength = totalLength * progress;
    const numDashes = Math.floor(visibleLength / dashPattern);
    const partialDashLength = visibleLength - (numDashes * dashPattern);
    
    this.ctx.beginPath();
    
    // Draw complete dashes
    for (let i = 0; i < numDashes; i++) {
      const dashStart = i * dashPattern;
      const dashEnd = dashStart + dashLength;
      
      this.drawBezierSegment(x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2, dashStart / totalLength, dashEnd / totalLength);
    }
    
    // Draw partial dash if needed
    if (partialDashLength > 0 && partialDashLength <= dashLength) {
      const dashStart = numDashes * dashPattern;
      const dashEnd = dashStart + partialDashLength;
      
      this.drawBezierSegment(x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2, dashStart / totalLength, dashEnd / totalLength);
    }
    
    this.ctx.stroke();
  }

  private getBezierLength(x1: number, y1: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, x2: number, y2: number): number {
    // Approximate the length by sampling points along the curve
    let length = 0;
    let prevX = x1;
    let prevY = y1;
    
    for (let t = 0.1; t <= 1; t += 0.1) {
      const x = Math.pow(1-t, 3) * x1 + 3 * Math.pow(1-t, 2) * t * cp1x + 3 * (1-t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * x2;
      const y = Math.pow(1-t, 3) * y1 + 3 * Math.pow(1-t, 2) * t * cp1y + 3 * (1-t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * y2;
      
      length += Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2));
      prevX = x;
      prevY = y;
    }
    
    return length;
  }

  private drawBezierSegment(x1: number, y1: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, x2: number, y2: number, startT: number, endT: number) {
    if (!this.ctx) return;
    
    // Calculate start and end points on the bezier curve
    const startX = Math.pow(1-startT, 3) * x1 + 3 * Math.pow(1-startT, 2) * startT * cp1x + 3 * (1-startT) * Math.pow(startT, 2) * cp2x + Math.pow(startT, 3) * x2;
    const startY = Math.pow(1-startT, 3) * y1 + 3 * Math.pow(1-startT, 2) * startT * cp1y + 3 * (1-startT) * Math.pow(startT, 2) * cp2y + Math.pow(startT, 3) * y2;
    
    const endX = Math.pow(1-endT, 3) * x1 + 3 * Math.pow(1-endT, 2) * endT * cp1x + 3 * (1-endT) * Math.pow(endT, 2) * cp2x + Math.pow(endT, 3) * x2;
    const endY = Math.pow(1-endT, 3) * y1 + 3 * Math.pow(1-endT, 2) * endT * cp1y + 3 * (1-endT) * Math.pow(endT, 2) * cp2y + Math.pow(endT, 3) * y2;
    
    // Draw line segment
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
  }

  private drawTrafficFlow(x1: number, y1: number, x2: number, y2: number, trafficLoad: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number) {
    if (!this.ctx) return;
    
    const time = Date.now() * 0.003; // Animation speed
    const flowCount = Math.floor(trafficLoad / 20) + 1; // More flows for higher traffic
    
    for (let i = 0; i < flowCount; i++) {
      const progress = (time + i * 0.5) % 1;
      
      // Calculate position along the bezier curve
      const t = progress;
      const x = Math.pow(1-t, 3) * x1 + 3 * Math.pow(1-t, 2) * t * cp1x + 3 * (1-t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * x2;
      const y = Math.pow(1-t, 3) * y1 + 3 * Math.pow(1-t, 2) * t * cp1y + 3 * (1-t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * y2;
      
      // Add glow effect to traffic flow dots
      this.ctx.shadowColor = '#007bff';
      this.ctx.shadowBlur = 4;
      this.ctx.fillStyle = '#007bff';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  private drawConnectionInfo(connection: Connection, x1: number, y1: number, x2: number, y2: number) {
    if (!this.ctx) return;
    
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    // Draw latency info
    this.ctx.fillStyle = '#333';
    this.ctx.font = '9px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${connection.latency}ms`, midX, midY - 5);
    
    // Draw bandwidth info
    this.ctx.fillStyle = '#666';
    this.ctx.font = '8px Arial';
    this.ctx.fillText(`${connection.bandwidth}Mbps`, midX, midY + 8);
  }

  private drawDevices() {
    if (!this.ctx) return;
    
    const devices = this.devices();
    
    devices.forEach(device => {
      this.drawDevice(device);
    });
  }

  private drawDevice(device: Device) {
    if (!this.ctx) return;
    
    const { x, y } = device.position;
    const animation = this.deviceAnimations.get(device.id);
    const scale = animation?.scale || 1.0;
    const radius = 25 * scale;
    
    // Set device colors based on status
    let fillColor: string;
    let strokeColor: string;
    let gradientColors: string[];
    
    switch (device.status) {
      case 'online':
        fillColor = '#28a745';
        strokeColor = '#1e7e34';
        gradientColors = ['#34d058', '#28a745', '#1e7e34'];
        break;
      case 'offline':
        fillColor = '#ffc107';
        strokeColor = '#e0a800';
        gradientColors = ['#ffd43b', '#ffc107', '#e0a800'];
        break;
      case 'failed':
        fillColor = '#dc3545';
        strokeColor = '#c82333';
        gradientColors = ['#f56565', '#dc3545', '#c82333'];
        break;
      default:
        fillColor = '#6c757d';
        strokeColor = '#545b62';
        gradientColors = ['#9ca3af', '#6c757d', '#545b62'];
    }
    
    // Add drop shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    // Create gradient fill
    const gradient = this.ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
    gradient.addColorStop(0, gradientColors[0]);
    gradient.addColorStop(0.7, gradientColors[1]);
    gradient.addColorStop(1, gradientColors[2]);
    
    // Draw device circle with gradient
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Reset shadow for stroke
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Draw stroke
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Add pulsing effect for offline/failed devices
    if (device.status === 'failed' || device.status === 'offline') {
      this.drawPulseEffect(x, y, radius, fillColor);
    }
    
    // Add hover glow effect
    if (this.hoveredDevice === device.id) {
      this.ctx.shadowColor = fillColor;
      this.ctx.shadowBlur = 15;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
      this.ctx.strokeStyle = fillColor;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
    
    // Draw device icon (simple text for now)
    this.ctx.fillStyle = 'white';
    this.ctx.font = `bold ${14 * scale}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.getDeviceIcon(device.name), x, y + 5 * scale);
    
    // Draw device name
    this.ctx.fillStyle = '#333';
    this.ctx.font = `${10 * scale}px Arial`;
    this.ctx.fillText(device.name, x, y + radius + 15 * scale);
    
    // Draw IP address
    this.ctx.fillStyle = '#666';
    this.ctx.font = `${9 * scale}px Arial`;
    this.ctx.fillText(device.ip, x, y + radius + 28 * scale);
    
    // Draw status indicator
    this.drawStatusIndicator(x, y, radius, device.status);
  }

  private drawPulseEffect(x: number, y: number, radius: number, color: string) {
    if (!this.ctx) return;
    
    const time = Date.now() * 0.002; // Slow animation
    const pulseRadius = radius + Math.sin(time) * 5;
    const alpha = 0.3 - Math.sin(time) * 0.2;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = alpha;
    this.ctx.fill();
    this.ctx.globalAlpha = 1; // Reset alpha
  }

  private drawStatusIndicator(x: number, y: number, radius: number, status: Device['status']) {
    if (!this.ctx) return;
    
    const indicatorSize = 8;
    const indicatorX = x + radius - indicatorSize / 2;
    const indicatorY = y - radius + indicatorSize / 2;
    
    this.ctx.beginPath();
    this.ctx.arc(indicatorX, indicatorY, indicatorSize / 2, 0, 2 * Math.PI);
    
    switch (status) {
      case 'online':
        this.ctx.fillStyle = '#28a745';
        break;
      case 'offline':
        this.ctx.fillStyle = '#ffc107';
        break;
      case 'failed':
        this.ctx.fillStyle = '#dc3545';
        break;
      default:
        this.ctx.fillStyle = '#6c757d';
    }
    
    this.ctx.fill();
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private getDeviceIcon(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('router')) return 'R';
    if (lowerName.includes('switch')) return 'S';
    if (lowerName.includes('server')) return 'SV';
    if (lowerName.includes('firewall')) return 'F';
    if (lowerName.includes('load balancer')) return 'LB';
    return 'D'; // Default device icon
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (!this.ctx) return;
    
    const canvas = this.ctx.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if mouse is over a device
    const devices = this.devices();
    const hoveredDevice = devices.find(device => {
      const distance = Math.sqrt(
        Math.pow(x - device.position.x, 2) + Math.pow(y - device.position.y, 2)
      );
      return distance <= 25; // Device radius
    });
    
    // Update hover state
    if (hoveredDevice && this.hoveredDevice !== hoveredDevice.id) {
      this.hoveredDevice = hoveredDevice.id;
      canvas.style.cursor = 'pointer';
    } else if (!hoveredDevice && this.hoveredDevice) {
      this.hoveredDevice = null;
      canvas.style.cursor = 'default';
    }
  }

  onCanvasClick(event: MouseEvent) {
    if (!this.ctx) return;
    
    const canvas = this.ctx.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if click is on a device first
    const devices = this.devices();
    const clickedDevice = devices.find(device => {
      const distance = Math.sqrt(
        Math.pow(x - device.position.x, 2) + Math.pow(y - device.position.y, 2)
      );
      return distance <= 25; // Device radius
    });
    
    if (clickedDevice) {
      console.log('Clicked device:', clickedDevice);
      // TODO: Show device details or context menu
      return;
    }
    
    // Check if click is on a connection
    const connections = this.connections();
    const clickedConnection = connections.find(connection => {
      const fromDevice = devices.find(d => d.id === connection.fromDeviceId);
      const toDevice = devices.find(d => d.id === connection.toDeviceId);
      
      if (!fromDevice || !toDevice) return false;
      
      return this.isPointOnLine(
        x, y,
        fromDevice.position.x, fromDevice.position.y,
        toDevice.position.x, toDevice.position.y,
        10 // Click tolerance
      );
    });
    
    if (clickedConnection) {
      console.log('Clicked connection:', clickedConnection);
      // TODO: Show connection details or traffic stats
    }
  }

  private isPointOnLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
    // Calculate distance from point to line
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return false;
    
    const param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= tolerance;
  }

  ngOnDestroy() {
    // Clean up animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private redrawCanvas() {
    if (!this.ctx) return;
    
    // Clear canvas efficiently
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Only redraw grid if needed (could be optimized further)
    this.drawGrid();
    
    // Draw connections first (behind devices)
    this.drawConnections();
    
    // Draw devices on top
    this.drawDevices();
  }
}
