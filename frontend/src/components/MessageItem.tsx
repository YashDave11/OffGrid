import React, { useState } from 'react';
import {
  RiFileCopyLine,
  RiCheckLine,
  RiRestartLine,
  RiAlertLine,
  RiSparklingLine,
  RiFilePdfLine,
  RiSpeedUpLine,
  RiDatabase2Line,
  RiZoomInLine,
} from '@remixicon/react';
import { ChatMessage } from '../types/workbench';
import { MarkdownContent } from './MarkdownContent';
import { ReasoningProcess } from './ReasoningProcess';
import { ImageLightboxModal } from './ImageLightboxModal';
import { cx } from '@/utils/cx';

const SendingTimer: React.FC = () => {
  const [elapsed, setElapsed] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="font-mono text-caption-1-medium text-text-tertiary">
      [{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}]
    </span>
  );
};

interface MessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
  onCitationClick?: (docName: string, page?: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onRetry, onCitationClick }) => {
  const [copied, setCopied] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  React.useEffect(() => {
    if (!imageModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImageModalOpen(false);
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

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1.5 my-3 w-full animate-fadeIn">
        <div className="flex items-center gap-2 text-caption-1-medium text-text-tertiary mr-1">
          <span>You</span>
          <span>•</span>
          <span>{formatTime(message.timestamp)}</span>
        </div>

        {/* Attached image if present */}
        {message.attachedImage && (
          <div className="relative group/img inline-block max-w-sm mb-1">
            <div
              onClick={() => setImageModalOpen(true)}
              className="relative overflow-hidden rounded-2xl border border-border-button-default bg-background-secondary-default cursor-pointer hover:border-emerald-500/40 transition-all shadow-xs"
              title="Click to view full resolution"
            >
              <img
                src={message.attachedImage}
                alt="Uploaded input"
                className="max-h-56 max-w-sm rounded-2xl object-cover group-hover/img:scale-[1.01] transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/35 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/85 text-white text-caption-1-medium border border-white/15 shadow-lg backdrop-blur-sm">
                  <RiZoomInLine className="size-3.5 text-emerald-400" />
                  <span>Click to Enlarge</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Attached PDF document if present */}
        {message.attachedDocument && (
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-text-primary text-caption-1-medium mb-1 shadow-xs">
            <RiFilePdfLine className="size-5 text-rose-400 shrink-0" />
            <span className="font-semibold max-w-xs truncate">{message.attachedDocument.name}</span>
          </div>
        )}

        {/* User text bubble */}
        {message.content && (
          <div className="max-w-[80%] rounded-2xl bg-background-primary-default border border-border-button-default px-4 py-2.5 text-body-regular text-text-primary shadow-xs break-words">
            {message.content}
          </div>
        )}

        {/* Image Modal Lightbox */}
        {message.attachedImage && (
          <ImageLightboxModal
            isOpen={imageModalOpen}
            onClose={() => setImageModalOpen(false)}
            src={message.attachedImage}
            title="Uploaded Input Image"
          />
        )}
      </div>
    );
  }

  // Assistant message
  return (
    <div className="group/message flex gap-3.5 my-4 w-full animate-fadeIn">
      {/* Avatar */}
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-background-secondary-default border border-border-button-default text-emerald-400 shadow-xs mt-0.5">
        <RiSparklingLine className="size-4.5" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Meta Header */}
        <div className="flex items-center gap-2 text-caption-1-medium text-text-tertiary">
          <span className="font-semibold text-text-primary">MRPL Sovereign AI</span>
          <span>•</span>
          <span>{formatTime(message.timestamp)}</span>
          {message.model && (
            <span className="px-2 py-0.5 rounded-full bg-background-secondary-default text-text-secondary text-[11px] border border-border-button-default">
              {message.model}
            </span>
          )}
        </div>

        {/* Attached Image (diagram or input) */}
        {message.attachedImage && (
          <div className="relative group/img inline-block max-w-lg my-1">
            <div
              onClick={() => setImageModalOpen(true)}
              className="relative overflow-hidden rounded-2xl border border-border-button-default bg-background-secondary-default cursor-pointer hover:border-emerald-500/40 transition-all shadow-xs"
              title="Click to view full resolution diagram"
            >
              <img
                src={message.attachedImage}
                alt="Model visual output"
                className="max-h-80 max-w-full rounded-2xl object-cover group-hover/img:scale-[1.01] transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/35 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900/85 text-white text-caption-1-medium border border-white/15 shadow-lg backdrop-blur-sm">
                  <RiZoomInLine className="size-4 text-emerald-400" />
                  <span>Click to Enlarge Diagram</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Reasoning Process Drawer */}
        {message.reasoning && (
          <ReasoningProcess reasoning={message.reasoning} steps={message.steps} />
        )}

        {/* In-flight execution state */}
        {message.status === 'sending' && (
          <div className="flex items-center gap-2.5 py-1 text-text-secondary text-caption-1-regular">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="italic">Synthesizing telemetry & industrial knowledge...</span>
            <SendingTimer />
          </div>
        )}

        {/* Error state */}
        {message.status === 'error' && (
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-body-2-regular">
            <div className="flex items-center gap-2 font-semibold">
              <RiAlertLine className="size-4" />
              <span>Pipeline Inference Failure</span>
            </div>
            <p>{message.error || 'An error occurred during sovereign model inference.'}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1.5 self-start px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-caption-1-medium transition-colors"
              >
                <RiRestartLine className="size-3.5" />
                <span>Retry Request</span>
              </button>
            )}
          </div>
        )}

        {/* Main Content */}
        {message.content && (
          <div className="text-body-regular text-text-primary">
            <MarkdownContent content={message.content} onCitationClick={onCitationClick} />
          </div>
        )}

        {/* Action Row & Metrics */}
        <div className="flex items-center justify-between pt-1 opacity-80 group-hover/message:opacity-100 transition-opacity">
          {message.status !== 'sending' && message.content && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMessage}
                className={cx(
                  'flex items-center gap-1 px-2 py-1 rounded-lg text-caption-1-medium text-text-tertiary hover:text-text-primary hover:bg-background-secondary-hover transition-colors cursor-pointer',
                  copied && 'text-emerald-400 font-semibold'
                )}
                title="Copy response"
              >
                {copied ? (
                  <>
                    <RiCheckLine className="size-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <RiFileCopyLine className="size-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

          {message.metrics && (
            <div className="flex items-center gap-3 font-mono text-[11px] text-text-tertiary">
              <span className="flex items-center gap-1 text-sky-400">
                <RiSpeedUpLine className="size-3" />
                <span>{message.metrics.tokensPerSecond.toFixed(1)} t/s</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-purple-400">
                <RiDatabase2Line className="size-3" />
                <span>{message.metrics.totalTokens} tokens</span>
              </span>
            </div>
          )}
        </div>

        {/* Lightbox Modal for Assistant Diagram / Visual Output */}
        {message.attachedImage && (
          <ImageLightboxModal
            isOpen={imageModalOpen}
            onClose={() => setImageModalOpen(false)}
            src={message.attachedImage}
            title={message.model ? `${message.model} Generated Diagram` : 'Generated Industrial Diagram'}
          />
        )}
      </div>
    </div>
  );
};
