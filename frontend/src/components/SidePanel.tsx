import React, { useState, useEffect } from 'react';
import {
  RiBookOpenLine,
  RiRouteLine,
  RiCloseLine,
  RiFullscreenLine,
  RiFullscreenExitLine,
  RiDeleteBinLine,
  RiFilePdfLine,
  RiImageLine,
  RiCheckLine,
  RiRefreshLine,
} from '@remixicon/react';
import { FileUpload } from './base/file-upload/file-upload';
import { StatusDot } from './base/badges/status-dot';
import { LogRow, useLogMotion } from './application/agent-log/agent-log';
import { useCountUp } from '../hooks/useCountUp';
import { cx } from '@/utils/cx';

interface KBDocument {
  document_name: string;
  document_id: string;
  status: string;
  chunks: number;
}

interface RetrievalTraceData {
  document_id?: string;
  source?: string;
  top_k?: number;
  threshold_applied?: number;
  chunks_injected?: number;
  timing?: {
    embedding_ms?: number;
    search_ms?: number;
    context_ms?: number;
    kb_search_ms?: number;
  };
  sample_chunks?: Array<{
    document?: string;
    page?: number | string;
    similarity?: number;
    text?: string;
  }>;
}

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: 'kb' | 'trace';
  onTabChange?: (tab: 'kb' | 'trace') => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  traceData?: RetrievalTraceData | null;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  activeTab = 'kb',
  onTabChange,
  isFullscreen = false,
  onToggleFullscreen,
  traceData,
}) => {
  const [tab, setTab] = useState<'kb' | 'trace'>(activeTab);
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const reduceMotion = useLogMotion();

  useEffect(() => {
    if (activeTab) setTab(activeTab);
  }, [activeTab]);

  const handleTabSelect = (newTab: 'kb' | 'trace') => {
    setTab(newTab);
    onTabChange?.(newTab);
  };

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
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

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
              ? 'Document already exists'
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

  if (!isOpen) return null;

  return (
    <aside
      className={cx(
        'flex flex-col shrink-0 h-[calc(100vh-24px)] my-3 mr-3 rounded-3xl bg-background-secondary-default border border-border-button-default shadow-sidebar transition-all duration-300 ease-in-out z-20 overflow-hidden',
        isFullscreen ? 'w-[calc(100%-300px)]' : 'w-[420px]'
      )}
    >
      {/* Top Header & Tab Switcher */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-separator-border bg-background-secondary-default shrink-0">
        {/* Pill Tab Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-background-primary-default border border-border-button-default shadow-2xs">
          <button
            type="button"
            onClick={() => handleTabSelect('kb')}
            className={cx(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-caption-1-medium transition-all cursor-pointer',
              tab === 'kb'
                ? 'bg-accent-500 text-white font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <RiBookOpenLine className="size-3.5" />
            <span>Knowledge Base</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSelect('trace')}
            className={cx(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-caption-1-medium transition-all cursor-pointer',
              tab === 'trace'
                ? 'bg-accent-500 text-white font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <RiRouteLine className="size-3.5" />
            <span>RAG Trace</span>
          </button>
        </div>

        {/* Panel controls */}
        <div className="flex items-center gap-1">
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg text-foreground-icon-secondary hover:text-text-primary hover:bg-background-tertiary-default transition-colors"
              title={isFullscreen ? 'Restore standard width' : 'Expand full screen'}
            >
              {isFullscreen ? (
                <RiFullscreenExitLine className="size-4" />
              ) : (
                <RiFullscreenLine className="size-4" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-foreground-icon-secondary hover:text-text-primary hover:bg-background-tertiary-default transition-colors"
            title="Close side panel"
          >
            <RiCloseLine className="size-4" />
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'kb' ? (
          <div className="space-y-4">
            {/* Stats Overview */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-background-primary-default border border-border-button-default">
              <div className="flex flex-col">
                <span className="text-caption-1-regular text-text-tertiary">Indexed Documents</span>
                <span className="text-title-3-semibold text-text-primary">{documents.length}</span>
              </div>
              <div className="h-8 w-px bg-border-separator-border" />
              <div className="flex flex-col">
                <span className="text-caption-1-regular text-text-tertiary">Vector Chunks</span>
                <span className="text-title-3-semibold text-emerald-400 font-mono">
                  {animatedChunks}
                </span>
              </div>
              <button
                type="button"
                onClick={fetchDocuments}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-background-secondary-hover transition-colors"
                title="Refresh documents"
              >
                <RiRefreshLine className={cx('size-4', isLoading && 'animate-spin')} />
              </button>
            </div>

            {/* File Upload Box */}
            <div className="space-y-2">
              <span className="text-caption-1-semibold text-text-secondary uppercase tracking-wider">
                Upload & Ingest Document
              </span>
              <FileUpload
                onUploadComplete={handleFileUpload}
                allowedExtensions={['pdf', 'png', 'jpg', 'jpeg', 'webp']}
                maxBytes={50 * 1024 * 1024}
              />
              {uploadStatus && (
                <div className="text-caption-1-medium text-emerald-400 flex items-center gap-1.5 pt-1">
                  <RiCheckLine className="size-3.5" />
                  <span>{uploadStatus}</span>
                </div>
              )}
            </div>

            {/* Document Catalog */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-caption-1-semibold text-text-secondary uppercase tracking-wider">
                  Ingested Knowledge Base
                </span>
                <span className="text-[11px] text-text-tertiary">FAISS FlatIP Index</span>
              </div>

              {isLoading && documents.length === 0 ? (
                <div className="py-12 text-center text-caption-1-regular text-text-tertiary">
                  <span className="size-2 rounded-full bg-accent-500 inline-block animate-ping mr-2" />
                  Loading document catalog...
                </div>
              ) : documents.length === 0 ? (
                <div className="p-6 rounded-2xl bg-background-primary-default border border-border-button-default text-center text-caption-1-regular text-text-tertiary">
                  No documents in the sovereign knowledge base yet. Upload an industrial PDF or
                  schematic image above to begin.
                </div>
              ) : (
                <ul className="space-y-2">
                  {documents.map((doc) => {
                    const isImage = doc.document_name
                      .toLowerCase()
                      .match(/\.(png|jpe?g|webp)$/);
                    const isDeleting = doc.status.includes('Deleting');

                    return (
                      <li
                        key={doc.document_id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-background-primary-default border border-border-button-default hover:border-border-button-hover transition-all shadow-2xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cx(
                              'flex size-8 shrink-0 items-center justify-center rounded-xl',
                              isImage
                                ? 'bg-sky-500/10 text-sky-400'
                                : 'bg-rose-500/10 text-rose-400'
                            )}
                          >
                            {isImage ? (
                              <RiImageLine className="size-4" />
                            ) : (
                              <RiFilePdfLine className="size-4" />
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
                              <span className="font-mono text-[11px] text-emerald-400">
                                {doc.chunks} chunks
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteDocument(doc.document_id, doc.document_name)
                          }
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-text-error-primary hover:bg-background-secondary-hover transition-colors disabled:cursor-not-allowed opacity-60 group-hover:opacity-100"
                          title="Delete from Knowledge Base"
                        >
                          <RiDeleteBinLine className="size-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          /* Tab 2: RAG Trace */
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-title-3-semibold text-text-primary">Retrieval & Reasoning Trace</h3>
              <p className="text-caption-1-regular text-text-secondary">
                Live inspection of RAG embeddings, cosine distances, and document chunk injection.
              </p>
            </div>

            {traceData ? (
              <div className="space-y-4">
                {/* Meta summary card */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-background-primary-default border border-border-button-default text-caption-1-medium">
                  <div>
                    <span className="text-text-tertiary block text-[10.5px]">Source Layer</span>
                    <span className="text-text-primary font-semibold capitalize">
                      {traceData.source || 'Knowledge Base'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block text-[10.5px]">Top-K Candidates</span>
                    <span className="text-emerald-400 font-mono font-semibold">
                      {traceData.top_k ?? 5}
                    </span>
                  </div>
                  {traceData.timing && (
                    <>
                      <div>
                        <span className="text-text-tertiary block text-[10.5px]">Vector Search</span>
                        <span className="text-sky-400 font-mono">
                          {traceData.timing.search_ms ?? traceData.timing.kb_search_ms ?? 0} ms
                        </span>
                      </div>
                      <div>
                        <span className="text-text-tertiary block text-[10.5px]">Embedding Gen</span>
                        <span className="text-purple-400 font-mono">
                          {traceData.timing.embedding_ms ?? 0} ms
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Chunks Tree using AgentLog */}
                {traceData.sample_chunks && traceData.sample_chunks.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-caption-1-semibold text-text-secondary uppercase tracking-wider">
                      Retrieved Chunks
                    </span>
                    <ul className="space-y-2">
                      {traceData.sample_chunks.map((chunk, i) => (
                        <LogRow
                          key={i}
                          first={i === 0}
                          last={i === (traceData.sample_chunks?.length || 1) - 1}
                          reduce={reduceMotion}
                        >
                          <div className="p-2.5 rounded-xl bg-background-primary-default border border-border-button-default text-caption-1-regular space-y-1">
                            <div className="flex items-center justify-between text-text-tertiary text-[11px]">
                              <span className="font-semibold text-text-secondary truncate max-w-[180px]">
                                {chunk.document || 'Document'}
                              </span>
                              {chunk.similarity !== undefined && (
                                <span className="font-mono text-emerald-400">
                                  Sim: {(chunk.similarity * 100).toFixed(1)}%
                                </span>
                              )}
                            </div>
                            <p className="text-text-secondary line-clamp-3 font-mono text-[11px]">
                              {chunk.text}
                            </p>
                          </div>
                        </LogRow>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-background-primary-default border border-border-button-default text-center space-y-2">
                <RiRouteLine className="size-8 text-text-tertiary mx-auto opacity-50" />
                <p className="text-caption-1-regular text-text-tertiary">
                  No active retrieval trace for this message. Ask a question about an uploaded
                  technical document to inspect RAG query vectorization and chunk similarity
                  rankings.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
