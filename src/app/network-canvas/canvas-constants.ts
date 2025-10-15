/**
 * Constants for network canvas drawing and animation
 * Centralizes all magic numbers and configurable values
 */

export const CANVAS_CONFIG = {
  // Canvas dimensions
  WIDTH: 800,
  HEIGHT: 500,
  
  // Grid settings
  GRID_SPACING: 50,
  GRID_COLOR: '#e0e0e0',
  GRID_LINE_WIDTH: 0.5,
  
  // Device settings
  DEVICE_RADIUS: 25,
  DEVICE_STROKE_WIDTH: 2,
  DEVICE_FONT_SIZE: 12,
  DEVICE_NAME_FONT_SIZE: 10,
  DEVICE_ICON_FONT_SIZE: 14,
  
  // Device status indicators
  STATUS_INDICATOR_SIZE: 8,
  STATUS_INDICATOR_OFFSET: 12.5, // radius - indicator_size/2
  
  // Connection settings
  CONNECTION_LINE_WIDTH: 2,
  CONNECTION_GLOW_INTENSITY: 10,
  CONNECTION_DASH_LENGTH: 8,
  CONNECTION_GAP_LENGTH: 4,
  CONNECTION_CONTROL_OFFSET_FACTOR: 0.3,
  
  // Animation settings
  ANIMATION_SPEED: 0.002,
  SCALE_SPEED: 0.01,
  PULSE_AMPLITUDE: 5,
  PULSE_ALPHA_MIN: 0.1,
  PULSE_ALPHA_MAX: 0.3,
  TRAFFIC_FLOW_SPEED: 0.003,
  TRAFFIC_FLOW_RADIUS: 2,
  TRAFFIC_FLOW_GLOW: 4,
  
  // Hover effects
  HOVER_SCALE: 1.2,
  HOVER_GLOW_BLUR: 15,
  HOVER_GLOW_OFFSET: 5,
  
  // Click tolerance
  CLICK_TOLERANCE: 10,
  
  // Colors
  COLORS: {
    // Device status colors
    ONLINE: '#28a745',
    ONLINE_GRADIENT: ['#34d058', '#28a745', '#1e7e34'],
    ONLINE_STROKE: '#1e7e34',
    
    OFFLINE: '#ffc107',
    OFFLINE_GRADIENT: ['#ffd43b', '#ffc107', '#e0a800'],
    OFFLINE_STROKE: '#e0a800',
    
    FAILED: '#dc3545',
    FAILED_GRADIENT: ['#f56565', '#dc3545', '#c82333'],
    FAILED_STROKE: '#c82333',
    
    UNKNOWN: '#6c757d',
    UNKNOWN_GRADIENT: ['#9ca3af', '#6c757d', '#545b62'],
    UNKNOWN_STROKE: '#545b62',
    
    // Connection status colors
    CONNECTION_ACTIVE: '#28a745',
    CONNECTION_INACTIVE: '#ffc107',
    CONNECTION_FAILED: '#dc3545',
    CONNECTION_DEFAULT: '#6c757d',
    
    // Traffic flow
    TRAFFIC_FLOW: '#007bff',
    
    // Text colors
    TEXT_PRIMARY: '#333',
    TEXT_SECONDARY: '#666',
    TEXT_WHITE: 'white',
    
    // Effects
    SHADOW_COLOR: 'rgba(0, 0, 0, 0.3)',
    SHADOW_BLUR: 8,
    SHADOW_OFFSET_X: 2,
    SHADOW_OFFSET_Y: 2
  },
  
  // Font settings
  FONTS: {
    PRIMARY: 'Arial',
    MONOSPACE: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace"
  }
} as const;

export const DEVICE_ICONS = {
  ROUTER: 'R',
  SWITCH: 'S',
  SERVER: 'SV',
  FIREWALL: 'F',
  LOAD_BALANCER: 'LB',
  DEFAULT: 'D'
} as const;

export const ANIMATION_TIMING = {
  EASE_IN_OUT_CUBIC: (t: number): number => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  LERP: (start: number, end: number, factor: number): number => start + (end - start) * factor
} as const;
