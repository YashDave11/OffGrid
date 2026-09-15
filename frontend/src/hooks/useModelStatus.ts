import { useState, useEffect, useCallback, useRef } from 'react';
import { SystemStatus, ProviderStatus } from '../types/workbench';
import { notify } from '../components/NotificationToast';

export function useModelStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    reasoning: 'checking',
    vision: 'checking',
    lastChecked: null,
  });
  const [isChecking, setIsChecking] = useState(false);
  const prevStatusRef = useRef<SystemStatus | null>(null);
  const isInitialCheckRef = useRef(true);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/v1/status');
      if (!res.ok) throw new Error('Status check non-200');
      const data = await res.json();

      const sanitizeStatus = (val?: string): ProviderStatus => {
        if (val === 'ok') return 'ok';
        if (val === 'standby') return 'standby';
        if (val === 'unconfigured') return 'unconfigured';
        return 'offline';
      };

      const currentStatus: SystemStatus = {
        reasoning: sanitizeStatus(data.reasoning),
        vision: sanitizeStatus(data.vision),
        primary_reasoning: sanitizeStatus(data.primary_reasoning),
        fallback_reasoning: sanitizeStatus(data.fallback_reasoning),
        active_reasoning_model: data.active_reasoning_model,
        reasoning_fallback_active: !!data.reasoning_fallback_active,
        lastChecked: Date.now(),
        mode: data.mode === 'mock' ? 'mock' : 'remote',
        details: data.details,
      };

      const prev = prevStatusRef.current;

      // Handle Notifications for Online / Offline / Fallback state transitions
      if (isInitialCheckRef.current) {
        isInitialCheckRef.current = false;
        // On initial page load: if primary reasoning is down and we are already on fallback:
        if (currentStatus.mode !== 'mock') {
          if (currentStatus.reasoning_fallback_active) {
            notify({
              title: 'Reasoning Fallback Active',
              description: 'Primary model Qwen2.5-1.5B (192.168.0.5:8080) is offline. We have fallen back to the current model we are using for reasoning (Qwen3-4B-Thinking).',
              status: 'warning',
              duration: 7000,
            });
          } else if (currentStatus.primary_reasoning === 'ok') {
            notify({
              title: 'Model Online',
              description: 'Primary reasoning model Qwen2.5-1.5B (192.168.0.5:8080) is online and active.',
              status: 'success',
              duration: 5000,
            });
          }
        }
      } else if (prev) {
        // 1. Primary Reasoning transitions
        if (prev.primary_reasoning !== 'ok' && currentStatus.primary_reasoning === 'ok') {
          notify({
            title: 'Model Online',
            description: 'Primary reasoning model Qwen2.5-1.5B (192.168.0.5:8080) is online.',
            status: 'success',
            duration: 6000,
          });
        } else if (prev.primary_reasoning === 'ok' && currentStatus.primary_reasoning !== 'ok') {
          if (currentStatus.fallback_reasoning === 'ok') {
            notify({
              title: 'Reasoning Fallback Active',
              description: 'Primary model Qwen2.5-1.5B is offline. We have fallen back to the current model we are using for reasoning (Qwen3-4B-Thinking).',
              status: 'warning',
              duration: 8000,
            });
          } else {
            notify({
              title: 'Model Offline',
              description: 'Primary reasoning model Qwen2.5-1.5B (192.168.0.5:8080) is offline and no fallback is reachable.',
              status: 'error',
              duration: 8000,
            });
          }
        }

        // 2. Fallback Reasoning transitions
        if (prev.fallback_reasoning !== 'ok' && currentStatus.fallback_reasoning === 'ok') {
          if (currentStatus.primary_reasoning !== 'ok') {
            notify({
              title: 'Fallback Reasoning Connected',
              description: 'Qwen3-4B-Thinking (192.168.0.2:8080) is online and active as fallback.',
              status: 'info',
              duration: 6000,
            });
          }
        }

        // 3. Vision Model transitions
        if (prev.vision !== 'ok' && currentStatus.vision === 'ok') {
          notify({
            title: 'Vision Model Online',
            description: 'Connected to Gemma-3-4B-IT (127.0.0.1:8080). Visual schematic inspection online.',
            status: 'success',
            duration: 5000,
          });
        } else if (prev.vision === 'ok' && currentStatus.vision !== 'ok') {
          notify({
            title: 'Vision Model Offline',
            description: 'Gemma-3-4B-IT (127.0.0.1:8080) has gone offline.',
            status: 'warning',
            duration: 6000,
          });
        }
      }

      prevStatusRef.current = currentStatus;
      setStatus(currentStatus);
    } catch {
      const fallbackOfflineStatus: SystemStatus = {
        reasoning: 'offline',
        vision: 'offline',
        primary_reasoning: 'offline',
        fallback_reasoning: 'offline',
        lastChecked: Date.now(),
        mode: prevStatusRef.current?.mode || 'remote',
      };

      if (prevStatusRef.current && (prevStatusRef.current.reasoning === 'ok' || prevStatusRef.current.vision === 'ok')) {
        notify({
          title: 'Gateway Offline',
          description: 'Connection to MRPL Central Orchestration Gateway lost.',
          status: 'error',
          duration: 6000,
        });
      }

      prevStatusRef.current = fallbackOfflineStatus;
      setStatus(fallbackOfflineStatus);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const toggleProviderMode = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/v1/providers/toggle', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        notify({
          title: data.mode === 'standby' ? 'Mock Standby Active' : 'Remote Inference Active',
          description: data.mode === 'standby'
            ? 'Switched to internal deterministic mock providers.'
            : 'Switched to live on-premise remote model servers.',
          status: 'info',
        });
        await checkStatus();
      }
    } catch (e) {
      console.error('Failed to toggle provider mode', e);
    } finally {
      setIsChecking(false);
    }
  }, [checkStatus]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 8000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return {
    status,
    isChecking,
    refreshStatus: checkStatus,
    toggleProviderMode,
  };
}
