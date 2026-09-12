import { useState, useEffect, useCallback } from 'react';
import { Conversation, ChatMessage } from '../types/workbench';

const STORAGE_KEY = 'mrpl_sovereign_conversations_v2';
const ACTIVE_KEY = 'mrpl_sovereign_active_id_v2';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load conversations from localStorage', e);
    }
    return [];
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_KEY) || null;
    } catch {
      return null;
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to persist conversations', e);
    }
  }, [conversations]);

  useEffect(() => {
    try {
      if (activeId) {
        localStorage.setItem(ACTIVE_KEY, activeId);
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
    } catch (e) {
      console.error('Failed to persist activeId', e);
    }
  }, [activeId]);

  // Active conversation object
  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // Create new conversation
  const createConversation = useCallback((initialTitle?: string): string => {
    const newId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newConv: Conversation = {
      id: newId,
      title: initialTitle || 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newId);
    return newId;
  }, []);

  // Add message to active or create if none
  const addMessage = useCallback(
    (message: ChatMessage, targetConversationId?: string) => {
      setConversations((prev) => {
        let convId = targetConversationId || activeId;
        let list = [...prev];

        // If no active conversation exists, create one
        if (!convId || !list.some((c) => c.id === convId)) {
          const newId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
          const autoTitle = message.content.slice(0, 38).trim() || 'New Conversation';
          const newConv: Conversation = {
            id: newId,
            title: autoTitle,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [message],
          };
          setActiveId(newId);
          return [newConv, ...list];
        }

        return list.map((conv) => {
          if (conv.id === convId) {
            // Auto update title from first user message if still default
            let title = conv.title;
            if (conv.messages.length === 0 && message.role === 'user') {
              title = message.content.slice(0, 38).trim() || 'Conversation';
            }
            return {
              ...conv,
              title,
              updatedAt: Date.now(),
              messages: [...conv.messages, message],
            };
          }
          return conv;
        });
      });
    },
    [activeId]
  );

  // Update a specific message (e.g. status, completed result, steps, reasoning)
  const updateMessage = useCallback(
    (messageId: string, patch: Partial<ChatMessage>, targetConversationId?: string) => {
      setConversations((prev) => {
        const convId = targetConversationId || activeId;
        return prev.map((conv) => {
          if (conv.id === convId) {
            return {
              ...conv,
              updatedAt: Date.now(),
              messages: conv.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
            };
          }
          return conv;
        });
      });
    },
    [activeId]
  );

  // Delete a conversation
  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        if (activeId === id) {
          setActiveId(filtered.length > 0 ? filtered[0].id : null);
        }
        return filtered;
      });
    },
    [activeId]
  );

  // Rename conversation
  const renameConversation = useCallback((id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim(), updatedAt: Date.now() } : c))
    );
  }, []);

  // Clear messages in active conversation
  const clearActiveConversation = useCallback(() => {
    if (!activeId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, messages: [], updatedAt: Date.now() } : c))
    );
  }, [activeId]);

  // Export conversation
  const exportConversation = useCallback(
    (id: string, format: 'markdown' | 'json') => {
      const conv = conversations.find((c) => c.id === id);
      if (!conv) return;

      let filename = `mrpl_chat_${conv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
      let blob: Blob;

      if (format === 'json') {
        filename += '.json';
        blob = new Blob([JSON.stringify(conv, null, 2)], { type: 'application/json' });
      } else {
        filename += '.md';
        const mdLines = [
          `# ${conv.title}`,
          `*Created: ${new Date(conv.createdAt).toLocaleString()}*`,
          `*Exported from MRPL Sovereign AI Workbench*`,
          '',
          '---',
          '',
        ];

        conv.messages.forEach((msg) => {
          const role = msg.role === 'user' ? '### User' : `### Assistant (${msg.model || 'AI'})`;
          mdLines.push(role);
          if (msg.reasoning) {
            mdLines.push(`> **Reasoning Process:**\n> ${msg.reasoning.replace(/\n/g, '\n> ')}`);
            mdLines.push('');
          }
          mdLines.push(msg.content);
          mdLines.push('');
        });

        blob = new Blob([mdLines.join('\n')], { type: 'text/markdown' });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [conversations]
  );

  return {
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
  };
}
