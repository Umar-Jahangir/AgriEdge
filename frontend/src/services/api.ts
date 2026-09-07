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
  mockIrrigationSchedule,
  mockYieldRiskForecast,
  setSimulatedRelay,
  getSimulatedRelay,
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
  IrrigationSchedule,
  Recommendation,
  RelayState,
  RoverStatus,
  SensorReading,
  SMSDispatchRequest,
  SMSDispatchResponse,
  SoilAnalysis,
  SystemStatus,
  TimeRange,
  YieldRiskForecast,
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

/** The FastAPI API uses snake_case; React components use camelCase. */
function toCamelCase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toCamelCase);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key.replace(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase()),
        toCamelCase(item),
      ])
    );
  }
  return value;
}

function toSensorReading(value: SensorReading): SensorReading {
  const source = value as SensorReading & { ph?: number; ec?: number; humidity?: number };
  return {
    ...source,
    soilPh: source.soilPh ?? source.ph ?? 0,
    electricalConductivity: source.electricalConductivity ?? source.ec ?? 0,
    airHumidity: source.airHumidity ?? source.humidity ?? 0,
    samplingPoint: source.samplingPoint ?? 0,
  };
}

function toRoverStatus(value: RoverStatus): RoverStatus {
  return { ...value, position: value.position ?? { x: 55, y: 62 } };
}

function toFarmZone(value: FarmZone): FarmZone {
  const zone = value as FarmZone & { nitrogen?: number; phosphorus?: number; potassium?: number };
  return {
    ...zone,
    npk: zone.npk ?? {
      nitrogen: zone.nitrogen ?? 0,
      phosphorus: zone.phosphorus ?? 0,
      potassium: zone.potassium ?? 0,
      nitrogenStatus: (zone.nitrogen ?? 0) >= 50 ? 'Good' : 'Moderate',
      phosphorusStatus: (zone.phosphorus ?? 0) >= 30 ? 'Good' : 'Moderate',
      potassiumStatus: (zone.potassium ?? 0) >= 45 ? 'Good' : 'Moderate',
      timestamp: new Date().toISOString(),
    },
    position: zone.position ?? { row: 0, col: 0 },
  };
}

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return toCamelCase(await response.json()) as T;
}

