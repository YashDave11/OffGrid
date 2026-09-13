import React, { useState } from 'react';
import { Plus, Search, MessageSquare, Trash2, Edit2, PanelLeftClose, Check, Shield, Library } from 'lucide-react';
import { Conversation } from '../types/workbench';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenKnowledgeBase: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenKnowledgeBase,
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

  const renderGroup = (title: string, list: Conversation[]) => {
    if (list.length === 0) return null;
    return (
      <div key={title} style={{ marginBottom: '12px' }}>
        <div className="chat-group-title">{title}</div>
        <ul className="conversation-list">
          {list.map((conv) => {
            const isActive = conv.id === activeId;
            const isEditing = conv.id === editingId;

            return (
              <li
                key={conv.id}
                className={`conversation-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="item-main">
                  <MessageSquare size={14} className="item-icon" />
                  {isEditing ? (
                    <input
                      className="search-input"
                      style={{ padding: '2px 6px', fontSize: '12px' }}
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
                    <span className="item-title">{conv.title}</span>
                  )}
                </div>

                <div className="item-actions">
                  {isEditing ? (
                    <button
                      className="btn-item-action"
                      onClick={(e) => handleSaveRename(conv.id, e)}
                      title="Save"
                    >
                      <Check size={13} />
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn-item-action"
                        onClick={(e) => handleStartRename(conv, e)}
                        title="Rename"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="btn-item-action delete"
                        onClick={(e) => handleDelete(conv.id, e)}
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <>
      {isOpen && <div className="mobile-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="brand-badge">
            <div className="brand-icon">M</div>
            <div className="brand-info">
              <span className="brand-title">MRPL Sovereign AI</span>
              <span className="brand-subtitle">Industrial Workbench</span>
            </div>
          </div>
          <button
            className="btn-sidebar-collapse"
            onClick={onClose}
            title="Close sidebar (Ctrl+B)"
            aria-label="Close sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        <div className="sidebar-actions">
          <button className="btn-new-chat" onClick={onNewChat} type="button">
            <div className="btn-left">
              <Plus size={15} />
              <span>New Chat</span>
            </div>
            <span className="kbd-hint">Ctrl+Shift+O</span>
          </button>
          
          <button className="btn-new-chat" style={{ marginTop: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} onClick={onOpenKnowledgeBase} type="button">
            <div className="btn-left">
              <Library size={15} />
              <span>Knowledge Base</span>
            </div>
          </button>

          <div className="sidebar-search">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="sidebar-scroll">
          {filtered.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </div>
          ) : (
            <>
              {renderGroup('Today', todayList)}
              {renderGroup('Previous 7 Days', weekList)}
              {renderGroup('Older', olderList)}
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="footer-meta">
            <Shield size={12} style={{ color: 'var(--accent-amber)' }} />
            <span>Air-Gapped Sovereign Node</span>
          </div>
          <span className="sovereign-tag">ON-PREM</span>
        </div>
      </aside>
    </>
  );
};
