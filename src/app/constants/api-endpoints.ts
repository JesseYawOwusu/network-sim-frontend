/**
 * API endpoint constants for the network simulation application
 * Centralized location for all backend API routes
 */

export const API_ENDPOINTS = {
  // Device endpoints
  DEVICES: {
    BASE: 'api/devices',
    BY_ID: (id: string) => `api/devices/${id}`,
    CREATE: 'api/devices',
    UPDATE: (id: string) => `api/devices/${id}`,
    DELETE: (id: string) => `api/devices/${id}`
  },

  // Connection endpoints
  CONNECTIONS: {
    BASE: '/connections',
    BY_ID: (id: string) => `/connections/${id}`,
    CREATE: '/connections',
    UPDATE: (id: string) => `/connections/${id}`,
    DELETE: (id: string) => `/connections/${id}`,
    BETWEEN_DEVICES: (fromId: string, toId: string) => `/connections/between/${fromId}/${toId}`
  },

  // Network topology endpoints
  TOPOLOGY: {
    BASE: '/topology',
    FULL: '/topology/full'
  },

  // Health check
  HEALTH: '/health',
  VERSION: '/version'
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