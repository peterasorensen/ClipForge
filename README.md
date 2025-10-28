# Clip Forge

A modern, professional screen recording application built with Electron, React, and TypeScript. Inspired by Screen Studio, Clip Forge provides an intuitive interface for capturing your screen, windows, or custom areas with high-quality output.

![Clip Forge](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Recording Modes
- **Display Recording** - Capture your entire screen or specific display
- **Window Recording** - Record individual application windows with automatic detection
- **Area Recording** - Select custom rectangular areas with live dimension display
- **Device Recording** - Connect and record from external devices (iOS/Android)

### Audio & Video
- **Microphone Audio** - Toggle microphone input on/off
- **Camera Support** - Add webcam overlay to recordings (coming soon)
- **High-Quality Output** - VP9/VP8 codec with configurable bitrates

### Professional UI
- **Always-On-Top Control Bar** - Floating horizontal toolbar that stays accessible
- **Glassmorphism Design** - Modern dark theme with purple/blue accents
- **Smooth Animations** - Polished transitions and hover effects
- **SVG Icons** - Crisp, scalable interface elements

### Recording Controls
- **Pause/Resume** - Temporarily pause recording without stopping
- **Restart** - Quickly restart the current recording
- **Timer** - Live recording duration display
- **Finish & Save** - Export directly to your chosen location

## Prerequisites

Before running Clip Forge, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **FFmpeg** (optional, for future export features)
   ```bash
   # macOS
   brew install ffmpeg

   # Verify installation
   ffmpeg -version
   ```

## Installation

1. **Clone or navigate to the project**
   ```bash
   cd /Users/Apple/workspace/gauntlet/clip-forge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

## Usage

### Starting a Recording

1. **Launch the app** - The floating control bar appears at the top of your screen
2. **Choose your recording mode**:
   - Click **Display** to record your entire screen
   - Click **Window** to select a specific application window
   - Click **Area** to draw a custom recording region

3. **Configure audio** (optional):
   - Toggle the microphone icon to enable/disable audio input
   - Toggle the camera icon to enable/disable webcam (coming soon)

4. **Select your target**:
   - For **Area**: Click and drag to create a selection box, then click "Start Recording"
   - For **Window**: Click on a window thumbnail to select it
   - For **Display**: Choose your display from the grid

### During Recording

Once recording starts, a floating toolbar appears at the bottom with these controls:

- **Timer** - Shows current recording duration (MM:SS)
- **Pause/Resume** - Temporarily pause without stopping
- **Restart** - Discard current recording and start fresh
- **Finish** - Stop recording and save to file

### Saving Your Recording

1. Click **Finish** on the recording toolbar
2. Choose a save location in the file dialog
3. Your recording is saved as an MP4 file

## Keyboard Shortcuts

- **Esc** - Cancel selection mode and return to control bar
- **Space** - Start/stop recording (coming soon)

## Project Structure

```
clip-forge/
├── src/
│   ├── main/
│   │   ├── main.ts           # Electron main process
│   │   └── preload.ts         # Preload script for IPC
│   └── renderer/
│       ├── components/
│       │   ├── ControlBar.tsx      # Main floating toolbar
│       │   ├── SelectionWindow.tsx # Area/window/display selection
│       │   ├── RecordingToolbar.tsx # Recording controls
│       │   └── Icons.tsx           # SVG icon components
│       ├── hooks/
│       │   └── useRecording.ts # Recording logic hook
│       ├── App.tsx           # Root component with routing
│       ├── store.ts          # Zustand state management
│       ├── theme.ts          # Design tokens and theme
│       ├── GlobalStyles.tsx  # Global CSS styles
│       └── index.tsx         # React entry point
├── package.json
├── tsconfig.json
├── forge.config.ts           # Electron Forge configuration
└── README.md
```

## Technology Stack

- **Electron** - Cross-platform desktop application framework
- **React** - UI component library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool and dev server
- **Styled Components** - CSS-in-JS styling
- **Zustand** - Lightweight state management
- **Electron Forge** - Build and packaging tool
- **desktopCapturer API** - Screen/window capture
- **MediaRecorder API** - Video recording

## Development

### Available Scripts

```bash
# Start development server
npm start

# Type check
npx tsc --noEmit

# Build for production
npm run package

# Create distributable
npm run make
```

### Development Mode

When running in development mode with Vite:
- DevTools automatically open for debugging
- Lightning-fast hot module replacement (HMR)
- Instant server start
- Source maps are available for easier debugging

## Troubleshooting

### Screen Recording Permissions

On macOS, you may need to grant screen recording permissions:
1. Go to **System Settings** > **Privacy & Security** > **Screen Recording**
2. Enable permissions for **Electron** or your app

### Microphone Permissions

For audio recording:
1. Go to **System Settings** > **Privacy & Security** > **Microphone**
2. Enable permissions for **Electron** or your app

### FFmpeg Not Found

If you see FFmpeg-related warnings:
```bash
# Install FFmpeg
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### Build Errors

If you encounter build errors:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

## Roadmap

### Current Features (MVP)
- ✅ Floating control bar with recording modes
- ✅ Area selection with dimension display
- ✅ Window selection with thumbnails
- ✅ Display selection
- ✅ Microphone audio capture
- ✅ Recording toolbar with pause/resume
- ✅ Direct file export

### Coming Soon
- 🚧 Video editor with timeline
- 🚧 Webcam overlay (picture-in-picture)
- 🚧 Trim and cut functionality
- 🚧 Text overlays and annotations
- 🚧 Transitions and effects
- 🚧 Export presets for different platforms
- 🚧 Cloud storage integration
- 🚧 Keyboard shortcuts
- 🚧 Settings panel

## Known Issues

- Area recording currently captures the full screen (cropping in editor planned)
- Camera overlay is not yet implemented
- No video editor yet (direct export only)
- Pause functionality may have slight audio sync issues

## Contributing

This project is currently in active development. Contributions, issues, and feature requests are welcome!

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Inspired by [Screen Studio](https://www.screen.studio/)
- Built as part of the Gauntlet video editor challenge
- Icons adapted from [Feather Icons](https://feathericons.com/)

---

**Built with ❤️ by the Clip Forge team**
