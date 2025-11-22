import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export type PanelType = 'bookmarks' | 'thumbnails' | null

export interface Bookmark {
  id: string
  page: number
  label: string
  children?: Bookmark[]
  expanded?: boolean
}

interface SidebarPanelProps {
  activePanel: PanelType
  onClose: () => void
  file: File | null
  numPages: number
  currentPage: number
  onPageSelect: (page: number) => void
  bookmarks: Bookmark[]
  onAddBookmark: (page: number, label?: string) => void
  onRemoveBookmark: (id: string) => void
  onToggleExpanded: (id: string) => void
}

const panelTitles: Record<Exclude<PanelType, null>, string> = {
  'bookmarks': 'Bookmarks',
  'thumbnails': 'Thumbnails',
}

export function SidebarPanel({
  activePanel,
  onClose,
  file,
  numPages,
  currentPage,
  onPageSelect,
  bookmarks,
  onAddBookmark,
  onRemoveBookmark,
  onToggleExpanded,
}: SidebarPanelProps) {
  const [width, setWidth] = useState(250)
  const isResizing = useRef(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const stopResize = useCallback(() => {
    isResizing.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !panelRef.current) return
    const panelRect = panelRef.current.getBoundingClientRect()
    const newWidth = e.clientX - panelRect.left
    setWidth(Math.max(150, Math.min(500, newWidth)))
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', stopResize)
    return () => {
      document.removeEventListener('mousemove', resize)
      document.removeEventListener('mouseup', stopResize)
    }
  }, [resize, stopResize])

  if (!activePanel) return null

  const renderContent = () => {
    switch (activePanel) {
      case 'thumbnails':
        return <ThumbnailsContent
          file={file}
          numPages={numPages}
          currentPage={currentPage}
          onPageSelect={onPageSelect}
        />
      case 'bookmarks':
        return <BookmarksContent
          bookmarks={bookmarks}
          currentPage={currentPage}
          onPageSelect={onPageSelect}
          onRemoveBookmark={onRemoveBookmark}
          onToggleExpanded={onToggleExpanded}
        />
      default:
        return null
    }
  }

  return (
    <div className="sidebar-panel" ref={panelRef} style={{ width }}>
      <div className="sidebar-panel-header">
        <span>{panelTitles[activePanel]}</span>
        <div className="sidebar-panel-actions">
          {activePanel === 'bookmarks' && (
            <button
              className="sidebar-panel-action"
              title={`Add Bookmark (Page ${currentPage})`}
              onClick={() => onAddBookmark(currentPage)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
                <path d="M11 7h2v2h2v2h-2v2h-2v-2H9V9h2z" />
              </svg>
            </button>
          )}
          <button className="sidebar-panel-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="sidebar-panel-content">
        {renderContent()}
      </div>
      <div className="sidebar-panel-resize" onMouseDown={startResize} />
    </div>
  )
}

interface ThumbnailsContentProps {
  file: File | null
  numPages: number
  currentPage: number
  onPageSelect: (page: number) => void
}

function ThumbnailsContent({ file, numPages, currentPage, onPageSelect }: ThumbnailsContentProps) {
  if (!file || numPages === 0) {
    return <div className="panel-placeholder">No PDF loaded</div>
  }

  const pages = Array.from({ length: numPages }, (_, i) => i + 1)

  return (
    <div className="thumbnails-grid">
      <Document file={file}>
        {pages.map((pageNum) => (
          <button
            key={pageNum}
            className={`thumbnail-item ${pageNum === currentPage ? 'thumbnail-item--active' : ''}`}
            onClick={() => onPageSelect(pageNum)}
          >
            <div className="thumbnail-preview">
              <Page
                pageNumber={pageNum}
                width={150}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
            <span className="thumbnail-label">{pageNum}</span>
          </button>
        ))}
      </Document>
    </div>
  )
}

interface BookmarksContentProps {
  bookmarks: Bookmark[]
  currentPage: number
  onPageSelect: (page: number) => void
  onRemoveBookmark: (id: string) => void
  onToggleExpanded: (id: string) => void
}

function BookmarksContent({ bookmarks, currentPage, onPageSelect, onRemoveBookmark, onToggleExpanded }: BookmarksContentProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="bookmarks-panel">
        <div className="panel-placeholder">No bookmarks yet</div>
      </div>
    )
  }

  return (
    <div className="bookmarks-panel">
      <div className="bookmarks-list">
        {bookmarks.map((bookmark) => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            currentPage={currentPage}
            onPageSelect={onPageSelect}
            onRemoveBookmark={onRemoveBookmark}
            onToggleExpanded={onToggleExpanded}
            level={0}
          />
        ))}
      </div>
    </div>
  )
}

interface BookmarkItemProps {
  bookmark: Bookmark
  currentPage: number
  onPageSelect: (page: number) => void
  onRemoveBookmark: (id: string) => void
  onToggleExpanded: (id: string) => void
  level: number
}

function BookmarkItem({ bookmark, currentPage, onPageSelect, onRemoveBookmark, onToggleExpanded, level }: BookmarkItemProps) {
  const hasChildren = bookmark.children && bookmark.children.length > 0
  const isExpanded = bookmark.expanded ?? true

  return (
    <>
      <div
        className={`bookmark-item ${bookmark.page === currentPage ? 'bookmark-item--active' : ''}`}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        {hasChildren ? (
          <button
            className="bookmark-expand"
            onClick={() => onToggleExpanded(bookmark.id)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              {isExpanded ? (
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              ) : (
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
              )}
            </svg>
          </button>
        ) : (
          <span className="bookmark-expand-placeholder" />
        )}
        <button
          className="bookmark-item-content"
          onClick={() => onPageSelect(bookmark.page)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
          <span className="bookmark-label">{bookmark.label}</span>
        </button>
        <button
          className="bookmark-delete"
          onClick={() => onRemoveBookmark(bookmark.id)}
          title="Remove bookmark"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
      {hasChildren && isExpanded && bookmark.children!.map((child) => (
        <BookmarkItem
          key={child.id}
          bookmark={child}
          currentPage={currentPage}
          onPageSelect={onPageSelect}
          onRemoveBookmark={onRemoveBookmark}
          onToggleExpanded={onToggleExpanded}
          level={level + 1}
        />
      ))}
    </>
  )
}
