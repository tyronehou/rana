# Rana - Electron Desktop Application

Rana has been successfully converted to an Electron desktop application! This document explains how to use, develop, and build the desktop version.

## What's New

The application now runs as a native desktop app with:
- Native window management
- Desktop file dialogs
- Offline functionality
- Better performance
- Cross-platform support (Windows, macOS, Linux)

## Project Structure

```
rana/
├── electron/
│   ├── main.ts         # Electron main process (app lifecycle)
│   └── preload.ts      # Preload script (secure IPC bridge)
├── src/                # React application (unchanged)
├── public/             # Static assets
├── dist/               # Web build output
├── dist-electron/      # Electron build output
└── release/            # Packaged applications
```

## Development

### Run as Web App (Original)
```bash
npm run dev
```
Opens at http://localhost:5000

### Run as Electron App (Desktop)
```bash
npm run dev:electron
```
Opens in a native desktop window with developer tools

## Building

### Build Web Version
```bash
npm run build
```
Outputs to `dist/` directory

### Build Electron App
```bash
npm run build:electron
```
Creates platform-specific installers in `release/` directory:
- **Windows**: `.exe` installer (NSIS)
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` executable

## Key Features

### Electron-Specific Features
1. **Native File Dialogs**: Uses system file picker instead of browser file input
2. **Window Management**: Custom window controls and frame
3. **Offline Support**: Works completely offline
4. **Performance**: Better resource management than browser version

### Preserved Features
All existing features work in Electron:
- PDF viewing and navigation
- Bookmarks panel
- Thumbnails
- Zoom controls
- Print support
- Keyboard shortcuts

## Architecture

### Main Process (`electron/main.ts`)
- Creates and manages application windows
- Handles system-level events
- Provides IPC handlers for native dialogs
- Manages app lifecycle

### Preload Script (`electron/preload.ts`)
- Secure bridge between main and renderer processes
- Exposes limited APIs to the web app via `contextBridge`
- Maintains security through context isolation

### Renderer Process (`src/`)
- Your React application (unchanged)
- Runs in isolated context
- Communicates with main process via IPC

## Configuration

### Vite Configuration
The `vite.config.ts` now supports dual modes:
- **Web mode**: `npm run dev` - Standard web build
- **Electron mode**: `npm run dev:electron` - Electron-optimized build

### Package Configuration
`package.json` includes:
- `main`: Entry point for Electron
- `build`: electron-builder configuration for packaging
- Platform-specific build targets

## Security

The application follows Electron security best practices:
- ✅ Context isolation enabled
- ✅ Node integration disabled in renderer
- ✅ Preload script for controlled IPC
- ✅ Content Security Policy ready

## Platform Support

### Windows
- Builds to NSIS installer (`.exe`)
- Auto-updater ready

### macOS
- Builds to DMG disk image
- Code signing ready (requires Apple Developer account)

### Linux
- Builds to AppImage (universal Linux format)
- Also supports Snap, deb, rpm (configure in package.json)

## Development Tips

1. **Hot Reload**: Changes to `src/` hot reload automatically
2. **Electron Changes**: Changes to `electron/` require restart
3. **Debug**: Dev mode opens DevTools by default
4. **Platform Building**: Cross-platform builds require platform-specific tools

## Troubleshooting

### Port Already in Use
Vite automatically tries alternative ports (5001, 5002, etc.)

### Build Errors
1. Clear build cache: `rm -rf dist dist-electron`
2. Reinstall dependencies: `npm install`
3. Rebuild: `npm run build:electron`

### WSL/Linux Display Issues
If running on WSL, install an X server:
```bash
# Install VcXsrv or X410 on Windows
# Set DISPLAY environment variable
export DISPLAY=:0
```

## Next Steps

### Optional Enhancements
1. **Auto-Updates**: Configure electron-updater for automatic updates
2. **Code Signing**: Sign app for macOS and Windows
3. **Custom Menus**: Add native menu bar
4. **System Tray**: Add tray icon and minimize to tray
5. **Native Notifications**: Use Electron's notification API

## License

Same as the main Rana project.
