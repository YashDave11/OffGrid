import React, { useState, useRef, useEffect } from 'react';
import {
  RiAttachment2,
  RiArrowUpLine,
  RiStopFill,
  RiCloseLine,
  RiSparklingLine,
  RiFilePdfLine,
  RiCpuLine,
  RiEyeLine,
  RiSpeedUpLine,
  RiDatabase2Line,
} from '@remixicon/react';
import { ComposerLoader } from './application/composer-loader/composer-loader';
import { AgentThinking } from './application/agent-thinking/agent-thinking';
import { useCountUp } from '../hooks/useCountUp';
import { cx } from '@/utils/cx';

interface ComposerProps {
  onSendMessage: (
    text: string,
    base64Image?: string,
    attachedDocument?: { name: string; data: string },
    isDiagramMode?: boolean
  ) => void;
  isLoading: boolean;
  disabled?: boolean;
  activeModel?: string;
  isMockMode?: boolean;
  lastMetrics?: {
    totalTokens: number;
    tokensPerSecond: number;
  };
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
  activeModel = 'Qwen3-4B-Thinking',
  isMockMode = false,
  lastMetrics,
}) => {
  const [text, setText] = useState('');
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [attachedDocument, setAttachedDocument] = useState<{ name: string; data: string } | null>(null);
  const [isDiagramMode, setIsDiagramMode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animated metrics
  const animatedTokens = useCountUp(lastMetrics?.totalTokens || 0, 400);
  const animatedTps = useCountUp(Math.round(lastMetrics?.tokensPerSecond || 0), 400);

  // Focus textarea when done loading
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // Handle File selection
  const handleFile = (file: File) => {
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result as string;
        setAttachedDocument({ name: file.name, data: res });
        setBase64Image(null);
        setImageFileName(null);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result as string;
        setBase64Image(res);
        setImageFileName(file.name);
        setAttachedDocument(null);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select an image or PDF document.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearAttachment = () => {
    setBase64Image(null);
    setImageFileName(null);
    setAttachedDocument(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !base64Image && !attachedDocument) || isLoading || disabled) {
      return;
    }

    let defaultText = 'Analyze this input';
    if (base64Image) defaultText = 'Analyze this image';
    if (attachedDocument) defaultText = 'Extract text from this document';
    if (isDiagramMode) defaultText = 'Generate a diagram';

    onSendMessage(
      trimmed || defaultText,
      base64Image || undefined,
      attachedDocument || undefined,
      isDiagramMode
    );
    setText('');
    clearAttachment();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasImage = Boolean(base64Image);
  const hasDocument = Boolean(attachedDocument);
  const canSend = (text.trim().length > 0 || hasImage || hasDocument) && !isLoading && !disabled;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 flex flex-col gap-2 relative">
      {/* Agent Thinking Indicator (Visible during active inference) */}
      {isLoading && (
        <div className="flex items-center justify-center py-1 animate-fadeIn">
          <AgentThinking
            variant="infinity"
            label="Executing sovereign pipeline..."
            tone="default"
            shimmer
            showTimer
          />
        </div>
      )}

      {/* Attachment Preview Chip */}
      {(hasImage || hasDocument) && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-background-secondary-default border border-border-button-default w-fit shadow-xs mb-1">
          {hasImage && (
            <div className="flex items-center gap-2">
              <img src={base64Image!} alt="Upload preview" className="size-6 object-cover rounded-md" />
              <span className="text-caption-1-medium text-text-primary max-w-[200px] truncate">
                {imageFileName || 'Image attached'}
              </span>
            </div>
          )}
          {hasDocument && (
            <div className="flex items-center gap-2 text-rose-400">
              <RiFilePdfLine className="size-5 shrink-0" />
              <span className="text-caption-1-medium text-text-primary max-w-[240px] truncate">
                {attachedDocument?.name || 'Document.pdf'}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={clearAttachment}
            className="p-1 rounded-full text-foreground-icon-secondary hover:text-text-primary hover:bg-background-tertiary-default transition-colors"
            title="Remove attachment"
          >
            <RiCloseLine className="size-3.5" />
          </button>
        </div>
      )}

      {/* Composer Loader with orbiting light band wrapping the pill form */}
      <ComposerLoader active={isLoading}>
        <div
          className={cx(
            'flex min-h-[52px] w-full items-center gap-2.5 rounded-full p-2 border border-border-button-default transition-colors',
            isLoading ? 'bg-transparent' : 'bg-background-primary-default shadow-xs'
          )}
        >
          {/* File attachment button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*, application/pdf"
            className="hidden"
            id="composer-file-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || disabled}
            aria-label="Add attachment"
            title="Attach Image or PDF"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-background-secondary-default text-foreground-icon-primary transition-colors hover:bg-background-secondary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RiAttachment2 className="size-4.5" />
          </button>

          {/* Diagram mode toggle button */}
          <button
            type="button"
            onClick={() => setIsDiagramMode(!isDiagramMode)}
            disabled={isLoading || disabled}
            aria-label="Toggle diagram mode"
            title="Toggle Diagram Generation Mode"
            className={cx(
              'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              isDiagramMode
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                : 'bg-background-secondary-default text-foreground-icon-secondary hover:bg-background-secondary-hover'
            )}
          >
            <RiSparklingLine className="size-4" />
          </button>

          {/* Text Area */}
          <label className="sr-only" htmlFor="agent-composer-textarea">
            Message
          </label>
          <textarea
            id="agent-composer-textarea"
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={
              hasImage
                ? 'Ask Gemma Vision about this image, or press Enter...'
                : hasDocument
                ? 'Ask MRPL Sovereign AI about this document...'
                : isDiagramMode
                ? 'Describe the technical diagram to generate...'
                : 'Ask MRPL Sovereign AI or attach industrial documents (Enter to send)...'
            }
            className="flex-1 bg-transparent resize-none outline-none py-1.5 text-body-regular text-text-primary placeholder:text-text-placeholder max-h-32 min-h-[24px]"
          />

          {/* Active capability badge inside pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background-secondary-default text-caption-1-medium text-text-secondary shrink-0">
            {hasImage ? (
              <>
                <RiEyeLine className="size-3.5 text-sky-400" />
                <span className="text-sky-400">Gemma Vision</span>
              </>
            ) : hasDocument ? (
              <>
                <RiFilePdfLine className="size-3.5 text-rose-400" />
                <span className="text-rose-400">PyMuPDF</span>
              </>
            ) : (
              <>
                <RiCpuLine className="size-3.5 text-emerald-400" />
                <span>{activeModel.split('-')[0] || 'Qwen'}</span>
              </>
            )}
          </div>

          {/* Send / Stop button */}
          <div className="flex shrink-0 items-center pl-1">
            {isLoading ? (
              <button
                type="button"
                aria-label="Agent processing"
                className="flex size-9 cursor-not-allowed items-center justify-center rounded-full bg-background-secondary-default text-foreground-icon-secondary"
              >
                <RiStopFill className="size-4 animate-pulse" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send message"
                className={cx(
                  'flex size-9 cursor-pointer items-center justify-center rounded-full bg-button-primary text-white transition-opacity shadow-xs',
                  !canSend && 'cursor-not-allowed opacity-35'
                )}
              >
                <RiArrowUpLine className="size-5" />
              </button>
            )}
          </div>
        </div>
      </ComposerLoader>

      {/* Status Bar below Composer */}
      <div className="flex items-center justify-between px-3 text-caption-1-medium text-text-tertiary">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <RiCpuLine className="size-3.5 text-foreground-icon-secondary" />
            <span>{activeModel}</span>
          </span>
          <span className="text-border-separator-border">•</span>
          <span className="flex items-center gap-1">
            <span
              className={cx(
                'size-1.5 rounded-full',
                isMockMode ? 'bg-amber-400' : 'bg-emerald-400'
              )}
            />
            <span>{isMockMode ? 'Mock Standby' : 'Remote Hub'}</span>
          </span>
        </div>

        {lastMetrics && lastMetrics.totalTokens > 0 && (
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1 text-sky-400">
              <RiSpeedUpLine className="size-3.5" />
              <span>{animatedTps} t/s</span>
            </span>
            <span className="text-border-separator-border">•</span>
            <span className="flex items-center gap-1 text-purple-400">
              <RiDatabase2Line className="size-3.5" />
              <span>{animatedTokens} tokens</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
