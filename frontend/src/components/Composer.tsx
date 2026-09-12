import React, { useState, useRef, useEffect } from 'react';
import { ImagePlus, Send, X, Eye, Cpu } from 'lucide-react';

interface ComposerProps {
  onSendMessage: (text: string, base64Image?: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [text]);

  // Focus textarea on mount or when loading finishes
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // Handle File selection
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPEG, WebP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result as string;
      setBase64Image(res);
      setImageFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearImage = () => {
    setBase64Image(null);
    setImageFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Submit
  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !base64Image) || isLoading || disabled) {
      return;
    }

    onSendMessage(trimmed || 'Analyze this image', base64Image || undefined);
    setText('');
    clearImage();
  };

  // Handle Key Down (Enter to send, Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Clipboard Paste
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        handleFile(file);
      }
    }
  };

  const hasImage = Boolean(base64Image);
  const canSend = (text.trim().length > 0 || hasImage) && !isLoading && !disabled;

  return (
    <div className="composer-dock">
      <div
        className="composer-box"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Image Preview Chip if attached */}
        {hasImage && (
          <div className="composer-image-preview">
            <div className="preview-thumb-card">
              <img src={base64Image!} alt="Upload preview" className="preview-img" />
              <button
                type="button"
                className="btn-remove-preview"
                onClick={clearImage}
                title="Remove attached image"
              >
                <X size={12} />
              </button>
            </div>
            <div className="preview-meta">
              <span className="preview-tag">Gemma Vision Input</span>
              <span>{imageFileName || 'Pasted Image'}</span>
            </div>
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            hasImage
              ? 'Add an instruction for Gemma Vision model, or press Enter...'
              : 'Ask MRPL Sovereign AI or give instructions (Enter to send, Shift+Enter for newline)...'
          }
          rows={1}
          disabled={disabled || isLoading}
        />

        {/* Toolbar */}
        <div className="composer-toolbar">
          <div className="composer-tools-left">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              style={{ display: 'none' }}
              id="composer-file-input"
            />
            <button
              type="button"
              className="btn-composer-attach"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image for Gemma Vision"
              disabled={isLoading || disabled}
            >
              <ImagePlus size={15} />
              <span>Attach Image</span>
            </button>

            {/* Model Capability Badge */}
            <div className={`capability-pill ${hasImage ? 'vision' : 'reasoning'}`}>
              {hasImage ? (
                <>
                  <Eye size={12} />
                  <span>Vision // Gemma-3-4B</span>
                </>
              ) : (
                <>
                  <Cpu size={12} />
                  <span>Reasoning // Qwen3-4B</span>
                </>
              )}
            </div>
          </div>

          <div className="composer-tools-right">
            <button
              type="button"
              className="btn-send"
              onClick={handleSend}
              disabled={!canSend}
              title={isLoading ? 'Processing...' : 'Send instruction (Enter)'}
            >
              {isLoading ? (
                <>
                  <span className="status-dot checking" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <Send size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
