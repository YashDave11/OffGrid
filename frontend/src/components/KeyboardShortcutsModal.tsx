import React from 'react';
import { RiCloseLine, RiKeyboardLine } from '@remixicon/react';
import { Kbd } from './base/kbd/kbd';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Enter', description: 'Send instruction or message' },
    { key: 'Shift + Enter', description: 'Insert new line in composer' },
    { key: 'Ctrl + K (Cmd + K)', description: 'Open Command Palette' },
    { key: 'Ctrl + Shift + O', description: 'Start a new conversation' },
    { key: 'Ctrl + B', description: 'Toggle conversation sidebar' },
    { key: 'Ctrl + /', description: 'Open this keyboard shortcuts guide' },
    { key: 'Esc', description: 'Close modals, drawers, or command palette' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-background-secondary-default border border-border-button-default shadow-2xl p-6 space-y-4 animate-scaleUp text-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border-separator-border">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">
              <RiKeyboardLine className="size-5" />
            </div>
            <h3 className="text-body-medium font-semibold text-text-primary">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-foreground-icon-secondary hover:text-text-primary hover:bg-background-tertiary-default transition-colors"
          >
            <RiCloseLine className="size-5" />
          </button>
        </div>

        <div className="divide-y divide-border-separator-border">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between py-2.5 text-body-2-regular"
            >
              <span className="text-text-secondary">{s.description}</span>
              <Kbd>{s.key}</Kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
