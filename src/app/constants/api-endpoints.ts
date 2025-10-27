/**
 * API endpoint constants for the network simulation application
 * Centralized location for all backend API routes
 */

// Backend base URL
export const BACKEND_BASE_URL = 'https://qtzbtx6k-3000.uks1.devtunnels.ms';

// Default user ID for API calls (can be made configurable later)
export const DEFAULT_USER_ID = '2';

export const API_ENDPOINTS = {
  // Device endpoints
  DEVICES: {
    BASE: `${BACKEND_BASE_URL}/api/devices`,
    BY_ID: (id: string) => `${BACKEND_BASE_URL}/api/devices/${id}`,
    CREATE: `${BACKEND_BASE_URL}/api/devices`,
    UPDATE: (id: string) => `${BACKEND_BASE_URL}/api/devices/${id}`,
    DELETE: (id: string) => `${BACKEND_BASE_URL}/api/devices/${id}`
  },

  // Connection endpoints
  CONNECTIONS: {
    BASE: `${BACKEND_BASE_URL}/connections`,
    BY_ID: (id: string) => `${BACKEND_BASE_URL}/connections/${id}`,
    CREATE: `${BACKEND_BASE_URL}/connections`,
    UPDATE: (id: string) => `${BACKEND_BASE_URL}/connections/${id}`,
    DELETE: (id: string) => `${BACKEND_BASE_URL}/connections/${id}`,
    BETWEEN_DEVICES: (fromId: string, toId: string) => `${BACKEND_BASE_URL}/connections/between/${fromId}/${toId}`
  },

  // Network topology endpoints
  TOPOLOGY: {
    BASE: `${BACKEND_BASE_URL}/topology`,
    FULL: `${BACKEND_BASE_URL}/topology/full`
  },

  // Scenario endpoints - Updated to match working backend structure
  SCENARIOS: {
    BASE: `${BACKEND_BASE_URL}/api/scenarios`,
    BY_ID: (id: string) => `${BACKEND_BASE_URL}/api/scenario/${id}`,
    CREATE: `${BACKEND_BASE_URL}/api/scenarios`,
    UPDATE: (id: string) => `${BACKEND_BASE_URL}/api/scenario/${id}`,
    DELETE: (id: string) => `${BACKEND_BASE_URL}/api/scenario/${id}`,
    // User-specific scenario endpoints
    USER_SCENARIOS: (userId: string) => `${BACKEND_BASE_URL}/api/user/${userId}/scenarios`,
    USER_CREATE: (userId: string) => `${BACKEND_BASE_URL}/api/user/${userId}/scenarios`,
    // Layout management endpoints
    SAVE_LAYOUT: (id: string) => `${BACKEND_BASE_URL}/api/scenario/${id}/save-layout`,
    // Simulation endpoints
    SIMULATE: (id: string) => `${BACKEND_BASE_URL}/api/scenario/${id}/simulate`
  },

  // Health check
  HEALTH: `${BACKEND_BASE_URL}/`,
  VERSION: `${BACKEND_BASE_URL}/version`
} as const;

/**
 * HTTP methods commonly used in the application
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
} as const;

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;