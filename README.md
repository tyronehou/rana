# Rana

A sleek TypeScript PDF viewer application built with React and Vite. Available as both a web application and a native desktop app powered by Electron.

## Features

- 📄 Open and view PDF documents
- 🔖 Bookmark management and navigation
- 🖼️ Thumbnail preview panel
- 🔍 Zoom controls with keyboard shortcuts
- 🖨️ Print support (Ctrl+P)
- ⌨️ Comprehensive keyboard shortcuts
- 🖥️ **NEW: Native desktop application (Electron)**
- 🌙 Modern, dark-themed UI

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **react-pdf** - PDF rendering (powered by PDF.js)
- **Electron** - Desktop application framework
- **pdf-lib** - PDF manipulation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Running the Application

#### Web Version
```bash
# Start development server
npm run dev
```
The app will be available at `http://localhost:5000`

#### Desktop Version (Electron)
```bash
# Start Electron app
npm run dev:electron
```
Opens in a native desktop window

### Building for Production

#### Web Build
```bash
npm run build
```
Output: `dist/` directory

#### Desktop Build (Electron)
```bash
npm run build:electron
```
Output: `release/` directory with platform-specific installers

For detailed Electron information, see [ELECTRON.md](./ELECTRON.md)

## Usage

1. Click the "Open PDF" button in the header
2. Select a PDF file from your local filesystem
3. Navigate using Previous/Next buttons or scroll in continuous mode
4. Use the sidebar to view bookmarks and thumbnails
5. Add, edit, and remove bookmarks
6. Save PDF with bookmarks embedded

### Keyboard Shortcuts

- `Ctrl/Cmd + O` - Open PDF file
- `Ctrl/Cmd + S` - Save PDF with bookmarks
- `Ctrl/Cmd + P` - Print PDF
- `Ctrl/Cmd + B` - Toggle sidebar panel
- `Ctrl/Cmd + +` - Zoom in
- `Ctrl/Cmd + -` - Zoom out
- `Ctrl/Cmd + Scroll` - Zoom with mouse wheel

## Project Structure

```
funky_pdf/
├── src/
│   ├── components/
│   │   ├── PDFUploader.tsx    # File upload button component
│   │   └── PDFViewer.tsx      # PDF display and navigation
│   ├── App.tsx                # Main application component
│   ├── App.css                # Application styles
│   ├── main.tsx               # Application entry point
│   └── vite-env.d.ts          # Vite type declarations
├── public/                    # Static assets
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
└── README.md
```

## License

MIT
