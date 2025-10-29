try {
  module.exports = require('./build/Release/window_helper.node');
} catch (e) {
  // Fallback to Debug build if Release not found
  try {
    module.exports = require('./build/Debug/window_helper.node');
  } catch (e2) {
    throw new Error('Could not load window_helper native addon. Run `npm install` in native/window-helper directory.');
  }
}