async function postAPI<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return toCamelCase(await response.json()) as T;
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
    return toSensorReading(await fetchAPI<SensorReading>(API_CONFIG.ENDPOINTS.SENSORS_LATEST));
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
    const items = await fetchAPI<CropAnalysis[]>(API_CONFIG.ENDPOINTS.CROP_ANALYSIS);
    return items.map((item) => ({
      ...item,
      imageUrl: item.imageUrl?.startsWith('/images/') ? `${API_CONFIG.BASE_URL}${item.imageUrl}` : item.imageUrl,
    }));
  },

  async uploadCropImage(file: File, zoneId = 'ZONE_B'): Promise<CropAnalysis> {
    if (API_CONFIG.USE_MOCK) {
      await delay(600);
      return {
        id: `scan-mock-${Date.now()}`,
        timestamp: new Date().toISOString(),
        imageUrl: URL.createObjectURL(file),
        diseaseDetection: 'Corn: Northern Leaf Blight',
        confidence: 91,
        cropHealth: 'Possible Disease Detected',
        cropHealthPercent: 68,
        zoneId,
        notes: 'Simulated AI detection on uploaded image.',
      };
    }
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/images/analyze?zone_id=${encodeURIComponent(zoneId)}`,
      {
        method: 'POST',
        body: formData,
      }
    );
    if (!response.ok) throw new Error(`Image analysis failed with status: ${response.status}`);
    const data = await response.json();
    const top = data.top_prediction || (data.predictions && data.predictions[0]);
    const fullImageUrl = data.image_url ? `${API_CONFIG.BASE_URL}${data.image_url}` : URL.createObjectURL(file);
    return {
      id: `scan-${data.image_id}`,
      timestamp: new Date().toISOString(),
      imageUrl: fullImageUrl,
      diseaseDetection: top?.prediction_class || 'Analysis complete',
      confidence: Math.round((top?.confidence || 0.9) * 100),
      cropHealth: (data.crop_health as CropAnalysis['cropHealth']) || (top?.is_healthy ? 'Healthy' : 'Possible Disease Detected'),
      cropHealthPercent: data.crop_health_percent ?? (top?.is_healthy ? 95 : 65),
      zoneId: data.zone_id || zoneId,
      notes: top?.treatment || top?.note || 'Edge AI analysis complete.',
    };
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
    return toRoverStatus(await fetchAPI<RoverStatus>(API_CONFIG.ENDPOINTS.ROVER_STATUS));
  },

  async startRover(): Promise<RoverStatus> {
    if (API_CONFIG.USE_MOCK) {
      await delay(500);
      return simulateRoverAction('start');
    }
    return toRoverStatus(await postAPI<RoverStatus>(API_CONFIG.ENDPOINTS.ROVER_START));
  },

  async pauseRover(): Promise<RoverStatus> {
    if (API_CONFIG.USE_MOCK) {
      await delay(300);
      return simulateRoverAction('pause');
    }
    return toRoverStatus(await postAPI<RoverStatus>(API_CONFIG.ENDPOINTS.ROVER_PAUSE));
  },

  async resumeRover(): Promise<RoverStatus> {
    if (API_CONFIG.USE_MOCK) {
      await delay(300);
      return simulateRoverAction('resume');
    }
    return toRoverStatus(await postAPI<RoverStatus>(API_CONFIG.ENDPOINTS.ROVER_RESUME));
  },

  async returnRover(): Promise<RoverStatus> {
    if (API_CONFIG.USE_MOCK) {
      await delay(500);
      return simulateRoverAction('return');
    }
    return toRoverStatus(await postAPI<RoverStatus>(API_CONFIG.ENDPOINTS.ROVER_RETURN));
  },

  async emergencyStopRover(): Promise<RoverStatus> {
    if (API_CONFIG.USE_MOCK) {
      await delay(200);
      return simulateRoverAction('emergency-stop');
    }
    return toRoverStatus(await postAPI<RoverStatus>(API_CONFIG.ENDPOINTS.ROVER_EMERGENCY_STOP));
  },

  async getEnvironmentalRisk(lat?: number, lon?: number): Promise<EnvironmentalRisk> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return mockEnvironmentalRisk;
    }
    const query = lat !== undefined && lon !== undefined ? `?lat=${lat}&lon=${lon}` : '';
    return fetchAPI<EnvironmentalRisk>(`${API_CONFIG.ENDPOINTS.ENVIRONMENTAL_RISK}${query}`);
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
    return (await fetchAPI<FarmZone[]>(API_CONFIG.ENDPOINTS.FARM_ZONES)).map(toFarmZone);
  },

  async getFarmMap(): Promise<FarmMapData> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      const rover = getSimulatedRoverStatus();
      return { ...mockFarmMap, rover };
    }
    const map = await fetchAPI<FarmMapData>(API_CONFIG.ENDPOINTS.FARM_MAP);
    return { ...map, rover: toRoverStatus(map.rover), zones: map.zones.map(toFarmZone) };
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

  async getIrrigationSchedule(lat?: number, lon?: number): Promise<IrrigationSchedule> {
    if (API_CONFIG.USE_MOCK) {
      await delay(200);
      return { ...mockIrrigationSchedule, relayState: getSimulatedRelay() };
    }
    const query = lat !== undefined && lon !== undefined ? `?lat=${lat}&lon=${lon}` : '';
    return fetchAPI<IrrigationSchedule>(`${API_CONFIG.ENDPOINTS.IRRIGATION_SCHEDULE}${query}`);
  },

  async setIrrigationValve(
    mode: 'AUTO' | 'MANUAL',
    state: 'STANDBY' | 'ACTIVE' | 'OFF'
  ): Promise<{ status: string; relayState: RelayState; message: string }> {
    if (API_CONFIG.USE_MOCK) {
      await delay(150);
      const relay = setSimulatedRelay(mode, state);
      return {
        status: 'success',
        relayState: relay,
        message: `Irrigation pump relay set to ${state} (${mode} mode)`,
      };
    }
    return postAPI<{ status: string; relayState: RelayState; message: string }>(
      API_CONFIG.ENDPOINTS.IRRIGATION_VALVE,
      { mode, state }
    );
  },

  async getYieldRisk(): Promise<YieldRiskForecast> {
    if (API_CONFIG.USE_MOCK) {
      await delay(200);
      return mockYieldRiskForecast;
    }
    return fetchAPI<YieldRiskForecast>(API_CONFIG.ENDPOINTS.YIELD_RISK);
  },

  async dispatchSMSAlert(req: SMSDispatchRequest): Promise<SMSDispatchResponse> {
    const rawDigits = req.phoneNumber.replace(/\D/g, '');
    const cleanPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
    const encoded = encodeURIComponent(req.messageText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    const smsUri = `sms:+${cleanPhone}?body=${encoded}`;

    if (API_CONFIG.USE_MOCK) {
      await delay(350);
      const isUnicode = req.messageText.split('').some((c) => c.charCodeAt(0) > 127);
      const charCount = req.messageText.length;
      const smsParts = isUnicode ? Math.max(1, Math.ceil(charCount / 70)) : Math.max(1, Math.ceil(charCount / 160));
      return {
        status: 'DELIVERED',
        channel: req.channel,
        recipientName: req.recipientName || 'Ramesh Patil',
        phoneNumber: req.phoneNumber,
        operator: req.channel === 'SMS' ? 'Jio / BSNL 2G GSM (mKisan Gateway)' : 'WhatsApp Business Cloud Gateway',
        referenceId: `TXN-${Math.floor(10000 + Math.random() * 90000)}-BSNL-IN`,
        charCount,
        smsParts,
        costInr: Number((smsParts * 0.12).toFixed(2)),
        deliveredAt: new Date().toISOString(),
        payloadPreview: req.messageText,
        liveDispatched: false,
        whatsappUrl,
        smsUri,
      };
    }
    return postAPI<SMSDispatchResponse>(API_CONFIG.ENDPOINTS.SMS_DISPATCH, {
      phone_number: req.phoneNumber,
      recipient_name: req.recipientName,
      channel: req.channel,
      language: req.language,
      message_text: req.messageText,
      alert_id: req.alertId,
      zone_id: req.zoneId,
      priority: req.priority,
      fast2sms_api_key: req.fast2smsApiKey,
      callmebot_api_key: req.callmebotApiKey,
    });
  },

  async getLiveAlertDispatch(): Promise<{ dispatchId?: string; payloadPreview?: string; phoneNumber?: string; channel?: string; receivedAt?: string } | null> {
    if (API_CONFIG.USE_MOCK) return null;
    try {
      return await fetchAPI(API_CONFIG.ENDPOINTS.LIVE_DISPATCH);
    } catch {
      return null;
    }
  },
};



