import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, PanelLeft, Sun, Moon, Download, Trash2, HelpCircle, Activity, MessageSquare } from 'lucide-react';
import { Conversation } from '../types/workbench';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  isDarkTheme: boolean;
  onOpenStatusModal: () => void;
  onOpenShortcutsModal: () => void;
  onExportChat: (format: 'markdown' | 'json') => void;
  onClearChat: () => void;
  hasActiveChat: boolean;
}

interface PaletteItem {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  conversations,
  onSelectConversation,
  onNewChat,
  onToggleSidebar,
  onToggleTheme,
  isDarkTheme,
  onOpenStatusModal,
  onOpenShortcutsModal,
  onExportChat,
  onClearChat,
  hasActiveChat,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command list
  const baseActions: PaletteItem[] = [
    {
      id: 'new_chat',
      title: 'New Conversation',
      category: 'Actions',
      shortcut: 'Ctrl+Shift+O',
      icon: <Plus size={14} />,
      action: () => {
        onNewChat();
        onClose();
      },
    },
    {
      id: 'toggle_sidebar',
      title: 'Toggle Sidebar',
      category: 'View',
      shortcut: 'Ctrl+B',
      icon: <PanelLeft size={14} />,
      action: () => {
        onToggleSidebar();
        onClose();
      },
    },
    {
      id: 'toggle_theme',
      title: isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      category: 'View',
      icon: isDarkTheme ? <Sun size={14} /> : <Moon size={14} />,
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'status_modal',
      title: 'Model & Sovereign System Status',
      category: 'System',
      icon: <Activity size={14} />,
      action: () => {
        onOpenStatusModal();
        onClose();
      },
    },
    {
      id: 'shortcuts_modal',
      title: 'View Keyboard Shortcuts',
      category: 'System',
      shortcut: 'Ctrl+/',
      icon: <HelpCircle size={14} />,
      action: () => {
        onOpenShortcutsModal();
        onClose();
      },
    },
  ];

  if (hasActiveChat) {
    baseActions.push(
      {
        id: 'export_md',
        title: 'Export Conversation as Markdown',
        category: 'Actions',
        icon: <Download size={14} />,
        action: () => {
          onExportChat('markdown');
          onClose();
        },
      },
      {
        id: 'export_json',
        title: 'Export Conversation as JSON',
        category: 'Actions',
        icon: <Download size={14} />,
        action: () => {
          onExportChat('json');
          onClose();
        },
      },
      {
        id: 'clear_chat',
        title: 'Clear Current Conversation Messages',
        category: 'Actions',
        icon: <Trash2 size={14} />,
        action: () => {
          onClearChat();
          onClose();
        },
      }
    );
  }

  // Add past conversations
  const convActions: PaletteItem[] = conversations.map((c) => ({
    id: `conv_${c.id}`,
    title: c.title,
    category: 'Conversations',
    icon: <MessageSquare size={14} />,
    action: () => {
      onSelectConversation(c.id);
      onClose();
    },
  }));

  const allItems = [...baseActions, ...convActions];

  // Filter based on query
  const filteredItems = allItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="command-palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="command-input-wrap">
          <Search size={16} className="command-search-icon" />
          <input
            ref={inputRef}
            className="command-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search conversations..."
          />
          <span className="kbd-hint">ESC</span>
        </div>

        <div className="command-list">
          {filteredItems.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No matching commands or conversations found.
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-item-left">
                  {item.icon}
                  <span>{item.title}</span>
                </div>
                {item.shortcut && (
                  <span className="command-shortcut">{item.shortcut}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
