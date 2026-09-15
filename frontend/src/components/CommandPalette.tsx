import React, { useState, useEffect, useRef } from 'react';
import {
  RiSearchLine,
  RiAddLine,
  RiSideBarLine,
  RiSunLine,
  RiMoonLine,
  RiDownloadLine,
  RiDeleteBinLine,
  RiQuestionLine,
  RiShieldCheckLine,
  RiChatAiLine,
} from '@remixicon/react';
import { Conversation } from '../types/workbench';
import { Kbd } from './base/kbd/kbd';
import { cx } from '@/utils/cx';

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
      icon: <RiAddLine className="size-4" />,
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
      icon: <RiSideBarLine className="size-4" />,
      action: () => {
        onToggleSidebar();
        onClose();
      },
    },
    {
      id: 'toggle_theme',
      title: isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      category: 'View',
      icon: isDarkTheme ? <RiSunLine className="size-4" /> : <RiMoonLine className="size-4" />,
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'status_modal',
      title: 'Model & Sovereign System Topology',
      category: 'System',
      icon: <RiShieldCheckLine className="size-4" />,
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
      icon: <RiQuestionLine className="size-4" />,
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
        icon: <RiDownloadLine className="size-4" />,
        action: () => {
          onExportChat('markdown');
          onClose();
        },
      },
      {
        id: 'export_json',
        title: 'Export Conversation as JSON',
        category: 'Actions',
        icon: <RiDownloadLine className="size-4" />,
        action: () => {
          onExportChat('json');
          onClose();
        },
      },
      {
        id: 'clear_chat',
        title: 'Clear Current Conversation Messages',
        category: 'Actions',
        icon: <RiDeleteBinLine className="size-4" />,
        action: () => {
          onClearChat();
          onClose();
        },
      }
    );
  }

  const convItems: PaletteItem[] = conversations.map((c) => ({
    id: `conv_${c.id}`,
    title: c.title,
    category: 'Conversations',
    icon: <RiChatAiLine className="size-4" />,
    action: () => {
      onSelectConversation(c.id);
      onClose();
    },
  }));

  const allItems = [...baseActions, ...convItems];
  const filtered = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-background-secondary-default border border-border-button-default shadow-2xl overflow-hidden animate-scaleUp text-text-primary"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-separator-border bg-background-primary-default">
          <RiSearchLine className="size-5 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-body-medium text-text-primary placeholder:text-text-placeholder outline-none"
            placeholder="Type a command or search conversations..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <Kbd>ESC</Kbd>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-caption-1-regular text-text-tertiary">
              No matching commands or conversations found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cx(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-body-2-medium transition-colors',
                    isSelected
                      ? 'bg-background-tertiary-default text-text-primary font-semibold shadow-2xs'
                      : 'text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-foreground-icon-secondary">{item.icon}</span>
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.shortcut && <Kbd className="text-[10px]">{item.shortcut}</Kbd>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
