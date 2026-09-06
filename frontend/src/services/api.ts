import { API_CONFIG } from './config';
import {
  mockAIAnalysis,
  mockAlerts,
  mockCropAnalyses,
  mockDashboard,
  mockEnvironmentalRisk,
  mockFarmMap,
  mockFarmZones,
  mockLatestSensor,
  mockRecommendations,
  mockSoilAnalysis,
  mockSystemStatus,
  getMockAnalytics,
  getMockHistory,
  getSimulatedRoverStatus,
  simulateRoverAction,
  filterAlerts,
} from '../data/mockData';
import type {
  AIAnalysisResult,
  Alert,
  AlertFilter,
  AnalyticsData,
  CropAnalysis,
  DashboardSummary,
  EnvironmentalRisk,
  FarmMapData,
  FarmZone,
  HistoricalDataPoint,
  Recommendation,
  RoverStatus,
  SensorReading,
  SoilAnalysis,
  SystemStatus,
  TimeRange,
} from '../types';

export interface SensorHistoryData {
  soilMoisture: HistoricalDataPoint[];
  soilTemperature: HistoricalDataPoint[];
  ph: HistoricalDataPoint[];
  ec: HistoricalDataPoint[];
  nitrogen: HistoricalDataPoint[];
  phosphorus: HistoricalDataPoint[];
  potassium: HistoricalDataPoint[];
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
}

async function postAPI<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
}

export const api = {
  async getDashboard(): Promise<DashboardSummary> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return { ...mockDashboard, roverStatus: getSimulatedRoverStatus().state };
    }
    return fetchAPI<DashboardSummary>(API_CONFIG.ENDPOINTS.DASHBOARD);
  },

  async getLatestSensors(): Promise<SensorReading> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return mockLatestSensor;
    }
    return fetchAPI<SensorReading>(API_CONFIG.ENDPOINTS.SENSORS_LATEST);
  },

  async getSensorHistory(range: TimeRange): Promise<SensorHistoryData> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return getMockHistory(range);
    }
    return fetchAPI<SensorHistoryData>(`${API_CONFIG.ENDPOINTS.SENSORS_HISTORY}?range=${range}`);
  },

  async getSoilAnalysis(): Promise<SoilAnalysis> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return mockSoilAnalysis;
    }
    return fetchAPI<SoilAnalysis>(API_CONFIG.ENDPOINTS.SOIL_ANALYSIS);
  },

  async getCropAnalyses(): Promise<CropAnalysis[]> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return mockCropAnalyses;
    }
    return fetchAPI<CropAnalysis[]>(API_CONFIG.ENDPOINTS.CROP_ANALYSIS);
  },

  async getRecommendations(): Promise<Recommendation[]> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return mockRecommendations;
    }
    return fetchAPI<Recommendation[]>(API_CONFIG.ENDPOINTS.RECOMMENDATIONS);
  },

  async getAlerts(filter: AlertFilter = 'all'): Promise<Alert[]> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return filterAlerts(mockAlerts, filter);
    }
    return fetchAPI<Alert[]>(`${API_CONFIG.ENDPOINTS.ALERTS}?filter=${filter}`);
  },

  async getRoverStatus(): Promise<RoverStatus> {
    if (API_CONFIG.USE_MOCK) {
      await delay(150);
      return getSimulatedRoverStatus();
    }
    return fetchAPI<RoverStatus>(API_CONFIG.ENDPOINTS.ROVER_STATUS);
  },

  async startRover(): Promise<RoverStatus> {
    if (API_CONFIG.USE_MOCK) {
      await delay(500);
      return simulateRoverAction('start');
    }
    return postAPI<RoverStatus>(API_CONFIG.ENDPOINTS.ROVER_START);
  },

  async pauseRover(): Promise<RoverStatus> {
    if (API_CONFIG.USE_MOCK) {
      await delay(300);
      return simulateRoverAction('pause');
    }
    return postAPI<RoverStatus>(API_CONFIG.ENDPOINTS.ROVER_PAUSE);
  },

  async resumeRover(): Promise<RoverStatus> {
    if (API_CONFIG.USE_MOCK) {
      await delay(300);
      return simulateRoverAction('resume');
    }
    return postAPI<RoverStatus>(API_CONFIG.ENDPOINTS.ROVER_RESUME);
  },

  async returnRover(): Promise<RoverStatus> {
    if (API_CONFIG.USE_MOCK) {
      await delay(500);
      return simulateRoverAction('return');
    }
    return postAPI<RoverStatus>(API_CONFIG.ENDPOINTS.ROVER_RETURN);
  },

  async emergencyStopRover(): Promise<RoverStatus> {
    if (API_CONFIG.USE_MOCK) {
      await delay(200);
      return simulateRoverAction('emergency-stop');
    }
    return postAPI<RoverStatus>(API_CONFIG.ENDPOINTS.ROVER_EMERGENCY_STOP);
  },

  async getEnvironmentalRisk(): Promise<EnvironmentalRisk> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return mockEnvironmentalRisk;
    }
    return fetchAPI<EnvironmentalRisk>(API_CONFIG.ENDPOINTS.ENVIRONMENTAL_RISK);
  },

  async getAnalytics(range: TimeRange): Promise<AnalyticsData> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return getMockAnalytics(range);
    }
    return fetchAPI<AnalyticsData>(`${API_CONFIG.ENDPOINTS.ANALYTICS}?range=${range}`);
  },

  async getFarmZones(): Promise<FarmZone[]> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return mockFarmZones;
    }
    return fetchAPI<FarmZone[]>(API_CONFIG.ENDPOINTS.FARM_ZONES);
  },

  async getFarmMap(): Promise<FarmMapData> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      const rover = getSimulatedRoverStatus();
      return { ...mockFarmMap, rover };
    }
    return fetchAPI<FarmMapData>(API_CONFIG.ENDPOINTS.FARM_MAP);
  },

  async getAIAnalysis(): Promise<AIAnalysisResult> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return mockAIAnalysis;
    }
    return fetchAPI<AIAnalysisResult>(API_CONFIG.ENDPOINTS.AI_ANALYSIS);
  },

  async getSystemStatus(): Promise<SystemStatus> {
    if (API_CONFIG.USE_MOCK) {
      await delay(100);
      return mockSystemStatus;
    }
    return fetchAPI<SystemStatus>(API_CONFIG.ENDPOINTS.SYSTEM_STATUS);
  },
};
