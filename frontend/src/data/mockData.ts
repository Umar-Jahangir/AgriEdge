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
  IrrigationSchedule,
  Recommendation,
  RelayState,
  RoverState,
  RoverStatus,
  SensorReading,
  SoilAnalysis,
  SystemStatus,
  TimeRange,
  YieldRiskForecast,
} from '../types';

const now = new Date();
const formatTime = (d: Date) =>
  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
const formatDateTime = (d: Date) => d.toISOString();

export const mockDashboard: DashboardSummary = {
  farmStatus: 'Healthy',
  lastScan: formatTime(now),
  roverStatus: 'ACTIVE',
  connectivity: 'Connected',
  soilConditionScore: 82,
  soilConditionStatus: 'Healthy',
  soilMoisture: 42,
  soilMoistureStatus: 'Optimal',
  temperature: 27.4,
  soilPh: 6.8,
  soilPhStatus: 'Optimal',
  electricalConductivity: 1.42,
  npk: {
    nitrogen: 52,
    phosphorus: 29,
    potassium: 45,
    nitrogenStatus: 'Good',
    phosphorusStatus: 'Moderate',
    potassiumStatus: 'Good',
    timestamp: formatDateTime(now),
  },
  cropHealth: 87,
  waterStress: 'LOW',
  lastSynchronized: now.toLocaleTimeString('en-US', { hour12: true }),
  farmName: 'Demo Farm',
};

export const mockRoverStatus: RoverStatus = {
  state: 'ACTIVE',
  battery: 76,
  currentZone: 'Zone B',
  currentSamplingPoint: 14,
  distanceCovered: 1.24,
  totalSamplingPoints: 30,
  completedSamplingPoints: 18,
  obstacleStatus: 'Clear',
  connection: 'Connected',
  lastScan: formatTime(now),
  position: { x: 55, y: 62 },
};

export const mockSoilAnalysis: SoilAnalysis = {
  overallScore: 82,
  moisture: 'Good',
  ph: 'Good',
  npk: 'Moderate',
  ec: 'Good',
  temperature: 'Good',
  derivedFrom: 'Derived from moisture, pH, EC, NPK and temperature parameters.',
  timestamp: formatDateTime(now),
};

export const mockLatestSensor: SensorReading = {
  id: 'sensor-001',
  timestamp: formatDateTime(now),
  soilMoisture: 42,
  soilTemperature: 24.6,
  soilPh: 6.8,
  electricalConductivity: 1.42,
  nitrogen: 52,
  phosphorus: 29,
  potassium: 45,
  airTemperature: 27.4,
  airHumidity: 68,
  zoneId: 'zone-b',
  samplingPoint: 14,
};

export const mockAIAnalysis: AIAnalysisResult = {
  soilConditionScore: 82,
  cropHealth: 87,
  waterStressRisk: 'LOW',
  diseaseRisk: 'LOW',
  nutrientDeficiency: 'Moderate Nitrogen Deficiency',
  yieldRisk: 'LOW',
  timestamp: formatDateTime(now),
};

