import { useState, useEffect, useCallback, useRef } from 'react'
import { PDFUploader, PDFUploaderRef } from './components/PDFUploader'
import { PDFViewer } from './components/PDFViewer'
import { Sidebar } from './components/Sidebar'
import { SidebarPanel, PanelType, Bookmark } from './components/SidebarPanel'
import { addBookmarksToPdf, downloadPdf } from './utils/pdfBookmarks'
import { FrogIcon, ZoomOutIcon, ZoomInIcon, ZoomResetIcon, SaveIcon, SettingsIcon } from './resources/svg'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3.0
const ZOOM_STEP = 0.25

function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [numPages, setNumPages] = useState<number>(0)
  const [activePanel, setActivePanel] = useState<PanelType>(null)
  const [lastOpenedPanel, setLastOpenedPanel] = useState<Exclude<PanelType, null>>('bookmarks')
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [zoom, setZoom] = useState<number>(1.0)
  const [pdfTitle, setPdfTitle] = useState<string>('')
  const [showProperties, setShowProperties] = useState(false)
  const [isEditingZoom, setIsEditingZoom] = useState(false)
  const [zoomInputValue, setZoomInputValue] = useState('')
  const pdfUploaderRef = useRef<PDFUploaderRef>(null)
  const zoomInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File, handle: FileSystemFileHandle | null) => {
    setPdfFile(file)
    setFileHandle(handle)
    setPageNumber(1)
    setNumPages(0)
    setBookmarks([])
    setPdfTitle('')
  }

  const addBookmark = (page: number, label?: string) => {
    const exists = bookmarks.some((b) => b.page === page)
    if (!exists) {
      const newBookmark: Bookmark = {
        id: Date.now().toString(),
        page,
        label: label || `Page ${page}`,
      }
      setBookmarks((prev) => [...prev, newBookmark].sort((a, b) => a.page - b.page))
    }
  }

  const handleSavePdf = async () => {
    await saveBookmarksToPdf(bookmarks)
  }

  const saveBookmarksToPdf = async (updatedBookmarks: Bookmark[]) => {
    if (!pdfFile) return
    try {
      const pdfBytes = await addBookmarksToPdf(pdfFile, updatedBookmarks)

      if (fileHandle) {
        const writable = await fileHandle.createWritable()
        await writable.write(pdfBytes as BlobPart)
        await writable.close()
        const updatedFile = await fileHandle.getFile()
        setPdfFile(updatedFile)
      } else {
        downloadPdf(pdfBytes, pdfFile.name)
      }
    } catch (error) {
      console.error('Failed to save PDF:', error)
    }
  }

  const removeBookmark = (id: string) => {
    const removeFromList = (list: Bookmark[]): Bookmark[] => {
      return list
        .filter((b) => b.id !== id)
        .map((b) => ({
          ...b,
          children: b.children ? removeFromList(b.children) : undefined,
        }))
    }
    setBookmarks((prev) => removeFromList(prev))
  }

  const renameBookmark = (id: string, newLabel: string) => {
    const renameInList = (list: Bookmark[]): Bookmark[] => {
      return list.map((b) => {
        if (b.id === id) {
          return { ...b, label: newLabel }
        }
        if (b.children) {
          return { ...b, children: renameInList(b.children) }
        }
        return b
      })
    }
    setBookmarks((prev) => renameInList(prev))
  }

  const toggleExpanded = (id: string) => {
    const toggleInList = (list: Bookmark[]): Bookmark[] => {
      return list.map((b) => {
        if (b.id === id) {
          return { ...b, expanded: !(b.expanded ?? true) }
        }
        if (b.children) {
          return { ...b, children: toggleInList(b.children) }
        }
        return b
      })
    }
    setBookmarks((prev) => toggleInList(prev))
  }

  const handleDocumentLoad = (pages: number) => {
    setNumPages(pages)
    setPageNumber(1)
  }

  const handleOutlineLoad = (outlineBookmarks: Bookmark[]) => {
    setBookmarks(outlineBookmarks)
  }

  const handleTitleLoad = (title: string) => {
    setPdfTitle(title)
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages))
  }

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM))
  }, [])

  const handleZoomChange = useCallback((delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM))
  }, [])

  const handleZoomClick = () => {
    setIsEditingZoom(true)
    setZoomInputValue(Math.round(zoom * 100).toString())
  }

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInputValue(e.target.value)
  }

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newZoomPercent = parseInt(zoomInputValue, 10)
      if (!isNaN(newZoomPercent) && newZoomPercent >= MIN_ZOOM * 100 && newZoomPercent <= MAX_ZOOM * 100) {
        setZoom(newZoomPercent / 100)
      }
      setIsEditingZoom(false)
    } else if (e.key === 'Escape') {
      setIsEditingZoom(false)
    }
  }

  const handleZoomInputBlur = () => {
    const newZoomPercent = parseInt(zoomInputValue, 10)
    if (!isNaN(newZoomPercent) && newZoomPercent >= MIN_ZOOM * 100 && newZoomPercent <= MAX_ZOOM * 100) {
      setZoom(newZoomPercent / 100)
    }
    setIsEditingZoom(false)
  }

  const handleZoomReset = () => {
    setZoom(1.0)
  }

  const toggleLastPanel = useCallback(() => {
    if (activePanel !== null) {
      setActivePanel(null)
    } else {
      setActivePanel(lastOpenedPanel)
    }
  }, [activePanel, lastOpenedPanel])

  useEffect(() => {
    if (isEditingZoom && zoomInputRef.current) {
      zoomInputRef.current.focus()
      zoomInputRef.current.select()
    }
  }, [isEditingZoom])

  const handlePrintPdf = () => {
    if (!pdfFile) return

    const url = URL.createObjectURL(pdfFile)
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    iframe.src = url
    document.body.appendChild(iframe)

    iframe.onload = () => {
      try {
        const iframeWindow = iframe.contentWindow
        if (iframeWindow) {
          // Clean up after print dialog is closed
          iframeWindow.addEventListener('afterprint', () => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
            URL.revokeObjectURL(url)
          })

          iframeWindow.focus()
          iframeWindow.print()
        }
      } catch (error) {
        console.error('Print failed:', error)
        // Clean up on error
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
        URL.revokeObjectURL(url)
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault()
          zoomIn()
        } else if (e.key === '-') {
          e.preventDefault()
          zoomOut()
        } else if (e.key === 'o' || e.key === 'O') {
          e.preventDefault()
          pdfUploaderRef.current?.openFilePicker()
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault()
          if (pdfFile) {
            handleSavePdf()
          }
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault()
          if (pdfFile) {
            handlePrintPdf()
          }
        } else if (e.key === 'b' || e.key === 'B') {
          e.preventDefault()
          if (pdfFile) {
            toggleLastPanel()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zoomIn, zoomOut, pdfFile, toggleLastPanel])

  useEffect(() => {
    if (pdfTitle) {
      document.title = `${pdfTitle} - Rana`
    } else {
      document.title = 'Rana'
    }
  }, [pdfTitle])

  const handlePanelToggle = (panel: PanelType) => {
    if (panel !== null) {
      setLastOpenedPanel(panel)
    }
    setActivePanel(panel)
  }

  const handlePanelClose = () => {
    setActivePanel(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <FrogIcon />
          <div className="app-title">
            <h1>Rana</h1>
            {pdfTitle && (
              <span
                className="pdf-title pdf-title-clickable"
                onClick={() => setShowProperties(true)}
                title="Click to view document properties"
              >
                {pdfTitle}
              </span>
            )}
          </div>
        </div>
        <div className="header-actions">
          {pdfFile && (
            <div className="zoom-controls">
              <button
                className="zoom-button"
                onClick={handleZoomReset}
                title="Reset zoom to 100%"
              >
                <ZoomResetIcon />
              </button>
              <button
                className="zoom-button"
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                title="Zoom out (Ctrl -)"
              >
                <ZoomOutIcon />
              </button>
              {isEditingZoom ? (
                <input
                  ref={zoomInputRef}
                  type="text"
                  className="zoom-input"
                  value={zoomInputValue}
                  onChange={handleZoomInputChange}
                  onKeyDown={handleZoomInputKeyDown}
                  onBlur={handleZoomInputBlur}
                />
              ) : (
                <span
                  className="zoom-level zoom-level-clickable"
                  onClick={handleZoomClick}
                  title="Click to enter custom zoom"
                >
                  {Math.round(zoom * 100)}%
                </span>
              )}
              <button
                className="zoom-button"
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                title="Zoom in (Ctrl +)"
              >
                <ZoomInIcon />
              </button>
            </div>
          )}
          <PDFUploader ref={pdfUploaderRef} onFileSelect={handleFileSelect} />
          {pdfFile && (
            <button className="save-button" onClick={handleSavePdf} title="Save PDF with bookmarks">
              <SaveIcon />
              Save
            </button>
          )}
          <button className="settings-button" aria-label="Settings">
            <SettingsIcon />
          </button>
        </div>
      </header>
      <div className="app-body">
        <Sidebar
          activePanel={activePanel}
          onPanelToggle={handlePanelToggle}
        />
        <SidebarPanel
          activePanel={activePanel}
          onClose={handlePanelClose}
          file={pdfFile}
          numPages={numPages}
          currentPage={pageNumber}
          onPageSelect={setPageNumber}
          bookmarks={bookmarks}
          onAddBookmark={addBookmark}
          onRemoveBookmark={removeBookmark}
          onRenameBookmark={renameBookmark}
          onToggleExpanded={toggleExpanded}
        />
        <main className="app-main">
          <PDFViewer
            file={pdfFile}
            pageNumber={pageNumber}
            numPages={numPages}
            zoom={zoom}
            onDocumentLoad={handleDocumentLoad}
            onOutlineLoad={handleOutlineLoad}
            onTitleLoad={handleTitleLoad}
            onPrevPage={goToPrevPage}
            onNextPage={goToNextPage}
            onZoomChange={handleZoomChange}
            onPageChange={setPageNumber}
            showProperties={showProperties}
            onToggleProperties={setShowProperties}
          />
        </main>
      </div>
    </div>
  )
}

export default App
