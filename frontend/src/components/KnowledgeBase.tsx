import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Loader2, Library, CheckCircle2, Trash2, Image } from 'lucide-react';

interface KBDocument {
  document_name: string;
  document_id: string;
  status: string;
  chunks: number;
}

export const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!window.confirm(`Are you sure you want to delete "${document_name}" from the Knowledge Base? This will remove all its embedded chunks permanently.`)) {
      return;
    }

    try {
      setDocuments(docs => docs.map(d => d.document_id === document_id ? { ...d, status: 'Deleting...' } : d));
      const res = await fetch(`/v1/knowledge/documents/${document_id}`, {
        method: 'DELETE'
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      alert('Only PDF and image files are supported for the Knowledge Base.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading...');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        setUploadStatus('Processing & Indexing...');
        
        const res = await fetch('/v1/knowledge/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_name: file.name,
            content: base64Data
          })
        });

        if (res.ok) {
          const data = await res.json();
          setUploadStatus(data.details?.knowledge_base === 'duplicate' 
            ? 'Document already exists in Knowledge Base' 
            : 'Indexed ✓');
          await fetchDocuments();
        } else {
          setUploadStatus('Failed');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadStatus('Failed');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadStatus('');
      }, 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="kb-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <Library size={24} style={{ color: 'var(--text-primary)' }} />
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Knowledge Base</h1>
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Add to Knowledge Base</h3>
        <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '14px' }}>
          Upload PDF or image files to automatically embed and index them for global retrieval.
        </p>
        
        <input 
          type="file" 
          accept=".pdf,.png,.jpg,.jpeg,.webp" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload} 
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: isUploading ? 'not-allowed' : 'pointer' }}
          >
            {isUploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
            {isUploading ? 'Uploading...' : '+ Add File'}
          </button>
          
          {uploadStatus && (
            <span style={{ fontSize: '14px', color: uploadStatus === 'Failed' ? 'var(--accent-red)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {uploadStatus === 'Indexed ✓' && <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />}
              {uploadStatus}
            </span>
          )}
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Documents</h3>
        <div style={{ borderTop: '1px solid var(--border-color)' }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="spin" style={{ margin: '0 auto' }} />
            </div>
          ) : documents.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No documents in Knowledge Base yet.
            </div>
          ) : (
            documents.map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                {doc.document_name.toLowerCase().match(/\.(png|jpe?g|webp)$/) ? (
                  <Image size={20} style={{ color: 'var(--accent-amber)', marginTop: '2px' }} />
                ) : (
                  <FileText size={20} style={{ color: 'var(--accent-amber)', marginTop: '2px' }} />
                )}
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>{doc.document_name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: doc.status.includes('Deleting') ? 'var(--accent-red)' : 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {doc.status.includes('Deleting') ? <Loader2 size={12} className="spin" /> : <CheckCircle2 size={12} />} {doc.status}
                    </span>
                    <span>•</span>
                    <span>Chunks: {doc.chunks}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteDocument(doc.document_id, doc.document_name)}
                  disabled={doc.status.includes('Deleting')}
                  style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: doc.status.includes('Deleting') ? 'not-allowed' : 'pointer', padding: '4px', borderRadius: '4px' }}
                  title="Delete Document"
                  className="hover-bg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