export const mockRecommendations: Recommendation[] = [
  {
    id: 'rec-1',
    category: 'IRRIGATION',
    issue: 'Irrigation Schedule',
    severity: 'MEDIUM',
    reason: 'Soil moisture trending below optimal range in Zone B sampling points.',
    action: 'Irrigation recommended within the next 4 hours.',
    timestamp: formatDateTime(new Date(now.getTime() - 15 * 60000)),
    icon: '💧',
  },
  {
    id: 'rec-2',
    category: 'NUTRIENTS',
    issue: 'Nitrogen Level',
    severity: 'MEDIUM',
    reason: 'Nitrogen readings at 52 ppm are below the preferred range for current crop stage.',
    action: 'Consider nitrogen supplementation. Consult local agronomist for appropriate application.',
    timestamp: formatDateTime(new Date(now.getTime() - 45 * 60000)),
    icon: '🌱',
  },
  {
    id: 'rec-3',
    category: 'HEAT_STRESS',
    issue: 'Temperature Monitoring',
    severity: 'LOW',
    reason: 'Air temperature at 27.4°C is approaching upper comfort range for crops.',
    action: 'Monitor crop stress indicators. Ensure adequate soil moisture.',
    timestamp: formatDateTime(new Date(now.getTime() - 90 * 60000)),
    icon: '🌡️',
  },
  {
    id: 'rec-4',
    category: 'DISEASE',
    issue: 'Disease Screening',
    severity: 'LOW',
    reason: 'Latest camera scan shows no significant disease indicators.',
    action: 'No significant disease indicators detected. Continue regular monitoring.',
    timestamp: formatDateTime(new Date(now.getTime() - 120 * 60000)),
    icon: '🦠',
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    type: 'Soil Moisture',
    severity: 'HIGH',
    location: 'Zone B - Point 12',
    message: 'Low Soil Moisture detected in Zone B',
    timestamp: formatDateTime(new Date(now.getTime() - 30 * 60000)),
    status: 'active',
  },
  {
    id: 'alert-2',
    type: 'Nutrient',
    severity: 'MEDIUM',
    location: 'Zone B - Point 14',
    message: 'Possible Nitrogen Deficiency',
    timestamp: formatDateTime(new Date(now.getTime() - 60 * 60000)),
    status: 'active',
  },
  {
    id: 'alert-3',
    type: 'Temperature',
    severity: 'LOW',
    location: 'Zone A - Point 5',
    message: 'Temperature rising above normal range',
    timestamp: formatDateTime(new Date(now.getTime() - 120 * 60000)),
    status: 'active',
  },
  {
    id: 'alert-4',
    type: 'Rover',
    severity: 'LOW',
    location: 'Zone C',
    message: 'Obstacle detected and avoided during scan',
    timestamp: formatDateTime(new Date(now.getTime() - 180 * 60000)),
    status: 'resolved',
  },
  {
    id: 'alert-5',
    type: 'Crop Health',
    severity: 'CRITICAL',
    location: 'Zone C - Point 22',
    message: 'Significant moisture deficit — immediate attention required',
    timestamp: formatDateTime(new Date(now.getTime() - 240 * 60000)),
    status: 'acknowledged',
  },
];

export const mockEnvironmentalRisk: EnvironmentalRisk = {
  droughtRisk: 'LOW',
  floodRisk: 'LOW',
  heatStressRisk: 'MEDIUM',
  cropDiseaseRisk: 'LOW',
  waterStressRisk: 'LOW',
  airTemperature: 27.4,
  humidity: 68,
  soilTemperature: 24.6,
  soilMoisture: 42,
  weatherIntegrationPending: true,
  timestamp: formatDateTime(now),
};

