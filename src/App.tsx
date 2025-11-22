import { useState } from 'react'
import { PDFUploader } from './components/PDFUploader'
import { PDFViewer } from './components/PDFViewer'
import { Sidebar } from './components/Sidebar'
import { SidebarPanel, PanelType, Bookmark } from './components/SidebarPanel'
import { addBookmarksToPdf, downloadPdf } from './utils/pdfBookmarks'

function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [numPages, setNumPages] = useState<number>(0)
  const [activePanel, setActivePanel] = useState<PanelType>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  const handleFileSelect = (file: File, handle: FileSystemFileHandle | null) => {
    setPdfFile(file)
    setFileHandle(handle)
    setPageNumber(1)
    setNumPages(0)
    setBookmarks([])
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

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages))
  }

  const handlePanelToggle = (panel: PanelType) => {
    setActivePanel(panel)
  }

  const handlePanelClose = () => {
    setActivePanel(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <svg
            className="frog-icon"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Body */}
            <ellipse cx="32" cy="38" rx="20" ry="16" fill="#50B480" />
            {/* Head */}
            <ellipse cx="32" cy="24" rx="16" ry="12" fill="#50B480" />
            {/* Left eye bump */}
            <circle cx="22" cy="16" r="8" fill="#50B480" />
            {/* Right eye bump */}
            <circle cx="42" cy="16" r="8" fill="#50B480" />
            {/* Left eye */}
            <circle cx="22" cy="15" r="5" fill="#121212" />
            <circle cx="23" cy="14" r="2" fill="#7FD0B2" />
            {/* Right eye */}
            <circle cx="42" cy="15" r="5" fill="#121212" />
            <circle cx="43" cy="14" r="2" fill="#7FD0B2" />
            {/* Spots */}
            <circle cx="26" cy="32" r="3" fill="#121212" />
            <circle cx="38" cy="30" r="2.5" fill="#121212" />
            <circle cx="32" cy="42" r="3" fill="#121212" />
            <circle cx="24" cy="44" r="2" fill="#121212" />
            <circle cx="40" cy="44" r="2" fill="#121212" />
            {/* Front legs */}
            <ellipse cx="16" cy="48" rx="6" ry="4" fill="#50B480" />
            <ellipse cx="48" cy="48" rx="6" ry="4" fill="#50B480" />
            {/* Back legs */}
            <ellipse cx="12" cy="42" rx="5" ry="8" fill="#50B480" transform="rotate(-20 12 42)" />
            <ellipse cx="52" cy="42" rx="5" ry="8" fill="#50B480" transform="rotate(20 52 42)" />
            {/* Mouth line */}
            <path d="M24 28 Q32 32 40 28" stroke="#121212" strokeWidth="1.5" fill="none" />
          </svg>
          <h1>Rana</h1>
        </div>
        <div className="header-actions">
          <PDFUploader onFileSelect={handleFileSelect} />
          {pdfFile && (
            <button className="save-button" onClick={handleSavePdf} title="Save PDF with bookmarks">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save
            </button>
          )}
          <button className="settings-button" aria-label="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
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
          onToggleExpanded={toggleExpanded}
        />
        <main className="app-main">
          <PDFViewer
            file={pdfFile}
            pageNumber={pageNumber}
            numPages={numPages}
            onDocumentLoad={handleDocumentLoad}
            onOutlineLoad={handleOutlineLoad}
            onPrevPage={goToPrevPage}
            onNextPage={goToNextPage}
          />
        </main>
      </div>
    </div>
  )
}

export default App
