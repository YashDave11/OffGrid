import React from 'react';
import {
  RiCloseLine,
  RiShieldCheckLine,
  RiCpuLine,
  RiEyeLine,
  RiRefreshLine,
  RiServerLine,
} from '@remixicon/react';
import { SystemStatus } from '../types/workbench';
import { StatusDot } from './base/badges/status-dot';
import { cx } from '@/utils/cx';

interface StatusDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatus;
  isChecking: boolean;
  onRefresh: () => void;
  onToggleProviderMode?: () => void;
}

export const StatusDetailsModal: React.FC<StatusDetailsModalProps> = ({
  isOpen,
  onClose,
  status,
  isChecking,
  onRefresh,
  onToggleProviderMode,
}) => {
  if (!isOpen) return null;

  const renderBadge = (st: string) => {
    if (st === 'ok') {
      return (
        <span className="flex items-center gap-1.5 text-emerald-400 text-caption-1-medium">
          <StatusDot status="online" className="size-1.5" /> Available
        </span>
      );
    }
    if (st === 'standby') {
      return (
        <span className="flex items-center gap-1.5 text-amber-400 text-caption-1-medium">
          <StatusDot status="maintenance" className="size-1.5" /> Standby (Mock)
        </span>
      );
    }
    if (st === 'unconfigured') {
      return (
        <span className="flex items-center gap-1.5 text-text-tertiary text-caption-1-medium">
          <StatusDot status="offline" className="size-1.5" /> Unconfigured
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-rose-400 text-caption-1-medium">
        <StatusDot status="offline" className="size-1.5" /> Offline
      </span>
    );
  };

  const isMock = status.mode === 'mock';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-background-secondary-default border border-border-button-default shadow-2xl p-6 space-y-5 animate-scaleUp text-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-separator-border">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">
              <RiShieldCheckLine className="size-5" />
            </div>
            <div>
              <h3 className="text-body-medium font-semibold text-text-primary">
                Sovereign Topology & Model Status
              </h3>
              <p className="text-caption-1-regular text-text-tertiary">
                Air-gapped on-premise industrial cluster
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-foreground-icon-secondary hover:text-text-primary hover:bg-background-tertiary-default transition-colors"
          >
            <RiCloseLine className="size-5" />
          </button>
        </div>

        {/* Topology Cards */}
        <div className="space-y-3">
          {/* Gateway Node */}
          <div className="p-3.5 rounded-2xl bg-background-primary-default border border-border-button-default space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiServerLine className="size-4 text-emerald-400" />
                <span className="text-body-2-medium font-semibold text-text-primary">
                  Central Orchestration Gateway
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-emerald-400 text-caption-1-medium">
                <StatusDot status="online" className="size-1.5" /> Online (:8000)
              </span>
            </div>
            <p className="text-caption-1-regular text-text-secondary leading-relaxed">
              FastAPI orchestration hub running local routing, RAG chunk injection, and session telemetry.
            </p>
          </div>

          {/* Primary Reasoning Node */}
          <div className="p-3.5 rounded-2xl bg-background-primary-default border border-border-button-default space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiCpuLine className="size-4 text-emerald-400" />
                <span className="text-body-2-medium font-semibold text-text-primary">
                  Primary Reasoning Model
                </span>
              </div>
              {renderBadge(status.primary_reasoning || status.reasoning)}
            </div>
            <p className="text-caption-1-regular text-text-secondary leading-relaxed">
              Model: <strong className="text-text-primary font-mono text-[11px]">qwen2.5-1.5b-instruct-q4_k_m.gguf</strong> (192.168.0.5:8080). Fast industrial reasoning. If offline, requests automatically fallback.
            </p>
          </div>

          {/* Fallback Reasoning Node */}
          <div className="p-3.5 rounded-2xl bg-background-primary-default border border-border-button-default space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiCpuLine className="size-4 text-amber-400" />
                <span className="text-body-2-medium font-semibold text-text-primary">
                  Fallback Reasoning Model
                </span>
                {status.reasoning_fallback_active && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10.5px] font-semibold border border-amber-500/25">
                    Active Fallback
                  </span>
                )}
              </div>
              {renderBadge(status.fallback_reasoning || (isMock ? 'standby' : 'offline'))}
            </div>
            <p className="text-caption-1-regular text-text-secondary leading-relaxed">
              Model: <strong className="text-text-primary font-mono text-[11px]">Qwen3-4B-Thinking-2507</strong> (192.168.0.2:8080). Deep chain-of-thought engine engaged when primary model is unreachable.
            </p>
          </div>

          {/* Vision Node */}
          <div className="p-3.5 rounded-2xl bg-background-primary-default border border-border-button-default space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiEyeLine className="size-4 text-sky-400" />
                <span className="text-body-2-medium font-semibold text-text-primary">
                  Vision Node (Yash-local)
                </span>
              </div>
              {renderBadge(status.vision)}
            </div>
            <p className="text-caption-1-regular text-text-secondary leading-relaxed">
              Model: <strong className="text-text-primary">gemma-3-4b-it-Q4_K_M</strong> via llama.cpp. Multimodal diagram inspection and equipment checks.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border-separator-border text-caption-1-regular">
          <span className="text-text-tertiary">
            {status.lastChecked
              ? `Last verified: ${new Date(status.lastChecked).toLocaleTimeString()}`
              : ''}
          </span>

          <div className="flex items-center gap-2">
            {onToggleProviderMode && (
              <button
                type="button"
                onClick={onToggleProviderMode}
                className="px-3 py-1.5 rounded-xl bg-background-primary-default border border-border-button-default text-text-secondary hover:text-text-primary hover:bg-background-tertiary-default transition-colors text-caption-1-medium"
              >
                Toggle: {isMock ? 'Switch to Live' : 'Switch to Mock'}
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              disabled={isChecking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-button-primary text-white text-caption-1-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <RiRefreshLine className={cx('size-3.5', isChecking && 'animate-spin')} />
              <span>{isChecking ? 'Verifying...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