export const mockFarmZones: FarmZone[] = [
  {
    id: 'zone-a',
    name: 'Zone A',
    soilConditionScore: 88,
    moisture: 45,
    ph: 6.9,
    npk: { nitrogen: 58, phosphorus: 32, potassium: 48, nitrogenStatus: 'Good', phosphorusStatus: 'Good', potassiumStatus: 'Good', timestamp: formatDateTime(now) },
    cropHealth: 91,
    riskLevel: 'LOW',
    samplingCoverage: 92,
    position: { row: 0, col: 0 },
    cropType: 'Tomato (Abhinav F1)',
    growthStage: 'Vegetative Stage',
    growthStageHi: 'वानस्पतिक बढ़वार',
    growthStageMr: 'शाकीय वाढ',
    stageDay: 34,
    gddAccumulated: 490,
    yieldRiskPct: 5.0,
  },
  {
    id: 'zone-b',
    name: 'Zone B',
    soilConditionScore: 76,
    moisture: 38,
    ph: 6.6,
    npk: { nitrogen: 48, phosphorus: 27, potassium: 42, nitrogenStatus: 'Moderate', phosphorusStatus: 'Moderate', potassiumStatus: 'Good', timestamp: formatDateTime(now) },
    cropHealth: 82,
    riskLevel: 'MEDIUM',
    samplingCoverage: 76,
    position: { row: 0, col: 1 },
    cropType: 'Tomato (Abhinav F1)',
    growthStage: 'Flowering & Anthesis',
    growthStageHi: 'फूल आने की अवस्था',
    growthStageMr: 'फुलोरा अवस्था',
    stageDay: 52,
    gddAccumulated: 820,
    yieldRiskPct: 18.0,
  },
  {
    id: 'zone-c',
    name: 'Zone C',
    soilConditionScore: 68,
    moisture: 32,
    ph: 6.4,
    npk: { nitrogen: 42, phosphorus: 24, potassium: 38, nitrogenStatus: 'Moderate', phosphorusStatus: 'Low', potassiumStatus: 'Moderate', timestamp: formatDateTime(now) },
    cropHealth: 74,
    riskLevel: 'HIGH',
    samplingCoverage: 58,
    position: { row: 1, col: 0 },
    cropType: 'Tomato (Abhinav F1)',
    growthStage: 'Fruit Formation',
    growthStageHi: 'फल विकास अवस्था',
    growthStageMr: 'फळ धारणा',
    stageDay: 74,
    gddAccumulated: 1140,
    yieldRiskPct: 28.0,
  },
  {
    id: 'zone-d',
    name: 'Zone D',
    soilConditionScore: 85,
    moisture: 44,
    ph: 7.0,
    npk: { nitrogen: 55, phosphorus: 31, potassium: 46, nitrogenStatus: 'Good', phosphorusStatus: 'Good', potassiumStatus: 'Good', timestamp: formatDateTime(now) },
    cropHealth: 89,
    riskLevel: 'LOW',
    samplingCoverage: 84,
    position: { row: 1, col: 1 },
    cropType: 'Tomato (Abhinav F1)',
    growthStage: 'Vegetative Stage',
    growthStageHi: 'वानस्पतिक बढ़वार',
    growthStageMr: 'शाकीय वाढ',
    stageDay: 36,
    gddAccumulated: 520,
    yieldRiskPct: 15.0,
  },
];

