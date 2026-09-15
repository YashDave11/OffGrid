import React, { useState, useEffect } from 'react';
import {
  RiBookOpenLine,
  RiDeleteBinLine,
  RiFilePdfLine,
  RiImageLine,
  RiCheckLine,
  RiRefreshLine,
  RiArrowLeftLine,
} from '@remixicon/react';
import { FileUpload } from './base/file-upload/file-upload';
import { StatusDot } from './base/badges/status-dot';
import { useCountUp } from '../hooks/useCountUp';
import { cx } from '@/utils/cx';

interface KBDocument {
  document_name: string;
  document_id: string;
  status: string;
  chunks: number;
}

interface KnowledgeBaseProps {
  onBackToChat?: () => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onBackToChat }) => {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/v1/knowledge/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch KB documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDeleteDocument = async (document_id: string, document_name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${document_name}" from the Knowledge Base? All indexed vector embeddings will be permanently purged.`
      )
    ) {
      return;
    }

    try {
      setDocuments((docs) =>
        docs.map((d) => (d.document_id === document_id ? { ...d, status: 'Deleting...' } : d))
      );
      const res = await fetch(`/v1/knowledge/documents/${document_id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchDocuments();
      } else {
        alert('Failed to delete document');
        await fetchDocuments();
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document');
      await fetchDocuments();
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadStatus('Uploading & Indexing...');
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        const res = await fetch('/v1/knowledge/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_name: file.name,
            content: base64Data,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setUploadStatus(
            data.details?.knowledge_base === 'duplicate'
              ? 'Document already exists in Knowledge Base'
              : 'Indexed ✓'
          );
          await fetchDocuments();
        } else {
          setUploadStatus('Upload failed');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadStatus('Upload failed');
    } finally {
      setTimeout(() => setUploadStatus(''), 4000);
    }
  };

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunks || 0), 0);
  const animatedChunks = useCountUp(totalChunks, 400);

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-separator-border">
        <div className="flex items-center gap-3">
          {onBackToChat && (
            <button
              type="button"
              onClick={onBackToChat}
              className="p-2 rounded-xl bg-background-secondary-default border border-border-button-default text-text-secondary hover:text-text-primary hover:bg-background-secondary-hover transition-colors"
              title="Return to Chat"
            >
              <RiArrowLeftLine className="size-4" />
            </button>
          )}
          <div className="flex size-10 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-500 border border-accent-500/20 shadow-xs">
            <RiBookOpenLine className="size-5" />
          </div>
          <div>
            <h1 className="text-title-2-medium font-bold text-text-primary">Knowledge Base</h1>
            <p className="text-caption-1-regular text-text-secondary">
              Persistent sovereign embeddings indexed with FAISS FlatIP.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchDocuments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-secondary-default border border-border-button-default text-caption-1-medium text-text-secondary hover:text-text-primary hover:bg-background-secondary-hover transition-colors"
        >
          <RiRefreshLine className={cx('size-3.5', isLoading && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-background-secondary-default border border-border-button-default shadow-xs space-y-1">
          <span className="text-caption-1-regular text-text-tertiary">Indexed Documents</span>
          <div className="text-title-2-medium font-bold text-text-primary">{documents.length}</div>
        </div>

        <div className="p-4 rounded-3xl bg-background-secondary-default border border-border-button-default shadow-xs space-y-1">
          <span className="text-caption-1-regular text-text-tertiary">Total Chunks</span>
          <div className="text-title-2-medium font-bold text-emerald-400 font-mono">
            {animatedChunks}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-background-secondary-default border border-border-button-default shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-caption-1-regular text-text-tertiary">Vector Device</span>
          <div className="text-body-medium font-bold text-text-primary uppercase tracking-wide">
            CPU (BAAI/bge-small)
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <div className="p-5 rounded-3xl bg-background-secondary-default border border-border-button-default shadow-xs space-y-3">
        <h3 className="text-body-medium font-semibold text-text-primary">
          Add New Industrial Document
        </h3>
        <p className="text-caption-1-regular text-text-secondary">
          Upload PDF reports, P&ID drawings, or technical spec sheets to embed and index them for
          cross-document RAG.
        </p>

        <FileUpload
          onUploadComplete={handleFileUpload}
          allowedExtensions={['pdf', 'png', 'jpg', 'jpeg', 'webp']}
          maxBytes={50 * 1024 * 1024}
        />

        {uploadStatus && (
          <div className="text-caption-1-medium text-emerald-400 flex items-center gap-1.5 pt-1">
            <RiCheckLine className="size-4" />
            <span>{uploadStatus}</span>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="space-y-3">
        <h3 className="text-body-medium font-semibold text-text-primary">Catalog Documents</h3>

        {isLoading && documents.length === 0 ? (
          <div className="py-12 text-center text-caption-1-regular text-text-tertiary">
            Loading document catalog...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 rounded-3xl bg-background-secondary-default border border-border-button-default text-center text-caption-1-regular text-text-tertiary">
            No documents in Knowledge Base yet.
          </div>
        ) : (
          <div className="rounded-3xl bg-background-secondary-default border border-border-button-default overflow-hidden shadow-xs">
            <div className="divide-y divide-border-separator-border">
              {documents.map((doc) => {
                const isImage = doc.document_name.toLowerCase().match(/\.(png|jpe?g|webp)$/);
                const isDeleting = doc.status.includes('Deleting');

                return (
                  <div
                    key={doc.document_id}
                    className="flex items-center justify-between p-4 hover:bg-background-secondary-hover/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cx(
                          'flex size-9 shrink-0 items-center justify-center rounded-xl',
                          isImage ? 'bg-sky-500/10 text-sky-400' : 'bg-rose-500/10 text-rose-400'
                        )}
                      >
                        {isImage ? (
                          <RiImageLine className="size-4.5" />
                        ) : (
                          <RiFilePdfLine className="size-4.5" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-body-2-medium font-semibold text-text-primary truncate">
                          {doc.document_name}
                        </span>
                        <div className="flex items-center gap-2 text-caption-1-regular text-text-tertiary">
                          <span className="flex items-center gap-1">
                            <StatusDot
                              status={isDeleting ? 'offline' : 'online'}
                              className="size-1.5"
                            />
                            <span>{doc.status}</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono text-emerald-400">{doc.chunks} chunks</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.document_id, doc.document_name)}
                      disabled={isDeleting}
                      className="p-2 rounded-xl text-text-tertiary hover:text-text-error-primary hover:bg-background-tertiary-default transition-colors"
                      title="Delete document"
                    >
                      <RiDeleteBinLine className="size-4.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
