import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useDashboard() {
  return useAsyncData(() => api.getDashboard());
}

export function useSoilAnalysis() {
  return useAsyncData(() => api.getSoilAnalysis());
}

export function useLatestSensors() {
  return useAsyncData(() => api.getLatestSensors());
}

export function useRecommendations() {
  return useAsyncData(() => api.getRecommendations());
}

export function useAIAnalysis() {
  return useAsyncData(() => api.getAIAnalysis());
}

export function useCropAnalyses() {
  return useAsyncData(() => api.getCropAnalyses());
}

export function useEnvironmentalRisk(lat?: number, lon?: number) {
  return useAsyncData(() => api.getEnvironmentalRisk(lat, lon), [lat, lon]);
}

export function useFarmZones() {
  return useAsyncData(() => api.getFarmZones());
}

export function useFarmMap() {
  return useAsyncData(() => api.getFarmMap());
}

export function useSystemStatus() {
  return useAsyncData(() => api.getSystemStatus());
}

export function useSensorHistory(range: 'today' | '7d' | '30d') {
  return useAsyncData(() => api.getSensorHistory(range), [range]);
}

export function useAnalytics(range: '7d' | '30d' | '90d') {
  return useAsyncData(() => api.getAnalytics(range), [range]);
}

export function useAlerts(filter: 'all' | 'critical' | 'high' | 'medium' | 'low' | 'resolved') {
  return useAsyncData(() => api.getAlerts(filter), [filter]);
}

export function useIrrigationSchedule(lat?: number, lon?: number) {
  return useAsyncData(() => api.getIrrigationSchedule(lat, lon), [lat, lon]);
}
