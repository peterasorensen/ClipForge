export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowInfo {
  windowNumber: number;
  ownerName: string;
  name: string;
  pid: number;
  bounds: WindowBounds;
}

/**
 * Get all on-screen, non-minimized windows sorted by z-order (top to bottom)
 * Only returns windows at layer 0 (normal application windows)
 */
export function getOnScreenWindows(): WindowInfo[];

/**
 * Hit-test to find the topmost window at the given screen coordinates
 * @param x Screen x coordinate
 * @param y Screen y coordinate
 * @returns WindowInfo object if a window is found, empty object otherwise
 */
export function getWindowAtPoint(x: number, y: number): WindowInfo | {};