export const mockYieldRiskForecast: YieldRiskForecast = {
  overallYieldRisk: 'MEDIUM',
  projectedYieldRiskPct: 16.5,
  yieldSavedQuintalsPerAcre: 1.8,
  pesticideSavingsInrPerHa: 3800,
  revenuePreservedInrPerAcre: 6300,
  potentialYieldQuintalsPerAcre: 18.0,
  cropType: 'Tomato (Abhinav F1 Hybrid)',
  blanketSprayCostInrPerHa: 5500,
  targetedSprayCostInrPerHa: 1700,
  zones: [
    {
      zoneId: 'ZONE_A',
      zoneName: 'Zone A',
      cropType: 'Tomato (Abhinav F1 Hybrid)',
      growthStage: 'Vegetative Stage',
      growthStageHi: 'वानस्पतिक बढ़वार',
      growthStageMr: 'शाकीय वाढ',
      stageDay: 34,
      gddAccumulated: 490,
      yieldRiskLevel: 'LOW',
      yieldRiskPct: 5.0,
      expectedYieldQuintalsPerAcre: 17.1,
      potentialYieldQuintalsPerAcre: 18.0,
      yieldSavedQuintalsPerAcre: 0.3,
      waterPenaltyPct: 0.0,
      nutrientPenaltyPct: 0.0,
      diseasePenaltyPct: 2.0,
      criticalSensitivity: false,
    },
    {
      zoneId: 'ZONE_B',
      zoneName: 'Zone B',
      cropType: 'Tomato (Abhinav F1 Hybrid)',
      growthStage: 'Flowering & Anthesis',
      growthStageHi: 'फूल आने की अवस्था',
      growthStageMr: 'फुलोरा अवस्था',
      stageDay: 52,
      gddAccumulated: 820,
      yieldRiskLevel: 'MEDIUM',
      yieldRiskPct: 18.0,
      expectedYieldQuintalsPerAcre: 14.76,
      potentialYieldQuintalsPerAcre: 18.0,
      yieldSavedQuintalsPerAcre: 1.2,
      waterPenaltyPct: 12.0,
      nutrientPenaltyPct: 3.0,
      diseasePenaltyPct: 3.0,
      criticalSensitivity: true,
    },
    {
      zoneId: 'ZONE_C',
      zoneName: 'Zone C',
      cropType: 'Tomato (Abhinav F1 Hybrid)',
      growthStage: 'Fruit Formation',
      growthStageHi: 'फल विकास अवस्था',
      growthStageMr: 'फळ धारणा',
      stageDay: 74,
      gddAccumulated: 1140,
      yieldRiskLevel: 'HIGH',
      yieldRiskPct: 28.0,
      expectedYieldQuintalsPerAcre: 12.96,
      potentialYieldQuintalsPerAcre: 18.0,
      yieldSavedQuintalsPerAcre: 1.8,
      waterPenaltyPct: 4.0,
      nutrientPenaltyPct: 5.0,
      diseasePenaltyPct: 19.0,
      criticalSensitivity: false,
    },
    {
      zoneId: 'ZONE_D',
      zoneName: 'Zone D',
      cropType: 'Tomato (Abhinav F1 Hybrid)',
      growthStage: 'Vegetative Stage',
      growthStageHi: 'वानस्पतिक बढ़वार',
      growthStageMr: 'शाकीय वाढ',
      stageDay: 36,
      gddAccumulated: 520,
      yieldRiskLevel: 'MEDIUM',
      yieldRiskPct: 15.0,
      expectedYieldQuintalsPerAcre: 15.3,
      potentialYieldQuintalsPerAcre: 18.0,
      yieldSavedQuintalsPerAcre: 0.9,
      waterPenaltyPct: 0.0,
      nutrientPenaltyPct: 0.0,
      diseasePenaltyPct: 15.0,
      criticalSensitivity: false,
    },
  ],
  decisionInsights: {
    en: 'Rover early scout alert in Zone C prevents systemic blight defoliation, preserving +1.8 Q/Acre. Spot-spraying saves ₹3,800/Ha in chemical inputs.',
    hi: 'जोन C में प्रारंभिक रोग पहचान से +1.8 क्विंटल प्रति एकड़ पैदावार बची। सटीक छिड़काव से रसायनों पर ₹3,800/हेक्टेयर की बचत।',
    mr: 'झोन C मधील सुरुवातीच्या रोग निदानामुळे +1.8 क्विंटल प्रति एकर पीक वाचले. ठरावीक फवारणीमुळे रासायनिक खर्चात ₹3,800/हेक्टर बचत.',
  },
  timestamp: formatDateTime(now),
};

export const mockCropAnalyses: CropAnalysis[] = [
  {
    id: 'crop-1',
    timestamp: formatDateTime(now),
    imageUrl: '',
    diseaseDetection: 'No Disease Detected',
    confidence: 94,
    cropHealth: 'Healthy',
    cropHealthPercent: 87,
    zoneId: 'zone-b',
    notes: 'Latest scan from Zone B, Point 14',
  },
  {
    id: 'crop-2',
    timestamp: formatDateTime(new Date(now.getTime() - 3600000)),
    imageUrl: '',
    diseaseDetection: 'No Disease Detected',
    confidence: 91,
    cropHealth: 'Healthy',
    cropHealthPercent: 85,
    zoneId: 'zone-b',
    notes: 'Scan from Zone B, Point 13',
  },
  {
    id: 'crop-3',
    timestamp: formatDateTime(new Date(now.getTime() - 7200000)),
    imageUrl: '',
    diseaseDetection: 'Possible Nutrient Deficiency',
    confidence: 78,
    cropHealth: 'Possible Nutrient Deficiency',
    cropHealthPercent: 72,
    zoneId: 'zone-c',
    notes: 'Scan from Zone C, Point 20 — flagged for review',
  },
  {
    id: 'crop-4',
    timestamp: formatDateTime(new Date(now.getTime() - 10800000)),
    imageUrl: '',
    diseaseDetection: 'No Disease Detected',
    confidence: 93,
    cropHealth: 'Healthy',
    cropHealthPercent: 88,
    zoneId: 'zone-a',
    notes: 'Scan from Zone A, Point 8',
  },
];

export const mockSystemStatus: SystemStatus = {
  edgeAI: 'Connected',
  sensors: 'Connected',
  backend: 'Connected',
};

