import { useState, useEffect, useCallback } from 'react';
import { SystemStatus, ProviderStatus } from '../types/workbench';

export function useModelStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    reasoning: 'checking',
    vision: 'checking',
    lastChecked: null,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/v1/status');
      if (!res.ok) throw new Error('Status check non-200');
      const data = await res.json();
      
      const sanitizeStatus = (val: string): ProviderStatus => {
        if (val === 'ok') return 'ok';
        if (val === 'unconfigured') return 'unconfigured';
        return 'offline';
      };

      setStatus({
        reasoning: sanitizeStatus(data.reasoning),
        vision: sanitizeStatus(data.vision),
        lastChecked: Date.now(),
      });
    } catch {
      setStatus((prev) => ({
        reasoning: 'offline',
        vision: 'offline',
        lastChecked: prev.lastChecked || Date.now(),
      }));
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return {
    status,
    isChecking,
    refreshStatus: checkStatus,
  };
}
