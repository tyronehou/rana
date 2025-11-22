import { PanelType } from './SidebarPanel'

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
          className={`sidebar-button ${activePanel === 'bookmarks' ? 'sidebar-button--active' : ''}`}
          title="Bookmarks"
          onClick={() => handlePanelClick('bookmarks')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <button
          className={`sidebar-button ${activePanel === 'thumbnails' ? 'sidebar-button--active' : ''}`}
          title="Thumbnails"
          onClick={() => handlePanelClick('thumbnails')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M4 5h3v3H4V5zm0 5h3v3H4v-3zm0 5h3v3H4v-3zm5-10h10v3H9V5zm0 5h10v3H9v-3zm0 5h10v3H9v-3z" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
