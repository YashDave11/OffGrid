import { useEffect } from 'react';

interface ShortcutHandlers {
  onToggleCommandPalette?: () => void;
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  onOpenShortcuts?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({
  onToggleCommandPalette,
  onNewChat,
  onToggleSidebar,
  onOpenShortcuts,
  onEscape,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Escape
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      // Ctrl/Cmd + K: Command Palette
      if (modKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        onToggleCommandPalette?.();
        return;
      }

      // Ctrl/Cmd + Shift + O: New Chat
      if (modKey && e.shiftKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        onNewChat?.();
        return;
      }

      // Ctrl/Cmd + B: Toggle Sidebar
      if (modKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        onToggleSidebar?.();
        return;
      }

      // Ctrl/Cmd + /: Shortcuts Help
      if (modKey && e.key === '/') {
        e.preventDefault();
        onOpenShortcuts?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCommandPalette, onNewChat, onToggleSidebar, onOpenShortcuts, onEscape]);
}
