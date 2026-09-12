import React from 'react';
import { X, Keyboard } from 'lucide-react';

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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="standard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Keyboard size={16} />
            <span>Keyboard Shortcuts</span>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <table className="shortcuts-table">
            <tbody>
              {shortcuts.map((s) => (
                <tr key={s.key}>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.description}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="kbd-hint">{s.key}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
