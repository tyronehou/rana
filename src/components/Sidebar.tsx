import { PanelType } from './SidebarPanel'
import { ThumbnailsIcon, BookmarkIcon } from '../resources/svg'

interface SidebarProps {
  activePanel: PanelType
  onPanelToggle: (panel: PanelType) => void
}

export function Sidebar({
  activePanel,
  onPanelToggle,
}: SidebarProps) {
  const handlePanelClick = (panel: Exclude<PanelType, null>) => {
    onPanelToggle(activePanel === panel ? null : panel)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <button
          className={`sidebar-button ${activePanel === 'thumbnails' ? 'sidebar-button--active' : ''}`}
          title="Thumbnails"
          onClick={() => handlePanelClick('thumbnails')}
        >
          <ThumbnailsIcon />
        </button>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <button
          className={`sidebar-button ${activePanel === 'bookmarks' ? 'sidebar-button--active' : ''}`}
          title="Bookmarks"
          onClick={() => handlePanelClick('bookmarks')}
        >
          <BookmarkIcon />
        </button>
      </div>
    </aside>
  )
}
