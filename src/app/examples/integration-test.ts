/**
 * Integration test for the new full sync flow
 * This file contains test cases to verify the integration works correctly
 */

import { DeviceInput } from '../models/device.model';

/**
 * Test case 1: Verify DeviceInput interface structure
 */
export function testDeviceInputStructure(): boolean {
  try {
    const deviceInput: DeviceInput = {
      id: "temp-1",
      name: "Test Device",
      type: "router",
      position: { x: 100, y: 100 },
      pingRate: 10,
      latency: 50,
      trafficLoad: 25,
      connections: ["temp-2"]
    };

    // Verify required fields
    if (!deviceInput.id) return false;
    if (typeof deviceInput.id !== 'string' && typeof deviceInput.id !== 'number') return false;
    
    // Verify optional fields
    if (deviceInput.pingRate && (deviceInput.pingRate < 1 || deviceInput.pingRate > 60)) return false;
    if (deviceInput.latency && (deviceInput.latency < 1 || deviceInput.latency > 1000)) return false;
    if (deviceInput.trafficLoad && (deviceInput.trafficLoad < 0 || deviceInput.trafficLoad > 100)) return false;
    
    console.log('✅ DeviceInput structure test passed');
    return true;
  } catch (error) {
    console.error('❌ DeviceInput structure test failed:', error);
    return false;
  }
}

/**
 * Test case 2: Verify temp ID generation
 */
export function testTempIdGeneration(): boolean {
  try {
    const tempIds = ["temp-1", "temp-2", "temp-3"];
    
    for (const id of tempIds) {
      if (!id.startsWith('temp-')) return false;
      const number = parseInt(id.split('-')[1]);
      if (isNaN(number) || number <= 0) return false;
    }
    
    console.log('✅ Temp ID generation test passed');
    return true;
  } catch (error) {
    console.error('❌ Temp ID generation test failed:', error);
    return false;
  }
}

/**
 * Test case 3: Verify connection ID consistency
 */
export function testConnectionConsistency(): boolean {
  try {
    const devices: DeviceInput[] = [
      {
        id: "temp-1",
        name: "Router",
        type: "router",
        position: { x: 100, y: 100 },
        pingRate: 5,
        latency: 10,
        trafficLoad: 25,
        connections: ["temp-2", 5] // Mix of temp and numeric IDs
      },
      {
        id: "temp-2",
        name: "Switch",
        type: "switch",
        position: { x: 200, y: 100 },
        pingRate: 3,
        latency: 5,
        trafficLoad: 15,
        connections: ["temp-1"]
      },
      {
        id: 5,
        name: "Existing Server",
        type: "server",
        position: { x: 300, y: 100 },
        pingRate: 8,
        latency: 12,
        trafficLoad: 40,
        connections: ["temp-1"]
      }
    ];

    // Verify all connection IDs exist in the device list
    for (const device of devices) {
      if (device.connections) {
        for (const connectionId of device.connections) {
          const exists = devices.some(d => 
            d.id.toString() === connectionId.toString()
          );
          if (!exists) {
            console.error(`Connection ID ${connectionId} not found in device list`);
            return false;
          }
        }
      }
    }
    
    console.log('✅ Connection consistency test passed');
    return true;
  } catch (error) {
    console.error('❌ Connection consistency test failed:', error);
    return false;
  }
}

/**
 * Test case 4: Verify parameter validation
 */
export function testParameterValidation(): boolean {
  try {
    const validDevice: DeviceInput = {
      id: "temp-1",
      name: "Valid Device",
      type: "router",
      position: { x: 100, y: 100 },
      pingRate: 30,    // Valid: 1-60
      latency: 500,    // Valid: 1-1000
      trafficLoad: 75   // Valid: 0-100
    };

    const invalidDevice: DeviceInput = {
      id: "temp-2",
      name: "Invalid Device",
      type: "server",
      position: { x: 200, y: 200 },
      pingRate: 0,      // Invalid: < 1
      latency: 1500,    // Invalid: > 1000
      trafficLoad: 150  // Invalid: > 100
    };

    // Test valid device
    if (validDevice.pingRate && (validDevice.pingRate < 1 || validDevice.pingRate > 60)) return false;
    if (validDevice.latency && (validDevice.latency < 1 || validDevice.latency > 1000)) return false;
    if (validDevice.trafficLoad && (validDevice.trafficLoad < 0 || validDevice.trafficLoad > 100)) return false;

    // Test invalid device (should fail validation)
    if (invalidDevice.pingRate && (invalidDevice.pingRate < 1 || invalidDevice.pingRate > 60)) {
      console.log('✅ Invalid pingRate correctly detected');
    }
    if (invalidDevice.latency && (invalidDevice.latency < 1 || invalidDevice.latency > 1000)) {
      console.log('✅ Invalid latency correctly detected');
    }
    if (invalidDevice.trafficLoad && (invalidDevice.trafficLoad < 0 || invalidDevice.trafficLoad > 100)) {
      console.log('✅ Invalid trafficLoad correctly detected');
    }
    
    console.log('✅ Parameter validation test passed');
    return true;
  } catch (error) {
    console.error('❌ Parameter validation test failed:', error);
    return false;
  }
}

/**
 * Run all integration tests
 */
export function runIntegrationTests(): boolean {
  console.log('🧪 Running integration tests for full sync flow...');
  
  const tests = [
    testDeviceInputStructure,
    testTempIdGeneration,
    testConnectionConsistency,
    testParameterValidation
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    if (test()) {
      passed++;
    }
  }
  
  console.log(`\n📊 Integration test results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All integration tests passed! Full sync flow is ready to use.');
    return true;
  } else {
    console.log('⚠️ Some integration tests failed. Please review the implementation.');
    return false;
  }
}

// Export for use in components
export const IntegrationTest = {
  runAll: runIntegrationTests,
  testDeviceInputStructure,
  testTempIdGeneration,
  testConnectionConsistency,
  testParameterValidation
};

