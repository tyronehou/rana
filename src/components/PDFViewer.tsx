import { useRef, useEffect, useState, KeyboardEvent } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Bookmark } from './SidebarPanel'
import { SinglePageIcon, ContinuousViewIcon, HandIcon, CloseIcon } from '../resources/svg'

interface PDFMetadata {
  title?: string
  author?: string
  subject?: string
  keywords?: string
  creator?: string
  producer?: string
  creationDate?: string
  modificationDate?: string
  pdfVersion?: string
  other?: Record<string, string>
}

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
  zoom: number
  onDocumentLoad: (numPages: number) => void
  onOutlineLoad: (bookmarks: Bookmark[]) => void
  onTitleLoad: (title: string) => void
  onPrevPage: () => void
  onNextPage: () => void
  onZoomChange: (delta: number) => void
  onPageChange: (page: number) => void
  showProperties: boolean
  onToggleProperties: (show: boolean) => void
}

export function PDFViewer({
  file,
  pageNumber,
  numPages,
  zoom,
  onDocumentLoad,
  onOutlineLoad,
  onTitleLoad,
  onPrevPage,
  onNextPage,
  onZoomChange,
  onPageChange,
  showProperties,
  onToggleProperties,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [continuousMode, setContinuousMode] = useState(false)
  const [isEditingPage, setIsEditingPage] = useState(false)
  const [pageInputValue, setPageInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [panMode, setPanMode] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 })
  const [metadata, setMetadata] = useState<PDFMetadata | null>(null)

  const handleLoadSuccess = async (pdf: PDFDocumentProxy) => {
    onDocumentLoad(pdf.numPages)

    // Extract PDF metadata
    try {
      const pdfMetadata = await pdf.getMetadata()
      const info = pdfMetadata.info as any

      // Format dates if available
      const formatDate = (dateStr?: string) => {
        if (!dateStr) return undefined
        try {
          // PDF dates are in format D:YYYYMMDDHHmmSS
          const match = dateStr.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/)
          if (match) {
            const [, year, month, day, hour, minute, second] = match
            return new Date(+year, +month - 1, +day, +hour, +minute, +second).toLocaleString()
          }
          return dateStr
        } catch {
          return dateStr
        }
      }

      // Extract known metadata fields
      const knownFields = [
        'Title', 'Author', 'Subject', 'Keywords',
        'Creator', 'Producer', 'CreationDate', 'ModDate'
      ]

      // Collect any other metadata fields not in the known list
      const otherMetadata: Record<string, string> = {}
      if (info) {
        Object.keys(info).forEach((key) => {
          if (!knownFields.includes(key) && info[key]) {
            const value = info[key]
            // Convert to string if it's not already
            otherMetadata[key] = typeof value === 'string' ? value : String(value)
          }
        })
      }

      const extractedMetadata: PDFMetadata = {
        title: info?.Title || file?.name || 'Untitled PDF',
        author: info?.Author,
        subject: info?.Subject,
        keywords: info?.Keywords,
        creator: info?.Creator,
        producer: info?.Producer,
        creationDate: formatDate(info?.CreationDate),
        modificationDate: formatDate(info?.ModDate),
        pdfVersion: pdfMetadata.metadata?.get('pdf:PDFVersion') || pdf.fingerprints?.[0],
        other: Object.keys(otherMetadata).length > 0 ? otherMetadata : undefined,
      }

      setMetadata(extractedMetadata)
      onTitleLoad(extractedMetadata.title || 'Untitled PDF')
    } catch {
      onTitleLoad(file?.name || 'Untitled PDF')
    }

    // Extract outline/bookmarks
    try {
      const outline = await pdf.getOutline()
      const bookmarks = await processOutline(pdf, outline as OutlineItem[] | null)
      onOutlineLoad(bookmarks)
    } catch {
      onOutlineLoad([])
    }
  }

  const handlePageClick = () => {
    setIsEditingPage(true)
    setPageInputValue(pageNumber.toString())
  }

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value)
  }

  const handlePageInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newPage = parseInt(pageInputValue, 10)
      if (!isNaN(newPage) && newPage >= 1 && newPage <= numPages) {
        onPageChange(newPage)
      }
      setIsEditingPage(false)
    } else if (e.key === 'Escape') {
      setIsEditingPage(false)
    }
  }

  const handlePageInputBlur = () => {
    const newPage = parseInt(pageInputValue, 10)
    if (!isNaN(newPage) && newPage >= 1 && newPage <= numPages) {
      onPageChange(newPage)
    }
    setIsEditingPage(false)
  }

  useEffect(() => {
    if (isEditingPage && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingPage])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panMode || !containerRef.current) return

    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setScrollStart({
      x: containerRef.current.scrollLeft,
      y: containerRef.current.scrollTop,
    })
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return

    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    containerRef.current.scrollLeft = scrollStart.x - dx
    containerRef.current.scrollTop = scrollStart.y - dy
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1
        onZoomChange(zoomDelta)
      } else if (!continuousMode && !panMode) {
        // In single page mode, allow scrolling within the page first
        const scrollTop = container.scrollTop
        const scrollHeight = container.scrollHeight
        const clientHeight = container.clientHeight

        const isAtTop = scrollTop === 0
        const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1

        if (e.deltaY > 0) {
          // Scrolling down
          if (isAtBottom) {
            e.preventDefault()
            onNextPage()
            // Reset scroll to top when moving to next page
            setTimeout(() => {
              if (container) container.scrollTop = 0
            }, 0)
          }
        } else if (e.deltaY < 0) {
          // Scrolling up
          if (isAtTop) {
            e.preventDefault()
            onPrevPage()
            // Scroll to bottom when moving to previous page
            setTimeout(() => {
              if (container) container.scrollTop = container.scrollHeight
            }, 0)
          }
        }
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [onNextPage, onPrevPage, onZoomChange, continuousMode, panMode])

  if (!file) {
    return (
      <div className="pdf-viewer pdf-viewer--empty">
        <p>No PDF loaded. Click "Open PDF" to get started.</p>
      </div>
    )
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <button
          className={`hand-tool-button ${panMode ? 'hand-tool-button--active' : ''}`}
          onClick={() => setPanMode(!panMode)}
          title={panMode ? 'Disable hand tool' : 'Enable hand tool'}
        >
          <HandIcon />
        </button>
        <button onClick={onPrevPage} disabled={pageNumber <= 1}>
          Previous
        </button>
        {isEditingPage ? (
          <span className="page-indicator">
            Page{' '}
            <input
              ref={inputRef}
              type="text"
              className="page-input"
              value={pageInputValue}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyDown}
              onBlur={handlePageInputBlur}
            />{' '}
            of {numPages}
          </span>
        ) : (
          <span
            className="page-indicator page-indicator-clickable"
            onClick={handlePageClick}
            title="Click to jump to page"
          >
            Page {pageNumber} of {numPages}
          </span>
        )}
        <button onClick={onNextPage} disabled={pageNumber >= numPages}>
          Next
        </button>
      </div>
      <div
        className={`pdf-document ${continuousMode ? 'pdf-document--continuous' : ''} ${panMode ? 'pdf-document--pan-mode' : ''} ${isDragging ? 'pdf-document--dragging' : ''}`}
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <Document file={file} onLoadSuccess={handleLoadSuccess}>
          {continuousMode ? (
            Array.from({ length: numPages }, (_, i) => (
              <Page key={i + 1} pageNumber={i + 1} scale={zoom} />
            ))
          ) : (
            <Page pageNumber={pageNumber} scale={zoom} />
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
          {continuousMode ? <SinglePageIcon /> : <ContinuousViewIcon />}
        </button>
      </div>

      {showProperties && metadata && (
        <div className="properties-modal-overlay" onClick={() => onToggleProperties(false)}>
          <div className="properties-modal" onClick={(e) => e.stopPropagation()}>
            <div className="properties-modal-header">
              <h2>Document Properties</h2>
              <button
                className="properties-modal-close"
                onClick={() => onToggleProperties(false)}
                title="Close"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="properties-modal-content">
              {metadata.title && (
                <div className="property-row">
                  <span className="property-label">Title:</span>
                  <span className="property-value">{metadata.title}</span>
                </div>
              )}
              {metadata.author && (
                <div className="property-row">
                  <span className="property-label">Author:</span>
                  <span className="property-value">{metadata.author}</span>
                </div>
              )}
              {metadata.subject && (
                <div className="property-row">
                  <span className="property-label">Subject:</span>
                  <span className="property-value">{metadata.subject}</span>
                </div>
              )}
              {metadata.keywords && (
                <div className="property-row">
                  <span className="property-label">Keywords:</span>
                  <span className="property-value">{metadata.keywords}</span>
                </div>
              )}
              {metadata.creator && (
                <div className="property-row">
                  <span className="property-label">Creator:</span>
                  <span className="property-value">{metadata.creator}</span>
                </div>
              )}
              {metadata.producer && (
                <div className="property-row">
                  <span className="property-label">Producer:</span>
                  <span className="property-value">{metadata.producer}</span>
                </div>
              )}
              {metadata.creationDate && (
                <div className="property-row">
                  <span className="property-label">Created:</span>
                  <span className="property-value">{metadata.creationDate}</span>
                </div>
              )}
              {metadata.modificationDate && (
                <div className="property-row">
                  <span className="property-label">Modified:</span>
                  <span className="property-value">{metadata.modificationDate}</span>
                </div>
              )}
              {metadata.pdfVersion && (
                <div className="property-row">
                  <span className="property-label">PDF Version:</span>
                  <span className="property-value">{metadata.pdfVersion}</span>
                </div>
              )}
              <div className="property-row">
                <span className="property-label">Pages:</span>
                <span className="property-value">{numPages}</span>
              </div>
              {file && (
                <div className="property-row">
                  <span className="property-label">File Size:</span>
                  <span className="property-value">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}

              {metadata.other && Object.keys(metadata.other).length > 0 && (
                <>
                  <div className="property-section-header">
                    <h3>Other Metadata</h3>
                  </div>
                  {Object.entries(metadata.other).map(([key, value]) => (
                    <div className="property-row" key={key}>
                      <span className="property-label">{key}:</span>
                      <span className="property-value">{value}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
