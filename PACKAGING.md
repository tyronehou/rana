# Packaging Rana for Distribution

This guide explains how to create distributable installers for Rana on different operating systems.

## Quick Start

### Build for Your Current OS
```bash
npm run build:electron
```

The installer will be created in `release/1.0.0/`

## Platform-Specific Builds

### Windows (.exe installer)

**On Windows:**
```bash
npm run build:electron
```

**Output:** `release/1.0.0/Rana Setup 1.0.0.exe`

**Cross-platform build (from macOS/Linux):**
```bash
npm run build:electron -- --win
```

**Note:** Building for Windows on other platforms requires Wine on Linux or macOS.

---

### macOS (.dmg disk image)

**On macOS:**
```bash
npm run build:electron
```

**Output:** `release/1.0.0/Rana-1.0.0.dmg`

**Cross-platform build:**
```bash
npm run build:electron -- --mac
```

**Note:** Building .dmg on Linux/Windows is possible but limited. For code-signed apps, you must build on macOS.

---

### Linux (.AppImage universal package)

**On Linux:**
```bash
npm run build:electron
```

**Output:** `release/1.0.0/Rana-1.0.0.AppImage`

**Cross-platform build:**
```bash
npm run build:electron -- --linux
```

**Additional Linux formats:**
```bash
# Build .deb package (Debian/Ubuntu)
npm run build:electron -- --linux deb

# Build .rpm package (Fedora/RedHat)
npm run build:electron -- --linux rpm

# Build Snap package
npm run build:electron -- --linux snap
```

---

## Building for Multiple Platforms

### Build for All Platforms
```bash
npm run build:electron -- -mwl
```

**Flags:**
- `-m` = macOS
- `-w` = Windows
- `-l` = Linux

### Build Specific Combinations
```bash
# Windows + Linux
npm run build:electron -- -wl

# macOS + Windows
npm run build:electron -- -mw
```

---

## Distribution Formats by Platform

### Windows
- **NSIS Installer** (`.exe`) - Default, most common
- **Portable** (`.exe`) - No installation required
- **MSI** - Enterprise deployment
- **Squirrel** - Auto-update friendly

### macOS
- **DMG** (`.dmg`) - Default, drag-to-install disk image
- **PKG** (`.pkg`) - Installer package
- **ZIP** - Compressed application bundle
- **MAS** - Mac App Store (requires Apple Developer account)

### Linux
- **AppImage** - Default, universal format (runs anywhere)
- **deb** - Debian/Ubuntu packages
- **rpm** - Fedora/RedHat packages
- **snap** - Snap packages (cross-distro)
- **tar.gz** - Compressed archive

---

## File Sizes (Approximate)

- Windows (.exe): ~150-200 MB
- macOS (.dmg): ~150-200 MB
- Linux (.AppImage): ~150-200 MB

These include Electron runtime and your application code.

---

## Distribution Checklist

Before distributing your app:

- [ ] Test the installer on a clean machine
- [ ] Verify app launches without errors
- [ ] Test PDF opening and saving functionality
- [ ] Check all keyboard shortcuts work
- [ ] Verify bookmarks and thumbnails function
- [ ] Test print functionality
- [ ] Update version number in `package.json`
- [ ] Update changelog/release notes

---

## Advanced: Custom Build Configuration

### Change Output Formats

Edit `package.json` build section:

```json
{
  "build": {
    "win": {
      "target": ["nsis", "portable"]  // Multiple formats
    },
    "mac": {
      "target": ["dmg", "zip"]
    },
    "linux": {
      "target": ["AppImage", "deb", "rpm"]
    }
  }
}
```

### Custom Installer Options

**Windows (NSIS):**
```json
{
  "build": {
    "win": {
      "target": ["nsis"],
      "nsis": {
        "oneClick": false,              // Allow custom install location
        "allowToChangeInstallationDirectory": true,
        "createDesktopShortcut": true,
        "createStartMenuShortcut": true
      }
    }
  }
}
```

**macOS:**
```json
{
  "build": {
    "mac": {
      "target": ["dmg"],
      "category": "public.app-category.productivity",
      "darkModeSupport": true
    }
  }
}
```

**Linux:**
```json
{
  "build": {
    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Office",
      "desktop": {
        "Name": "Rana PDF Viewer",
        "Comment": "A modern PDF viewer",
        "Categories": "Office;Viewer;"
      }
    }
  }
}
```

---

## Code Signing (Optional but Recommended)

### Why Code Sign?
- **Windows:** Prevents SmartScreen warnings
- **macOS:** Required for Gatekeeper, prevents "unidentified developer" warnings
- **Trust:** Users know the app comes from you

### Windows Code Signing

1. Purchase a code signing certificate
2. Install the certificate
3. Add to `package.json`:
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "password"
    }
  }
}
```

### macOS Code Signing

1. Join Apple Developer Program ($99/year)
2. Get Developer ID Certificate
3. Add to `package.json`:
```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAMID)",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    }
  }
}
```

---

## Auto-Updates (Optional)

electron-builder supports auto-updates. To enable:

1. Choose update provider (GitHub Releases, S3, etc.)
2. Add to `package.json`:
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "rana"
    }
  }
}
```

3. Implement update checking in `electron/main.ts`

---

## Troubleshooting

### Build Fails

**Clear cache and rebuild:**
```bash
rm -rf node_modules dist dist-electron release
npm install
npm run build:electron
```

### "Application is damaged" (macOS)

The app isn't code-signed. Either:
- Sign the app (see Code Signing above)
- Users can right-click → Open to bypass Gatekeeper

### "Windows protected your PC" (Windows)

The app isn't code-signed. Users can click "More info" → "Run anyway"

### AppImage Won't Run (Linux)

Make it executable:
```bash
chmod +x Rana-1.0.0.AppImage
./Rana-1.0.0.AppImage
```

---

## Hosting Your Releases

### GitHub Releases (Recommended)
1. Create a new release on GitHub
2. Upload the installer files
3. Users download from Releases page

### Self-Hosting
1. Upload to your server
2. Provide download links on your website
3. Consider using a CDN for better download speeds

### Update Channels
- **Stable:** Main releases (1.0.0, 1.1.0)
- **Beta:** Preview releases (1.1.0-beta.1)
- **Nightly:** Daily builds (automated)

---

## Example: Complete Release Workflow

```bash
# 1. Update version
npm version 1.1.0

# 2. Build for all platforms
npm run build:electron -- -mwl

# 3. Test installers on each platform

# 4. Create GitHub release
git tag v1.1.0
git push origin v1.1.0

# 5. Upload installers to GitHub Releases

# 6. Announce release to users
```

---

## Summary

**For most users:**
```bash
npm run build:electron
```

**For distributing to others:**
- Windows users: Give them the `.exe` file
- macOS users: Give them the `.dmg` file
- Linux users: Give them the `.AppImage` file

All installers will be in `release/1.0.0/` after building.
