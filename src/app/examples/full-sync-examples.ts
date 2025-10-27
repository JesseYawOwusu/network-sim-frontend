/**
 * Example usage of the new full sync flow for saving scenario layouts
 * This file demonstrates how to use the new DeviceInput interface and saveLayout method
 */

import { DeviceInput } from '../models/device.model';

// Example 1: Full sync with only new devices (temp ids)
export const exampleNewDevicesOnly: DeviceInput[] = [
  {
    id: "temp-1",
    name: "Router X",
    type: "router",
    position: { x: 300, y: 200 },
    pingRate: 5,
    latency: 100,
    trafficLoad: 30,
    connections: ["temp-2"]
  },
  {
    id: "temp-2",
    name: "Server Z",
    type: "server",
    position: { x: 500, y: 350 },
    pingRate: 8,
    latency: 15,
    trafficLoad: 45,
    connections: ["temp-1"]
  }
];

// Example 2: Mixed: update an existing device and add a new one, connect both ways
export const exampleMixedDevices: DeviceInput[] = [
  {
    id: 10,                       // existing DB id
    name: "Core Router",
    type: "router",
    position: { x: 220, y: 180 },
    pingRate: 3,
    latency: 5,
    trafficLoad: 20,
    connections: ["temp-3"]       // link to new node by temp id
  },
  {
    id: "temp-3",                 // new switch
    name: "Edge Switch",
    type: "switch",
    position: { x: 420, y: 360 },
    pingRate: 2,
    latency: 3,
    trafficLoad: 15,
    connections: [10]             // back-link to existing
  }
];

// Example 3: Complex network with multiple device types
export const exampleComplexNetwork: DeviceInput[] = [
  {
    id: 1, // Existing router
    name: "Main Router",
    type: "router",
    position: { x: 100, y: 100 },
    pingRate: 10,
    latency: 50,
    trafficLoad: 25,
    connections: [2, "temp-1"]
  },
  {
    id: 2, // Existing switch
    name: "Core Switch",
    type: "switch",
    position: { x: 300, y: 100 },
    pingRate: 5,
    latency: 25,
    trafficLoad: 40,
    connections: [1, "temp-2", "temp-3"]
  },
  {
    id: "temp-1", // New server
    name: "Web Server",
    type: "server",
    position: { x: 100, y: 300 },
    pingRate: 15,
    latency: 75,
    trafficLoad: 60,
    connections: [1]
  },
  {
    id: "temp-2", // New firewall
    name: "Security Firewall",
    type: "firewall",
    position: { x: 300, y: 300 },
    pingRate: 8,
    latency: 100,
    trafficLoad: 20,
    connections: [2, "temp-3"]
  },
  {
    id: "temp-3", // New load balancer
    name: "Load Balancer",
    type: "load balancer",
    position: { x: 500, y: 200 },
    pingRate: 12,
    latency: 30,
    trafficLoad: 80,
    connections: [2, "temp-2"]
  }
];

/**
 * Usage example in a component:
 * 
 * ```typescript
 * // In your component
 * constructor(private scenarioService: ScenarioService) {}
 * 
 * saveScenarioLayout() {
 *   const devices: DeviceInput[] = [
 *     {
 *       id: "temp-1",
 *       name: "New Router",
 *       type: "router",
 *       position: { x: 100, y: 100 },
 *       pingRate: 10,
 *       latency: 50,
 *       trafficLoad: 25,
 *       connections: ["temp-2"]
 *     },
 *     {
 *       id: "temp-2", 
 *       name: "New Server",
 *       type: "server",
 *       position: { x: 300, y: 200 },
 *       connections: ["temp-1"]
 *     }
 *   ];
 * 
 *   this.scenarioService.saveLayout(scenarioId, devices).subscribe({
 *     next: (response) => {
 *       console.log('Layout saved successfully:', response);
 *     },
 *     error: (error) => {
 *       console.error('Error saving layout:', error);
 *     }
 *   });
 * }
 * ```
 */

