import React, { useState, useMemo } from 'react';
import { useConversations } from './hooks/useConversations';
import { useModelStatus } from './hooks/useModelStatus';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { Composer } from './components/Composer';
import { SidePanel } from './components/SidePanel';
import { KnowledgeBase } from './components/KnowledgeBase';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { StatusDetailsModal } from './components/StatusDetailsModal';
import { NotificationToastContainer, notify } from './components/NotificationToast';
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

  const { status, isChecking, refreshStatus, toggleProviderMode } = useModelStatus();

  // Layout & UI States
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState<'kb' | 'trace'>('kb');
  const [sidePanelFullscreen, setSidePanelFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'knowledge'>('chat');

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleCommandPalette: () => setCommandPaletteOpen((prev) => !prev),
    onNewChat: () => {
      createConversation();
      setViewMode('chat');
    },
    onToggleSidebar: () => setSidebarOpen((prev) => !prev),
    onOpenShortcuts: () => setShortcutsModalOpen(true),
    onEscape: () => {
      setCommandPaletteOpen(false);
      setShortcutsModalOpen(false);
      setStatusModalOpen(false);
    },
  });

  // Extract latest retrieval trace from active conversation
  const latestTraceData = useMemo(() => {
    if (!activeConversation) return null;
    for (let i = activeConversation.messages.length - 1; i >= 0; i--) {
      const msg = activeConversation.messages[i];
      if (msg.role === 'assistant' && (msg as any).ingestion_details?.retrieval) {
        const details = (msg as any).ingestion_details;
        return {
          document_id: details.document_id,
          source: details.retrieval.source,
          top_k: details.retrieval.top_k,
          threshold_applied: details.retrieval.threshold_applied,
          chunks_injected: details.retrieval.chunks_injected,
          timing: details.retrieval.timing,
          sample_chunks: details.sample_chunks || [],
        };
      }
    }
    return null;
  }, [activeConversation]);

  // Handle Send Message
  const handleSendMessage = async (
    text: string,
    base64Image?: string,
    attachedDocument?: { name: string; data: string },
    isDiagramMode?: boolean
  ) => {
    if (isLoading) return;

    let convId = activeId;
    if (!convId || !conversations.some((c) => c.id === convId)) {
      convId = createConversation();
    }

    const userMessageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      attachedImage: base64Image,
      attachedDocument: attachedDocument,
      timestamp: Date.now(),
      status: 'completed',
    };

    addMessage(userMsg, convId);

    // Assistant placeholder
    const assistantMessageId =
      'asst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const assistantMsg: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'sending',
    };

    addMessage(assistantMsg, convId);
    setIsLoading(true);

    const inputType: TaskType = attachedDocument ? 'document' : base64Image ? 'image' : 'text';
    const content = attachedDocument ? attachedDocument.data : base64Image || text;

    if (attachedDocument) {
      setActiveDocumentId(null);
    }

    if (isDiagramMode) {
      try {
        const response = await fetch('/v1/diagram/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: text,
            conversation_id: convId,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.detail || 'Diagram service unavailable or failed');
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        updateMessage(
          assistantMessageId,
          {
            status: 'completed',
            model: 'Mihil Diagram API',
            content: '',
            attachedImage: objectUrl,
          },
          convId
        );
      } catch (err: any) {
        console.error('Diagram Error:', err);
        updateMessage(
          assistantMessageId,
          {
            status: 'error',
            error: err.message || 'Diagram service offline.',
          },
          convId
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await fetch('/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: text,
          input_type: inputType,
          content: content,
          document_name: attachedDocument ? attachedDocument.name : undefined,
          document_id: !attachedDocument && activeDocumentId ? activeDocumentId : undefined,
          conversation_id: convId,
        }),
      });

      const data: AnalyzeResponsePayload = await response.json();

      if (!response.ok) {
        throw new Error(
          (data as unknown as { detail?: string }).detail || 'Inference execution failed'
        );
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

      if (data.ingestion_details?.document_id) {
        setActiveDocumentId(data.ingestion_details.document_id);
      }

      let metrics;
      if (data.ingestion_details && data.ingestion_details.usage) {
        metrics = {
          totalTokens: data.ingestion_details.usage.total_tokens || 0,
          tokensPerSecond: data.ingestion_details.timings?.predicted_per_second || 0,
        };
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
          metrics: metrics,
          ...(data.ingestion_details ? { ingestion_details: data.ingestion_details } : {}),
        } as any,
        convId
      );

      if (data.model?.includes('Fallback') || data.ingestion_details?.fallback_used) {
        notify({
          title: 'Reasoning Fallback Used',
          description: 'Primary model Qwen2.5-1.5B (192.168.0.5:8080) was unavailable. We have fallen back to the current model we are using for reasoning (Qwen3-4B-Thinking).',
          status: 'warning',
          duration: 7000,
        });
      }
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
      handleSendMessage(
        prevUserMsg.content,
        prevUserMsg.attachedImage,
        prevUserMsg.attachedDocument
      );
    }
  };

  // Citation click handler
  const handleCitationClick = (_docName: string, _page?: string) => {
    setSidePanelTab('trace');
    setSidePanelOpen(true);
  };

  const currentTitle = activeConversation?.title || 'New Conversation';
  const currentMessages = activeConversation?.messages || [];
  const lastAssistantMessage = [...currentMessages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background-full text-text-primary antialiased select-none font-sans">
      {/* Floating BoardUI Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          setActiveId(id);
          setViewMode('chat');
        }}
        onNewChat={() => {
          createConversation();
          setViewMode('chat');
        }}
        onDeleteConversation={(id) => deleteConversation(id)}
        onRenameConversation={(id, newTitle) => renameConversation(id, newTitle)}
        onOpenKnowledgeBase={() => {
          setSidePanelTab('kb');
          setSidePanelOpen(true);
        }}
        activeView={viewMode}
        status={status}
        onOpenStatusModal={() => setStatusModalOpen(true)}
        onToggleProviderMode={toggleProviderMode}
      />

      {/* Main Column */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
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
          isSidePanelOpen={sidePanelOpen}
          onToggleSidePanel={() => setSidePanelOpen((prev) => !prev)}
        />

        {viewMode === 'knowledge' ? (
          <KnowledgeBase onBackToChat={() => setViewMode('chat')} />
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            <ChatArea
              messages={currentMessages}
              onSelectStarterPrompt={(prompt) => handleSendMessage(prompt)}
              onRetryMessage={handleRetryMessage}
              onCitationClick={handleCitationClick}
            />

            <Composer
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              activeModel={
                status.reasoning_fallback_active
                  ? 'Qwen3-4B (Fallback)'
                  : status.active_reasoning_model || lastAssistantMessage?.model || 'Qwen2.5-1.5B'
              }
              isMockMode={status.mode === 'mock'}
              lastMetrics={lastAssistantMessage?.metrics}
            />
          </div>
        )}
      </main>

      {/* Third Side Panel (Knowledge Base + RAG Trace) */}
      <SidePanel
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        activeTab={sidePanelTab}
        onTabChange={(tab) => setSidePanelTab(tab)}
        isFullscreen={sidePanelFullscreen}
        onToggleFullscreen={() => setSidePanelFullscreen((prev) => !prev)}
        traceData={latestTraceData}
      />

      {/* Modals */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        conversations={conversations}
        onSelectConversation={(id) => {
          setActiveId(id);
          setViewMode('chat');
        }}
        onNewChat={() => {
          createConversation();
          setViewMode('chat');
        }}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onToggleTheme={() => {}}
        isDarkTheme={true}
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
        onToggleProviderMode={toggleProviderMode}
      />

      {/* Floating System Notifications (Model Online/Offline/Fallback) */}
      <NotificationToastContainer />
    </div>
  );
};
