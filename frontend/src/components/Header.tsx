import React, { useState } from 'react';
import {
  RiSideBarLine,
  RiQuestionLine,
  RiCommandLine,
  RiCheckLine,
  RiLayoutRightLine,
  RiCpuLine,
  RiEyeLine,
} from '@remixicon/react';
import { SystemStatus } from '../types/workbench';
import { ThemeToggle } from './application/theme/theme-toggle';
import { StatusDot } from './base/badges/status-dot';
import { Kbd } from './base/kbd/kbd';
import { cx } from '@/utils/cx';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  title: string;
  onRenameTitle?: (newTitle: string) => void;
  status: SystemStatus;
  onOpenStatusModal: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcutsModal: () => void;
  isSidePanelOpen?: boolean;
  onToggleSidePanel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarCollapsed,
  onToggleSidebar,
  title,
  onRenameTitle,
  status,
  onOpenStatusModal,
  onOpenCommandPalette,
  onOpenShortcutsModal,
  isSidePanelOpen = false,
  onToggleSidePanel,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (editedTitle.trim() && editedTitle !== title && onRenameTitle) {
      onRenameTitle(editedTitle.trim());
    }
  };

  const mapStatusDot = (st: string) => {
    if (st === 'ok') return 'online';
    if (st === 'standby') return 'maintenance';
    return 'offline';
  };

  return (
    <header className="flex h-14 w-full items-center justify-between px-4 border-b border-border-separator-border bg-background-full shrink-0 z-10">
      {/* Left Area: Sidebar Toggle & Conversation Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={!sidebarCollapsed}
          className="flex size-9 items-center justify-center rounded-xl text-foreground-icon-secondary hover:text-text-primary hover:bg-background-secondary-hover transition-colors cursor-pointer"
          title={sidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
          aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <RiSideBarLine className="size-5" />
        </button>

        <div className="flex items-center min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                className="bg-background-primary-default border border-border-button-default rounded-lg px-2.5 py-1 text-body-2-medium text-text-primary outline-none focus:ring-1 focus:ring-border-focus-ring w-56"
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
                type="button"
                onClick={handleTitleSubmit}
                className="p-1 rounded-md text-emerald-400 hover:bg-background-secondary-hover"
                title="Save title"
              >
                <RiCheckLine className="size-4" />
              </button>
            </div>
          ) : (
            <h1
              onClick={() => {
                setEditedTitle(title);
                setIsEditingTitle(true);
              }}
              title="Click to rename conversation"
              className="text-body-medium font-semibold text-text-primary truncate cursor-pointer hover:text-accent-500 transition-colors max-w-sm"
            >
              {title}
            </h1>
          )}
        </div>
      </div>

      {/* Right Area: Model Status Pill & Controls */}
      <div className="flex items-center gap-2">
        {/* Model Status Capsule */}
        <div
          onClick={onOpenStatusModal}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-secondary-default border border-border-button-default text-caption-1-medium text-text-secondary cursor-pointer hover:bg-background-secondary-hover hover:border-border-button-hover transition-colors shadow-2xs select-none"
          title="Click to view sovereign topology & models"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-1.5">
            <StatusDot
              status={
                status.reasoning_fallback_active
                  ? 'maintenance'
                  : mapStatusDot(status.primary_reasoning || status.reasoning)
              }
              className="size-1.5"
            />
            <RiCpuLine className="size-3.5 text-text-tertiary" />
            <span>
              {status.reasoning_fallback_active
                ? 'Qwen3-4B (Fallback)'
                : 'Qwen2.5-1.5B'}
            </span>
          </div>

          <span className="text-border-separator-border">/</span>

          <div className="flex items-center gap-1.5">
            <StatusDot status={mapStatusDot(status.vision)} className="size-1.5" />
            <RiEyeLine className="size-3.5 text-text-tertiary" />
            <span>Gemma-3-4B</span>
          </div>
        </div>

        {/* Command Palette trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-caption-1-medium text-foreground-icon-secondary hover:text-text-primary hover:bg-background-secondary-hover transition-colors cursor-pointer border border-transparent hover:border-border-button-default"
          title="Command Palette (Ctrl+K)"
          aria-label="Open Command Palette"
        >
          <RiCommandLine className="size-4" />
          <Kbd className="hidden sm:inline-flex text-[10px]">Ctrl+K</Kbd>
        </button>

        {/* Third Panel Toggle Button (Knowledge Base / Trace) */}
        {onToggleSidePanel && (
          <button
            type="button"
            onClick={onToggleSidePanel}
            className={cx(
              'flex size-9 items-center justify-center rounded-xl transition-colors cursor-pointer',
              isSidePanelOpen
                ? 'bg-accent-500/10 text-accent-500 border border-accent-500/25'
                : 'text-foreground-icon-secondary hover:text-text-primary hover:bg-background-secondary-hover'
            )}
            title={isSidePanelOpen ? 'Close Side Panel' : 'Open Knowledge Base / Trace Panel'}
            aria-label="Toggle Side Panel"
          >
            <RiLayoutRightLine className="size-4.5" />
          </button>
        )}

        {/* Theme Toggle (BoardUI circular reveal) */}
        <ThemeToggle collapsed />

        {/* Shortcuts modal trigger */}
        <button
          type="button"
          onClick={onOpenShortcutsModal}
          className="flex size-9 items-center justify-center rounded-xl text-foreground-icon-secondary hover:text-text-primary hover:bg-background-secondary-hover transition-colors cursor-pointer"
          title="Keyboard Shortcuts (Ctrl+/)"
          aria-label="Keyboard Shortcuts"
        >
          <RiQuestionLine className="size-4.5" />
        </button>
      </div>
    </header>
  );
};
