# RPDF

**R**ana **PDF** reader - A sleek TypeScript PDF viewer application built with React and Vite, themed after poison dart frogs.

## Features

- Upload PDF files from your local directory
- View PDF documents in a responsive viewport
- Navigate between pages with previous/next controls
- Modern, dark-themed UI

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **react-pdf** - PDF rendering (powered by PDF.js)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. Click the "Upload PDF" button in the header
2. Select a PDF file from your local filesystem
3. Use the Previous/Next buttons to navigate between pages

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