function generateHistory(days: number, base: number, variance: number, points: number) {
  const data = [];
  const interval = (days * 24 * 60 * 60 * 1000) / points;
  for (let i = points; i >= 0; i--) {
    const d = new Date(now.getTime() - i * interval);
    data.push({
      timestamp: d.toISOString(),
      value: Math.round((base + (Math.random() - 0.5) * variance) * 10) / 10,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return data;
}

export function getMockHistory(range: TimeRange) {
  const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const points = range === 'today' ? 24 : range === '7d' ? 28 : range === '30d' ? 30 : 45;
  return {
    soilMoisture: generateHistory(days, 42, 12, points),
    soilTemperature: generateHistory(days, 24.5, 4, points),
    ph: generateHistory(days, 6.8, 0.6, points),
    ec: generateHistory(days, 1.42, 0.4, points),
    nitrogen: generateHistory(days, 52, 15, points),
    phosphorus: generateHistory(days, 29, 8, points),
    potassium: generateHistory(days, 45, 10, points),
  };
}

export function getMockAnalytics(range: TimeRange): AnalyticsData {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const points = range === '7d' ? 28 : range === '30d' ? 30 : 45;
  return {
    soilMoisture: generateHistory(days, 42, 12, points),
    ph: generateHistory(days, 6.8, 0.6, points),
    nitrogen: generateHistory(days, 52, 15, points),
    phosphorus: generateHistory(days, 29, 8, points),
    potassium: generateHistory(days, 45, 10, points),
    cropHealth: generateHistory(days, 85, 10, points),
    soilConditionScore: generateHistory(days, 82, 8, points),
    environmentalRisk: generateHistory(days, 25, 15, points),
    samplingCoverage: mockFarmZones.map((z) => ({
      zoneId: z.id,
      zoneName: z.name,
      coverage: z.samplingCoverage,
    })),
  };
}

export const mockFarmMap: FarmMapData = {
  rover: mockRoverStatus,
  zones: mockFarmZones,
  attentionAreas: [{ x: 78, y: 72, zoneId: 'zone-c' }],
  samplingPoints: [
    { id: 'sp-1', zoneId: 'zone-a', pointNumber: 1, x: 12, y: 15, status: 'completed' },
    { id: 'sp-2', zoneId: 'zone-a', pointNumber: 2, x: 28, y: 15, status: 'completed' },
    { id: 'sp-3', zoneId: 'zone-a', pointNumber: 3, x: 42, y: 15, status: 'completed' },
    { id: 'sp-4', zoneId: 'zone-b', pointNumber: 4, x: 58, y: 15, status: 'completed' },
    { id: 'sp-5', zoneId: 'zone-b', pointNumber: 5, x: 72, y: 15, status: 'completed' },
    { id: 'sp-6', zoneId: 'zone-a', pointNumber: 6, x: 12, y: 35, status: 'completed' },
    { id: 'sp-7', zoneId: 'zone-a', pointNumber: 7, x: 28, y: 35, status: 'completed' },
    { id: 'sp-8', zoneId: 'zone-b', pointNumber: 8, x: 42, y: 35, status: 'completed' },
    { id: 'sp-9', zoneId: 'zone-b', pointNumber: 9, x: 58, y: 35, status: 'completed' },
    { id: 'sp-10', zoneId: 'zone-b', pointNumber: 10, x: 72, y: 35, status: 'completed' },
    { id: 'sp-11', zoneId: 'zone-c', pointNumber: 11, x: 12, y: 55, status: 'completed' },
    { id: 'sp-12', zoneId: 'zone-c', pointNumber: 12, x: 28, y: 55, status: 'completed' },
    { id: 'sp-13', zoneId: 'zone-b', pointNumber: 13, x: 42, y: 55, status: 'completed' },
    { id: 'sp-14', zoneId: 'zone-b', pointNumber: 14, x: 55, y: 62, status: 'current' },
    { id: 'sp-15', zoneId: 'zone-c', pointNumber: 15, x: 72, y: 55, status: 'pending' },
    { id: 'sp-16', zoneId: 'zone-c', pointNumber: 16, x: 78, y: 72, status: 'attention' },
    { id: 'sp-17', zoneId: 'zone-d', pointNumber: 17, x: 12, y: 82, status: 'pending' },
    { id: 'sp-18', zoneId: 'zone-d', pointNumber: 18, x: 28, y: 82, status: 'pending' },
    { id: 'sp-19', zoneId: 'zone-d', pointNumber: 19, x: 42, y: 82, status: 'pending' },
    { id: 'sp-20', zoneId: 'zone-d', pointNumber: 20, x: 58, y: 82, status: 'pending' },
  ],
};

// Mutable rover state for demo simulation
let simulatedRoverState: RoverStatus = { ...mockRoverStatus };

export function getSimulatedRoverStatus(): RoverStatus {
  return { ...simulatedRoverState };
}

export function simulateRoverAction(action: 'start' | 'pause' | 'resume' | 'return' | 'emergency-stop'): RoverStatus {
  switch (action) {
    case 'start':
      simulatedRoverState = { ...simulatedRoverState, state: 'ACTIVE' };
      break;
    case 'pause':
      simulatedRoverState = { ...simulatedRoverState, state: 'PAUSED' };
      break;
    case 'resume':
      simulatedRoverState = { ...simulatedRoverState, state: 'ACTIVE' };
      break;
    case 'return':
      simulatedRoverState = { ...simulatedRoverState, state: 'RETURNING' };
      break;
    case 'emergency-stop':
      simulatedRoverState = { ...simulatedRoverState, state: 'EMERGENCY_STOP' };
      break;
  }
  return { ...simulatedRoverState };
}

export function resetRoverState() {
  simulatedRoverState = { ...mockRoverStatus };
}

export function filterAlerts(alerts: Alert[], filter: AlertFilter): Alert[] {
  if (filter === 'all') return alerts;
  if (filter === 'resolved') return alerts.filter((a) => a.status === 'resolved');
  return alerts.filter((a) => a.severity.toLowerCase() === filter);
}

let simulatedRelayState: RelayState = {
  mode: 'AUTO',
  state: 'STANDBY',
  pumpActive: false,
  lastUpdated: new Date().toISOString(),
};

export const mockIrrigationSchedule: IrrigationSchedule = {
  status: 'IRRIGATION_RECOMMENDED',
  nextWindow: 'Tomorrow at 06:00 AM – 06:45 AM',
  nextWindowHi: 'कल सुबह 06:00 AM – 06:45 AM',
  nextWindowMr: 'उद्या सकाळी ०६:०० AM – ०६:४५ AM',
  durationMinutes: 45,
  waterVolumeLiters: 1260,
  waterSavedLiters: 440,
  rationale: 'Soil moisture at 24% requires replenishment. Early morning schedule minimizes solar evaporative loss by 35%.',
  rationaleHi: 'मिट्टी में नमी 24% है। सुबह 6 बजे ड्रिप सिंचाई से वाष्पीकरण का नुकसान 35% तक कम होगा।',
  rationaleMr: 'मातीतील ओलावा २४% आहे. पहाटे ६ वाजता ठिबक सिंचनाने पाण्याचे बाष्पीभवन ३५% कमी होते.',
  currentSoilMoisture: 24.0,
  targetSoilMoisture: 40.0,
  rain48hForecastMm: 0.0,
  evapotranspirationRateMm: 4.2,
  valveRecommended: 'SCHEDULED',
  irrigationMethod: 'Precision Root-Zone Drip System',
  timestamp: new Date().toISOString(),
  relayState: simulatedRelayState,
};

export function setSimulatedRelay(mode: 'AUTO' | 'MANUAL', state: 'STANDBY' | 'ACTIVE' | 'OFF'): RelayState {
  simulatedRelayState = {
    mode,
    state,
    pumpActive: state === 'ACTIVE',
    lastUpdated: new Date().toISOString(),
  };
  return { ...simulatedRelayState };
}

export function getSimulatedRelay(): RelayState {
  return { ...simulatedRelayState };
}

export type { RoverState };
