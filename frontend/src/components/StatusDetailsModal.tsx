import React from 'react';
import { X, ShieldCheck, Cpu, Eye, RefreshCw, Server } from 'lucide-react';
import { SystemStatus } from '../types/workbench';

interface StatusDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatus;
  isChecking: boolean;
  onRefresh: () => void;
}

export const StatusDetailsModal: React.FC<StatusDetailsModalProps> = ({
  isOpen,
  onClose,
  status,
  isChecking,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const renderBadge = (st: string) => {
    if (st === 'ok') {
      return (
        <span style={{ color: 'var(--status-ok)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="status-dot ok" /> Available
        </span>
      );
    }
    if (st === 'unconfigured') {
      return (
        <span style={{ color: 'var(--status-checking)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="status-dot checking" /> Unconfigured
        </span>
      );
    }
    return (
      <span style={{ color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span className="status-dot error" /> Offline / Standby
      </span>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="standard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ShieldCheck size={16} style={{ color: 'var(--accent-amber)' }} />
            <span>MRPL Sovereign Topology & Model Status</span>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Topology description */}
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            The workbench runs on a sovereign, air-gapped hub-and-spoke infrastructure. All inference is processed
            exclusively on internal on-premise hardware without external network egress.
          </div>

          {/* Gateway Node */}
          <div className="topology-card">
            <div className="topology-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={15} style={{ color: 'var(--accent-amber)' }} />
                <span>Central Gateway & Orchestrator</span>
              </div>
              <span style={{ color: 'var(--status-ok)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="status-dot ok" /> Online
              </span>
            </div>
            <div className="topology-detail">
              FastAPI orchestration engine managing task classification, deterministic routing, and secure agent state progression.
            </div>
          </div>

          {/* Reasoning Node */}
          <div className="topology-card">
            <div className="topology-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={15} style={{ color: 'var(--accent-amber)' }} />
                <span>Reasoning Node (Arihant)</span>
              </div>
              {renderBadge(status.reasoning)}
            </div>
            <div className="topology-detail">
              Model: <strong>Qwen3-4B-Thinking-2507</strong>. Specialized in deep chain-of-thought analysis, mathematical synthesis, and industrial safety compliance reasoning.
            </div>
          </div>

          {/* Vision Node */}
          <div className="topology-card">
            <div className="topology-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={15} style={{ color: 'var(--accent-steel)' }} />
                <span>Vision Node (Yash-local)</span>
              </div>
              {renderBadge(status.vision)}
            </div>
            <div className="topology-detail">
              Model: <strong>gemma-3-4b-it-Q4_K_M.gguf</strong>. Specialized in technical diagram interpretation, P&ID diagram checks, visual equipment inspection, and image queries.
            </div>
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'flex-end', justifyContent: 'space-between', paddingTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {status.lastChecked ? `Checked: ${new Date(status.lastChecked).toLocaleTimeString()}` : ''}
            </span>
            <button
              className="btn-header-tool"
              onClick={onRefresh}
              disabled={isChecking}
              type="button"
            >
              <RefreshCw size={13} className={isChecking ? 'spin' : ''} />
              <span>{isChecking ? 'Checking...' : 'Refresh Status'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
