import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { RoverStatus } from '../types';

export function useRoverControl() {
  const [rover, setRover] = useState<RoverStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const status = await api.getRoverStatus();
      setRover(status);
    } finally {
      setLoading(false);
    }
  }, []);

  const executeAction = useCallback(
    async (action: 'start' | 'pause' | 'resume' | 'return' | 'emergency-stop') => {
      setActionLoading(action);
      try {
        const actions = {
          start: api.startRover,
          pause: api.pauseRover,
          resume: api.resumeRover,
          return: api.returnRover,
          'emergency-stop': api.emergencyStopRover,
        };
        const status = await actions[action]();
        setRover(status);
        return status;
      } finally {
        setActionLoading(null);
      }
    },
    []
  );

  return { rover, loading, actionLoading, fetchStatus, executeAction, setRover };
}
