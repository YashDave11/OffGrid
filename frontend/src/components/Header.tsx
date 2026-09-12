import React, { useState } from 'react';
import { PanelLeft, Sun, Moon, HelpCircle, Command, Check } from 'lucide-react';
import { SystemStatus } from '../types/workbench';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  title: string;
  onRenameTitle?: (newTitle: string) => void;
  status: SystemStatus;
  onOpenStatusModal: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcutsModal: () => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  title,
  onRenameTitle,
  status,
  onOpenStatusModal,
  onOpenCommandPalette,
  onOpenShortcutsModal,
  isDarkTheme,
  onToggleTheme,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (editedTitle.trim() && editedTitle !== title && onRenameTitle) {
      onRenameTitle(editedTitle.trim());
    }
  };

  const getDotClass = (st: string) => {
    if (st === 'ok') return 'status-dot ok';
    if (st === 'checking') return 'status-dot checking';
    return 'status-dot offline';
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          title="Toggle Sidebar (Ctrl+B)"
          aria-label="Toggle Sidebar"
        >
          <PanelLeft size={16} />
        </button>

        <div className="header-title-bar">
          {isEditingTitle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                className="search-input"
                style={{ padding: '3px 8px', fontSize: '13px', width: '220px' }}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
              />
              <button
                className="btn-item-action"
                onClick={handleTitleSubmit}
                title="Save title"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <h1
              className="current-chat-title"
              onClick={() => {
                setEditedTitle(title);
                setIsEditingTitle(true);
              }}
              title="Click to rename"
              style={{ cursor: 'pointer' }}
            >
              {title}
            </h1>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Model Status Capsule */}
        <div
          className="status-capsules"
          onClick={onOpenStatusModal}
          title="Click to view sovereign topology & models"
          role="button"
          tabIndex={0}
        >
          <div className="status-pill">
            <span className={getDotClass(status.reasoning)} />
            <span>Qwen Reasoning</span>
          </div>
          <span className="status-separator">/</span>
          <div className="status-pill">
            <span className={getDotClass(status.vision)} />
            <span>Gemma Vision</span>
          </div>
        </div>

        {/* Action Tools */}
        <div className="header-actions">
          <button
            className="btn-header-tool"
            onClick={onOpenCommandPalette}
            title="Command Palette (Ctrl+K)"
            aria-label="Open Command Palette"
          >
            <Command size={14} />
            <span className="kbd-hint" style={{ fontSize: '9.5px' }}>Ctrl+K</span>
          </button>

          <button
            className="btn-header-tool"
            onClick={onToggleTheme}
            title={isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme"
          >
            {isDarkTheme ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            className="btn-header-tool"
            onClick={onOpenShortcutsModal}
            title="Keyboard Shortcuts (Ctrl+/)"
            aria-label="Keyboard Shortcuts"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
