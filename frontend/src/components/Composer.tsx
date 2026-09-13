import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Eye, Cpu, FileText, FilePlus } from 'lucide-react';

interface ComposerProps {
  onSendMessage: (text: string, base64Image?: string, attachedDocument?: { name: string, data: string }) => void;
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
  const [attachedDocument, setAttachedDocument] = useState<{ name: string, data: string } | null>(null);
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
      alert('Please select an image or PDF file.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearAttachment = () => {
    setBase64Image(null);
    setImageFileName(null);
    setAttachedDocument(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Submit
  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !base64Image && !attachedDocument) || isLoading || disabled) {
      return;
    }

    let defaultText = 'Analyze this input';
    if (base64Image) defaultText = 'Analyze this image';
    if (attachedDocument) defaultText = 'Extract text from this document';

    onSendMessage(trimmed || defaultText, base64Image || undefined, attachedDocument || undefined);
    setText('');
    clearAttachment();
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
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        e.preventDefault();
        handleFile(file);
      }
    }
  };

  const hasImage = Boolean(base64Image);
  const hasDocument = Boolean(attachedDocument);
  const canSend = (text.trim().length > 0 || hasImage || hasDocument) && !isLoading && !disabled;

  return (
    <div className="composer-dock">
      <div
        className="composer-box"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Attachment Preview Chip */}
        {(hasImage || hasDocument) && (
          <div className="composer-image-preview">
            <div className="preview-thumb-card" style={hasDocument ? { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card-hover)', width: '60px', height: '60px', borderRadius: '6px' } : undefined}>
              {hasImage && <img src={base64Image!} alt="Upload preview" className="preview-img" />}
              {hasDocument && <FileText size={24} color="var(--primary-color)" />}
              
              <button
                type="button"
                className="btn-remove-preview"
                onClick={clearAttachment}
                title="Remove attached file"
              >
                <X size={12} />
              </button>
            </div>
            <div className="preview-meta">
              <span className="preview-tag">{hasImage ? 'Gemma Vision Input' : 'Document Input'}</span>
              <span>{imageFileName || attachedDocument?.name || 'Attached File'}</span>
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
              : hasDocument 
              ? 'Add instructions for document processing...'
              : 'Ask MRPL Sovereign AI or attach files (Enter to send, Shift+Enter for newline)...'
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
              accept="image/*, application/pdf"
              style={{ display: 'none' }}
              id="composer-file-input"
            />
            <button
              type="button"
              className="btn-composer-attach"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image or PDF"
              disabled={isLoading || disabled}
            >
              <FilePlus size={15} />
              <span>Attach File</span>
            </button>

            {/* Model Capability Badge */}
            <div className={`capability-pill ${hasImage ? 'vision' : hasDocument ? 'document' : 'reasoning'}`}>
              {hasImage ? (
                <>
                  <Eye size={12} />
                  <span>Vision // Gemma-3-4B</span>
                </>
              ) : hasDocument ? (
                <>
                  <FileText size={12} />
                  <span>Document // PyMuPDF</span>
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
