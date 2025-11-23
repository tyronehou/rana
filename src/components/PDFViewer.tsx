import { useRef, useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Bookmark } from './SidebarPanel'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface OutlineItem {
  title: string
  dest: string | unknown[] | null
  items: OutlineItem[]
}

async function processOutline(
  pdf: PDFDocumentProxy,
  items: OutlineItem[] | null,
  idPrefix = 'pdf'
): Promise<Bookmark[]> {
  if (!items || items.length === 0) return []

  const bookmarks: Bookmark[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    let page = 1

    if (item.dest) {
      try {
        let destArray: unknown = item.dest
        if (typeof destArray === 'string') {
          destArray = await pdf.getDestination(destArray)
        }
        if (Array.isArray(destArray) && destArray[0]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pageIndex = await pdf.getPageIndex(destArray[0] as any)
          page = pageIndex + 1
        }
      } catch {
        // Keep default page 1 if destination resolution fails
      }
    }

    const id = `${idPrefix}-${i}`
    const children = await processOutline(pdf, item.items, id)

    bookmarks.push({
      id,
      page,
      label: item.title,
      children: children.length > 0 ? children : undefined,
      expanded: true,
    })
  }

  return bookmarks
}

interface PDFViewerProps {
  file: File | null
  pageNumber: number
  numPages: number
  onDocumentLoad: (numPages: number) => void
  onOutlineLoad: (bookmarks: Bookmark[]) => void
  onPrevPage: () => void
  onNextPage: () => void
}

export function PDFViewer({
  file,
  pageNumber,
  numPages,
  onDocumentLoad,
  onOutlineLoad,
  onPrevPage,
  onNextPage,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [continuousMode, setContinuousMode] = useState(false)

  const handleLoadSuccess = async (pdf: PDFDocumentProxy) => {
    onDocumentLoad(pdf.numPages)

    try {
      const outline = await pdf.getOutline()
      const bookmarks = await processOutline(pdf, outline as OutlineItem[] | null)
      onOutlineLoad(bookmarks)
    } catch {
      onOutlineLoad([])
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container || continuousMode) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY > 0) {
        onNextPage()
      } else if (e.deltaY < 0) {
        onPrevPage()
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [onNextPage, onPrevPage, continuousMode])

  if (!file) {
    return (
      <div className="pdf-viewer pdf-viewer--empty">
        <p>No PDF loaded. Click "Upload PDF" to get started.</p>
      </div>
    )
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <button onClick={onPrevPage} disabled={pageNumber <= 1}>
          Previous
        </button>
        <span>
          Page {pageNumber} of {numPages}
        </span>
        <button onClick={onNextPage} disabled={pageNumber >= numPages}>
          Next
        </button>
      </div>
      <div className={`pdf-document ${continuousMode ? 'pdf-document--continuous' : ''}`} ref={containerRef}>
        <Document file={file} onLoadSuccess={handleLoadSuccess}>
          {continuousMode ? (
            Array.from({ length: numPages }, (_, i) => (
              <Page key={i + 1} pageNumber={i + 1} />
            ))
          ) : (
            <Page pageNumber={pageNumber} />
          )}
        </Document>
      </div>
      <div className="display-mode-container">
        <span className="display-mode-label">
          display mode: {continuousMode ? 'continuous' : 'single page'}
        </span>
        <button
          className={`display-mode-toggle ${continuousMode ? 'display-mode-toggle--active' : ''}`}
          onClick={() => setContinuousMode(!continuousMode)}
          title={continuousMode ? 'Single page view' : 'Continuous view'}
        >
          {continuousMode ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M4 2h16v6H4V2zm0 8h16v6H4v-6zm0 8h16v6H4v-6z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
