import React, { useState } from 'react';
import {
  RiAddLine,
  RiChatAiLine,
  RiBookOpenLine,
  RiSearchLine,
  RiDeleteBinLine,
  RiEditLine,
  RiCheckLine,
  RiShieldCheckLine,
  RiSideBarFill,
  RiServerLine,
} from '@remixicon/react';
import { Conversation, SystemStatus } from '../types/workbench';
import { StatusDot } from './base/badges/status-dot';
import { Badge } from './base/badges/badge';
import { Kbd } from './base/kbd/kbd';
import { cx } from '@/utils/cx';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenKnowledgeBase: () => void;
  activeView: 'chat' | 'knowledge';
  status?: SystemStatus;
  onOpenStatusModal?: () => void;
  onToggleProviderMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenKnowledgeBase,
  activeView,
  status,
  onOpenStatusModal,
  onToggleProviderMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      onDeleteConversation(id);
    }
  };

  // Filter conversations
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by timeframe
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;

  const todayList: Conversation[] = [];
  const weekList: Conversation[] = [];
  const olderList: Conversation[] = [];

  filtered.forEach((c) => {
    const age = now - (c.updatedAt || c.createdAt);
    if (age < oneDay) {
      todayList.push(c);
    } else if (age < sevenDays) {
      weekList.push(c);
    } else {
      olderList.push(c);
    }
  });

  const isMock = status?.mode === 'mock';
  const overallStatus =
    status?.reasoning === 'ok' || status?.vision === 'ok'
      ? 'ok'
      : status?.reasoning === 'standby' || status?.vision === 'standby'
      ? 'standby'
      : 'offline';

  const renderGroup = (title: string, list: Conversation[]) => {
    if (list.length === 0) return null;
    return (
      <div key={title} className="mb-3">
        {isOpen && (
          <div className="px-3 py-1 text-caption-1-semibold text-text-tertiary uppercase tracking-wider">
            {title}
          </div>
        )}
        <ul className="space-y-1">
          {list.map((conv) => {
            const isActive = conv.id === activeId && activeView === 'chat';
            const isEditing = conv.id === editingId;

            return (
              <li
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={cx(
                  'group relative flex items-center gap-2 rounded-xl px-2.5 py-2 text-body-2-medium transition-all duration-150 cursor-pointer select-none',
                  isActive
                    ? 'bg-background-tertiary-default text-text-primary shadow-xs font-semibold'
                    : 'text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary',
                  !isOpen && 'justify-center px-2'
                )}
                title={conv.title}
              >
                <RiChatAiLine className="size-4 shrink-0 text-foreground-icon-secondary" />

                {isOpen && (
                  <>
                    {isEditing ? (
                      <input
                        className="flex-1 min-w-0 bg-background-primary-default border border-border-button-default rounded-md px-2 py-0.5 text-body-2-regular text-text-primary outline-none focus:ring-1 focus:ring-border-focus-ring"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveRename(conv.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(conv.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 truncate">{conv.title}</span>
                    )}

                    <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <button
                          type="button"
                          className="p-1 text-text-tertiary hover:text-text-primary rounded"
                          onClick={(e) => handleSaveRename(conv.id, e)}
                          title="Save"
                        >
                          <RiCheckLine className="size-3.5" />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="p-1 text-text-tertiary hover:text-text-primary rounded hover:bg-background-tertiary-default"
                            onClick={(e) => handleStartRename(conv, e)}
                            title="Rename"
                          >
                            <RiEditLine className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-text-tertiary hover:text-text-error-primary rounded hover:bg-background-tertiary-default"
                            onClick={(e) => handleDelete(conv.id, e)}
                            title="Delete"
                          >
                            <RiDeleteBinLine className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <aside
      className={cx(
        'relative flex flex-col shrink-0 h-[calc(100vh-24px)] my-3 ml-3 rounded-3xl bg-background-secondary-default border border-border-button-default shadow-sidebar transition-all duration-300 ease-in-out z-20',
        isOpen ? 'w-[260px] p-3' : 'w-[64px] p-2 items-center'
      )}
    >
      {/* Brand / Header */}
      <div className={cx('flex items-center justify-between gap-2 pb-3 mb-2 border-b border-border-separator-border w-full', !isOpen && 'justify-center')}>
        {isOpen ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white font-bold text-headline-medium shadow-xs">
              M
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-body-2-medium font-semibold text-text-primary truncate">
                MRPL Sovereign
              </span>
              <span className="text-caption-1-regular text-text-tertiary truncate">
                Air-Gapped Node
              </span>
            </div>
          </div>
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white font-bold text-headline-medium shadow-xs" title="MRPL Sovereign AI">
            M
          </div>
        )}

        {isOpen && (
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-lg text-foreground-icon-secondary hover:text-text-primary hover:bg-background-secondary-hover transition-colors"
            title="Collapse sidebar (Ctrl+B)"
            aria-label="Collapse sidebar"
          >
            <RiSideBarFill className="size-4" />
          </button>
        )}
      </div>

      {!isOpen && (
        <button
          type="button"
          onClick={onToggle}
          className="mb-2 p-2 rounded-xl text-foreground-icon-secondary hover:text-text-primary hover:bg-background-secondary-hover transition-colors"
          title="Expand sidebar (Ctrl+B)"
          aria-label="Expand sidebar"
        >
          <RiSideBarFill className="size-4" />
        </button>
      )}

      {/* Main Actions & Nav */}
      <div className="w-full space-y-2 mb-3">
        <button
          type="button"
          onClick={onNewChat}
          className={cx(
            'flex items-center gap-2 w-full rounded-xl bg-button-primary text-white font-medium py-2 transition-all duration-150 hover:opacity-90 shadow-xs cursor-pointer',
            isOpen ? 'px-3 justify-between text-body-2-medium' : 'justify-center p-2'
          )}
          title="New Conversation (Ctrl+Shift+O)"
        >
          <div className="flex items-center gap-2">
            <RiAddLine className="size-4 shrink-0" />
            {isOpen && <span>New Chat</span>}
          </div>
          {isOpen && <Kbd>Ctrl+Shift+O</Kbd>}
        </button>

        {/* 2-Item Nav: Chat vs Knowledge Base */}
        <div className="flex flex-col gap-1 w-full pt-1">
          <button
            type="button"
            onClick={() => onSelectConversation(activeId || '')}
            className={cx(
              'flex items-center gap-2.5 rounded-xl py-2 transition-colors cursor-pointer text-body-2-medium',
              isOpen ? 'px-3' : 'justify-center px-2',
              activeView === 'chat'
                ? 'bg-background-tertiary-default text-text-primary font-semibold'
                : 'text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary'
            )}
            title="Chat Interface"
          >
            <RiChatAiLine className="size-4 shrink-0 text-foreground-icon-secondary" />
            {isOpen && <span>Chat</span>}
          </button>

          <button
            type="button"
            onClick={onOpenKnowledgeBase}
            className={cx(
              'flex items-center gap-2.5 rounded-xl py-2 transition-colors cursor-pointer text-body-2-medium',
              isOpen ? 'px-3' : 'justify-center px-2',
              activeView === 'knowledge'
                ? 'bg-background-tertiary-default text-text-primary font-semibold'
                : 'text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary'
            )}
            title="Knowledge Base & RAG Documents"
          >
            <RiBookOpenLine className="size-4 shrink-0 text-foreground-icon-secondary" />
            {isOpen && <span>Knowledge Base</span>}
          </button>
        </div>

        {/* Search */}
        {isOpen && (
          <div className="relative flex items-center pt-1">
            <RiSearchLine className="absolute left-2.5 size-3.5 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-background-primary-default border border-border-button-default text-caption-1-regular text-text-primary placeholder:text-text-placeholder outline-none focus:ring-1 focus:ring-border-focus-ring transition-colors"
            />
          </div>
        )}
      </div>

      {/* Conversations Scroll Area */}
      <div className="flex-1 overflow-y-auto w-full pr-1 space-y-2">
        {filtered.length === 0 ? (
          isOpen && (
            <div className="px-3 py-6 text-center text-caption-1-regular text-text-tertiary">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </div>
          )
        ) : (
          <>
            {renderGroup('Today', todayList)}
            {renderGroup('Previous 7 Days', weekList)}
            {renderGroup('Older', olderList)}
          </>
        )}
      </div>

      {/* Footer: Status, Provider Toggle, Sovereignty */}
      <div className="w-full pt-3 mt-auto border-t border-border-separator-border space-y-2">
        {/* Provider mode toggle button */}
        {onToggleProviderMode && (
          <button
            type="button"
            onClick={onToggleProviderMode}
            className={cx(
              'flex items-center gap-2 w-full rounded-xl py-1.5 transition-colors cursor-pointer border border-border-button-default',
              isOpen ? 'px-2.5 justify-between text-caption-1-medium' : 'justify-center p-1.5',
              isMock
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
            )}
            title={`Current mode: ${isMock ? 'Mock Standby' : 'Remote Inference'}. Click to toggle.`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <RiServerLine className="size-3.5 shrink-0" />
              {isOpen && <span className="truncate">{isMock ? 'Mock Standby' : 'Remote LLM'}</span>}
            </div>
            {isOpen && (
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                {isMock ? 'MOCK' : 'LIVE'}
              </span>
            )}
          </button>
        )}

        {/* Connectivity status chip */}
        <div
          onClick={onOpenStatusModal}
          className={cx(
            'flex items-center gap-2 w-full rounded-xl py-1.5 px-2 bg-background-primary-default border border-border-button-default cursor-pointer hover:bg-background-secondary-hover transition-colors',
            isOpen ? 'justify-between' : 'justify-center'
          )}
          title="Server Connectivity & Node Topology"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-2 min-w-0">
            <StatusDot
              status={
                overallStatus === 'ok'
                  ? 'online'
                  : overallStatus === 'standby'
                  ? 'maintenance'
                  : 'offline'
              }
              className="size-2 shrink-0"
            />
            {isOpen && (
              <span className="text-caption-1-regular text-text-secondary truncate">
                {overallStatus === 'ok' ? 'Gateway Connected' : overallStatus === 'standby' ? 'Standby Providers' : 'Gateway Offline'}
              </span>
            )}
          </div>
          {isOpen && (
            <Badge color="neutral">
              8000
            </Badge>
          )}
        </div>

        {isOpen && (
          <div className="flex items-center justify-between text-[11px] text-text-tertiary px-1 pt-1">
            <div className="flex items-center gap-1 text-emerald-500">
              <RiShieldCheckLine className="size-3" />
              <span>Sovereign Node</span>
            </div>
            <span className="text-[9.5px] font-mono tracking-wider font-semibold opacity-75">
              ON-PREM
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
