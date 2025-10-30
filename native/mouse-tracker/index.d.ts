export interface MousePosition {
  x: number;
  y: number;
  timestamp: number; // milliseconds since tracking started
}

export function startTracking(): boolean;
export function stopTracking(): void;
export function getPositions(): MousePosition[];
export function clearPositions(): void;
export function isTracking(): boolean;
