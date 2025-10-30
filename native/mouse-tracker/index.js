try {
  module.exports = require('./build/Release/mouse_tracker.node');
} catch (e) {
  console.error('Failed to load mouse_tracker native addon:', e.message);
  // Provide stub implementations for development on non-Mac platforms
  module.exports = {
    startTracking: () => false,
    stopTracking: () => {},
    getPositions: () => [],
    clearPositions: () => {},
    isTracking: () => false,
  };
}
