import React, { useState } from 'react';
import { Copy, Check, RotateCcw, AlertTriangle, Sparkles, User, FileText, X } from 'lucide-react';
import { ChatMessage } from '../types/workbench';
import { MarkdownContent } from './MarkdownContent';
import { ReasoningProcess } from './ReasoningProcess';

const SendingTimer: React.FC = () => {
  const [elapsed, setElapsed] = React.useState(0);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px', fontFamily: 'monospace' }}>
      [{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}]
    </span>
  );
};

interface MessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Close image modal on Escape key
  React.useEffect(() => {
    if (!imageModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setImageModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageModalOpen]);

  const isUser = message.role === 'user';

  const handleCopyMessage = async () => {
    try {
      const fullText = message.reasoning
        ? `<think>\n${message.reasoning}\n</think>\n\n${message.content}`
        : message.content;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy message', e);
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>

      <div className="message-body-wrap">
        <div className="message-meta">
          <span className="message-author">{isUser ? 'You' : 'MRPL Sovereign AI'}</span>
          <span className="message-time">{formatTime(message.timestamp)}</span>
          {!isUser && message.model && (
            <span className="model-chip">{message.model}</span>
          )}
        </div>

        {/* Attached image if present */}
        {message.attachedImage && (
          <div>
            <img
              src={message.attachedImage}
              alt="Uploaded input for Gemma Vision"
              className="message-attached-image"
              onClick={() => setImageModalOpen(true)}
              title="Click to enlarge image"
            />
            {imageModalOpen && (
              <div
                className="modal-backdrop image-lightbox"
                onClick={() => setImageModalOpen(false)}
              >
                <div 
                  className="lightbox-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="lightbox-close-btn"
                    onClick={() => setImageModalOpen(false)}
                    aria-label="Close enlarged image"
                    title="Close (Esc)"
                  >
                    <X size={20} />
                  </button>
                  <img
                    src={message.attachedImage}
                    alt="Enlarged view"
                    className="lightbox-img"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attached document if present */}
        {message.attachedDocument && (
          <div className="message-attached-document" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            marginBottom: '12px',
            width: 'fit-content',
            maxWidth: '100%'
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'rgba(239, 68, 68, 0.12)',
              borderRadius: '6px',
              padding: '6px 8px'
            }}>
              <FileText size={22} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#ef4444', letterSpacing: '0.05em', marginTop: '-2px' }}>PDF</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {message.attachedDocument.name}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                PDF Document (Extracted & Indexed)
              </span>
            </div>
          </div>
        )}

        {/* Reasoning process accordion */}
        {!isUser && message.reasoning && (
          <ReasoningProcess
            reasoning={message.reasoning}
            steps={message.steps}
          />
        )}

        {/* Sending state */}
        {message.status === 'sending' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <span className="status-dot checking" />
            <span style={{ fontSize: '13px', fontStyle: 'italic' }}>
              Executing sovereign pipeline...
            </span>
            <SendingTimer />
          </div>
        )}

        {/* Error state */}
        {message.status === 'error' && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '6px',
            padding: '10px 14px',
            color: '#fca5a5',
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <AlertTriangle size={15} />
              <span>Pipeline Failure</span>
            </div>
            <div>{message.error || 'An error occurred during inference.'}</div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="btn-msg-action"
                style={{
                  alignSelf: 'flex-start',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#fee2e2',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                <RotateCcw size={12} />
                <span>Retry Request</span>
              </button>
            )}
          </div>
        )}

        {/* Markdown Content */}
        {message.content && (
          <div className="message-bubble">
            <MarkdownContent content={message.content} />
          </div>
        )}

        {/* Message Actions */}
        {message.status !== 'sending' && message.content && (
          <div className="message-actions">
            <button
              className={`btn-msg-action ${copied ? 'copied' : ''}`}
              onClick={handleCopyMessage}
              type="button"
              title="Copy message"
            >
              {copied ? (
                <>
                  <Check size={12} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
