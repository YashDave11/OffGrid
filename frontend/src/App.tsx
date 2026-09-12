import React, { useState, useEffect, useCallback } from 'react';
import { useConversations } from './hooks/useConversations';
import { useModelStatus } from './hooks/useModelStatus';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { Composer } from './components/Composer';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { StatusDetailsModal } from './components/StatusDetailsModal';
import { ChatMessage, TaskType, AnalyzeResponsePayload } from './types/workbench';

export const App: React.FC = () => {
  const {
    conversations,
    activeId,
    activeConversation,
    setActiveId,
    createConversation,
    addMessage,
    updateMessage,
    deleteConversation,
    renameConversation,
    clearActiveConversation,
    exportConversation,
  } = useConversations();

  const { status, isChecking, refreshStatus } = useModelStatus();

  // Layout & UI States
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('mrpl_theme') as 'dark' | 'light') || 'dark';
  });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mrpl_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleCommandPalette: () => setCommandPaletteOpen((prev) => !prev),
    onNewChat: () => createConversation(),
    onToggleSidebar: () => setSidebarOpen((prev) => !prev),
    onOpenShortcuts: () => setShortcutsModalOpen(true),
    onEscape: () => {
      setCommandPaletteOpen(false);
      setShortcutsModalOpen(false);
      setStatusModalOpen(false);
    },
  });

  // Handle Send Message
  const handleSendMessage = async (text: string, base64Image?: string) => {
    if (isLoading) return;

    let convId = activeId;
    // Create new conversation if none is active
    if (!convId || !conversations.some((c) => c.id === convId)) {
      convId = createConversation();
    }

    const userMessageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      attachedImage: base64Image,
      timestamp: Date.now(),
      status: 'completed',
    };

    addMessage(userMsg, convId);

    // Assistant placeholder
    const assistantMessageId = 'asst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const assistantMsg: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'sending',
    };

    addMessage(assistantMsg, convId);
    setIsLoading(true);

    const inputType: TaskType = base64Image ? 'image' : 'text';
    const content = base64Image || text;

    try {
      const response = await fetch('/v1/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: text,
          input_type: inputType,
          content: content,
        }),
      });

      const data: AnalyzeResponsePayload = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { detail?: string }).detail || 'Inference execution failed');
      }

      // Parse <think>...</think> reasoning process
      let rawResult = data.result || '';
      let reasoning: string | undefined = undefined;

      const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/i;
      const thinkMatch = rawResult.match(thinkRegex);
      if (thinkMatch) {
        reasoning = thinkMatch[1].trim();
        rawResult = rawResult.replace(thinkRegex, '').trim();
      }

      updateMessage(
        assistantMessageId,
        {
          status: 'completed',
          content: rawResult || (reasoning ? '' : 'Task completed with no text output.'),
          reasoning: reasoning,
          model: data.model,
          taskType: data.task_type as TaskType,
          steps: data.steps,
        },
        convId
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown pipeline error';
      updateMessage(
        assistantMessageId,
        {
          status: 'error',
          error: errorMsg,
        },
        convId
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Retry failed message
  const handleRetryMessage = (messageId: string) => {
    if (!activeConversation) return;
    const msgIdx = activeConversation.messages.findIndex((m) => m.id === messageId);
    if (msgIdx <= 0) return;
    const prevUserMsg = activeConversation.messages[msgIdx - 1];
    if (prevUserMsg && prevUserMsg.role === 'user') {
      handleSendMessage(prevUserMsg.content, prevUserMsg.attachedImage);
    }
  };

  const currentTitle = activeConversation?.title || 'New Conversation';
  const currentMessages = activeConversation?.messages || [];

  return (
    <div className="app-layout" data-theme={theme}>
      {/* Collapsible Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => setActiveId(id)}
        onNewChat={() => createConversation()}
        onDeleteConversation={(id) => deleteConversation(id)}
        onRenameConversation={(id, newTitle) => renameConversation(id, newTitle)}
      />

      {/* Main Chat Workspace */}
      <main className="workspace">
        <Header
          sidebarCollapsed={!sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          title={currentTitle}
          onRenameTitle={(newTitle) => {
            if (activeId) renameConversation(activeId, newTitle);
          }}
          status={status}
          onOpenStatusModal={() => setStatusModalOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenShortcutsModal={() => setShortcutsModalOpen(true)}
          isDarkTheme={theme === 'dark'}
          onToggleTheme={toggleTheme}
        />

        <ChatArea
          messages={currentMessages}
          onSelectStarterPrompt={(prompt) => handleSendMessage(prompt)}
          onRetryMessage={handleRetryMessage}
        />

        <Composer
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>

      {/* Modals */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        conversations={conversations}
        onSelectConversation={(id) => setActiveId(id)}
        onNewChat={() => createConversation()}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onToggleTheme={toggleTheme}
        isDarkTheme={theme === 'dark'}
        onOpenStatusModal={() => setStatusModalOpen(true)}
        onOpenShortcutsModal={() => setShortcutsModalOpen(true)}
        onExportChat={(format) => {
          if (activeId) exportConversation(activeId, format);
        }}
        onClearChat={() => clearActiveConversation()}
        hasActiveChat={Boolean(activeConversation && activeConversation.messages.length > 0)}
      />

      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      <StatusDetailsModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        status={status}
        isChecking={isChecking}
        onRefresh={refreshStatus}
      />
    </div>
  );
};
