# Full Sync Flow Implementation

This document describes the implementation of the new "full sync" flow for saving scenario layouts in the network simulation frontend.

## Overview

The backend now supports a "full sync" flow in `saveScenarioLayout()` that:
- Creates new devices when their submitted id is not a known numeric DB id
- Updates existing devices when id is a numeric DB id  
- Rebuilds all connections for the scenario in one transaction using a mapping from submitted ids (including temp ids) to real DB ids
- Joi validation is currently disabled, so the frontend must send correctly shaped data

## Implementation Details

### 1. New DeviceInput Interface

**File:** `src/app/models/device.model.ts`

Added a new `DeviceInput` interface that supports both temp string IDs and numeric DB IDs:

```typescript
export interface DeviceInput {
  id: string | number; // Use numeric IDs for existing devices, string temp IDs for new devices
  name?: string;
  type?: string; // router, switch, server, etc.
  position?: { x: number; y: number };
  pingRate?: number; // 1–60
  latency?: number; // 1–1000
  trafficLoad?: number; // 0–100
  connections?: Array<string | number>; // Must reference the same id values used in this payload
}
```

### 2. Updated Scenario Service

**File:** `src/app/services/scenario.service.ts`

Added a new `saveLayout` method that uses the full sync flow:

```typescript
saveLayout(scenarioId: number, devices: DeviceInput[]): Observable<any>
```

This method:
- Takes a numeric scenario ID and array of DeviceInput objects
- Sends data to `PUT /api/scenario/:id/save-layout` endpoint
- Supports both existing devices (numeric IDs) and new devices (string temp IDs)
- Maintains backward compatibility with the existing `saveNetworkLayout` method

### 3. Updated Device Display Component

**File:** `src/app/components/device-display/device-display.component.ts`

Modified the `saveAllChanges` method to use the new full sync flow:

- Converts devices to `DeviceInput` format using `convertDevicesToDeviceInputs()`
- Uses string temp IDs for new devices and numeric IDs for existing devices
- Validates parameters according to backend requirements:
  - `pingRate`: 1-60
  - `latency`: 1-1000  
  - `trafficLoad`: 0-100
- Calls the new `saveLayout` method instead of the legacy `saveNetworkLayout`

### 4. Enhanced Local State Service

**File:** `src/app/services/local-state.service.ts`

Added `getAllDevices()` method to support the full sync flow:

```typescript
getAllDevices(): Device[]
```

This method returns all devices from current changes (excluding deleted devices) for conversion to DeviceInput format.

### 5. API Endpoints

**File:** `src/app/constants/api-endpoints.ts`

The existing `SAVE_LAYOUT` endpoint is already correctly configured:

```typescript
SAVE_LAYOUT: (id: string) => `${BACKEND_BASE_URL}/api/scenario/${id}/save-layout`
```

## Usage Examples

### Example 1: Full sync with only new devices (temp ids)

```typescript
const devices: DeviceInput[] = [
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
    connections: ["temp-1"]
  }
];

this.scenarioService.saveLayout(scenarioId, devices).subscribe({
  next: (response) => console.log('Layout saved:', response),
  error: (error) => console.error('Error:', error)
});
```

### Example 2: Mixed: update existing device and add new one

```typescript
const devices: DeviceInput[] = [
  {
    id: 10,                       // existing DB id
    name: "Core Router",
    position: { x: 220, y: 180 },
    connections: ["temp-3"]       // link to new node by temp id
  },
  {
    id: "temp-3",                 // new switch
    name: "Edge Switch",
    type: "switch",
    position: { x: 420, y: 360 },
    connections: [10]             // back-link to existing
  }
];
```

## ID Strategy

- **String temp IDs**: Use for client-created nodes (e.g., "temp-1", "temp-2")
- **Numeric IDs**: Use for existing devices from the database
- **Avoid numeric temp IDs**: To prevent accidental overlap with real DB ids
- **Consistent references**: Connections must reference the same id values used in the payload

## Validation

The frontend now validates:
- `pingRate`: Must be between 1-60
- `latency`: Must be between 1-1000
- `trafficLoad`: Must be between 0-100
- `position.x` and `position.y`: Must be numbers ≥ 0
- Connection consistency: All referenced IDs must exist in the payload

## Backward Compatibility

The implementation maintains backward compatibility:
- Existing `saveNetworkLayout` method is preserved
- Legacy code continues to work unchanged
- New full sync flow is opt-in through the `saveLayout` method

## Testing

Integration tests are provided in `src/app/examples/integration-test.ts`:
- DeviceInput structure validation
- Temp ID generation
- Connection consistency
- Parameter validation

Run tests with:
```typescript
import { IntegrationTest } from './examples/integration-test';
IntegrationTest.runAll();
```

## Files Modified

1. `src/app/models/device.model.ts` - Added DeviceInput interface
2. `src/app/services/scenario.service.ts` - Added saveLayout method
3. `src/app/services/local-state.service.ts` - Added getAllDevices method
4. `src/app/components/device-display/device-display.component.ts` - Updated saveAllChanges method
5. `src/app/examples/full-sync-examples.ts` - Usage examples
6. `src/app/examples/integration-test.ts` - Integration tests

## Next Steps

1. Test the integration with the backend
2. Update any remaining components that use the old save flow
3. Add error handling for edge cases
4. Consider adding unit tests for the new methods
5. Update documentation for other developers

