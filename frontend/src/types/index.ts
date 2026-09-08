export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type HealthStatus = 'Healthy' | 'Optimal' | 'Moderate' | 'Attention Required' | 'Critical';
export type RoverState = 'ACTIVE' | 'IDLE' | 'OFFLINE' | 'PAUSED' | 'RETURNING' | 'EMERGENCY_STOP';
export type FarmStatus = 'Healthy' | 'Attention Required' | 'Critical';
export type TimeRange = 'today' | '7d' | '30d' | '90d';
export type AlertFilter = 'all' | 'critical' | 'high' | 'medium' | 'low' | 'resolved';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type NutrientStatus = 'Good' | 'Moderate' | 'Low' | 'Deficient';
export type CropHealthStatus = 'Healthy' | 'Possible Disease Detected' | 'Possible Nutrient Deficiency' | 'Water Stress' | 'Pest Infestation Detected';
export type ConnectionStatus = 'Connected' | 'Disconnected' | 'Degraded';

export interface SensorReading {
  id: string;
  timestamp: string;
  soilMoisture: number;
  soilTemperature: number;
  soilPh: number;
  electricalConductivity: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  airTemperature: number;
  airHumidity: number;
  zoneId: string;
  samplingPoint: number;
}

export interface NPKReading {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  nitrogenStatus: NutrientStatus;
  phosphorusStatus: NutrientStatus;
  potassiumStatus: NutrientStatus;
  timestamp: string;
}

export interface SoilAnalysis {
  overallScore: number;
  moisture: NutrientStatus;
  ph: NutrientStatus;
  npk: NutrientStatus;
  ec: NutrientStatus;
  temperature: NutrientStatus;
  derivedFrom: string;
  timestamp: string;
}

export interface CropAnalysis {
  id: string;
  timestamp: string;
  imageUrl: string;
  diseaseDetection: string;
  confidence: number;
  cropHealth: CropHealthStatus;
  cropHealthPercent: number;
  zoneId: string;
  notes?: string;
  modelType?: 'disease' | 'pest';
  pestName?: string;
  hindiName?: string;
  marathiName?: string;
  severity?: string;
  treatment?: string;
  topK?: Array<{
    index: number;
    name: string;
    pretty: string;
    crop?: string;
    confidence: number;
    hindi?: string;
    marathi?: string;
    treatment?: string;
  }>;
}

export interface Recommendation {
  id: string;
  category: 'IRRIGATION' | 'NUTRIENTS' | 'HEAT_STRESS' | 'DISEASE' | 'PEST' | 'GENERAL';
  issue: string;
  severity: Severity;
  reason: string;
  action: string;
  timestamp: string;
  icon: string;
}

export interface Alert {
  id: string;
  type: string;
  severity: Severity;
  location: string;
  message: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'acknowledged';
}

export interface RoverStatus {
  state: RoverState;
  battery: number;
  currentZone: string;
  currentSamplingPoint: number;
  distanceCovered: number;
  totalSamplingPoints: number;
  completedSamplingPoints: number;
  obstacleStatus: 'Clear' | 'Detected' | 'Avoiding';
  connection: ConnectionStatus;
  lastScan: string;
  position: { x: number; y: number };
}

export interface FarmZone {
  id: string;
  name: string;
  soilConditionScore: number;
  moisture: number;
  ph: number;
  npk: NPKReading;
  cropHealth: number;
  riskLevel: RiskLevel;
  samplingCoverage: number;
  position: { row: number; col: number };
  cropType?: string;
  growthStage?: string;
  growthStageHi?: string;
  growthStageMr?: string;
  stageDay?: number;
  gddAccumulated?: number;
  yieldRiskPct?: number;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitationRate: number;
  windSpeed: number;
  weatherCode: number;
  condition: string;
  conditionHi?: string;
  conditionMr?: string;
  icon: string;
}

export interface DailyForecastItem {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationMm: number;
  precipProbability: number;
  et0Mm: number;
  riverDischargeM3s: number;
  condition: string;
  conditionHi?: string;
  conditionMr?: string;
  icon: string;
}

export interface FloodPrediction {
  severity: RiskLevel;
  probability: number;
  rain48hForecastMm: number;
  peakRiverDischargeM3s: number;
  meanRiverDischargeM3s: number;
  surfaceRunoffRisk: string;
  model: string;
}

export interface DroughtPrediction {
  severity: RiskLevel;
  probability: number;
  netWaterBalance7dMm: number;
  totalEvapotranspiration7dMm: number;
  totalRain7dMm: number;
  daysOfWaterReserve: number;
  model: string;
}

export interface HeatStressPrediction {
  severity: RiskLevel;
  probability: number;
  peakTempForecast: number;
  apparentHeatIndex: number;
  imdStatus: string;
  model: string;
}

export interface FoliarDiseasePrediction {
  severity: RiskLevel;
  probability: number;
  relativeHumidity: number;
  infectionWindowActive: boolean;
  model: string;
}

export interface AgroPredictions {
  flood: FloodPrediction;
  drought: DroughtPrediction;
  heatStress: HeatStressPrediction;
  foliarDisease: FoliarDiseasePrediction;
  waterStress: { severity: RiskLevel };
}

export interface EnvironmentalRisk {
  droughtRisk: RiskLevel;
  floodRisk: RiskLevel;
  heatStressRisk: RiskLevel;
  cropDiseaseRisk: RiskLevel;
  waterStressRisk: RiskLevel;
  airTemperature: number;
  humidity: number;
  soilTemperature: number;
  soilMoisture: number;
  rainfall?: number;
  weatherCondition?: string;
  weatherIntegrationPending: boolean;
  timestamp: string;
  location?: { latitude: number; longitude: number };
  currentWeather?: CurrentWeather;
  predictions?: AgroPredictions;
  dailyForecast?: DailyForecastItem[];
  advisories?: Record<string, { title: string; action: string; cause: string }>;
  source?: string;
}

export interface DashboardSummary {
  farmStatus: FarmStatus;
  lastScan: string;
  roverStatus: RoverState;
  connectivity: ConnectionStatus;
  soilConditionScore: number;
  soilConditionStatus: HealthStatus;
  soilMoisture: number;
  soilMoistureStatus: HealthStatus;
  temperature: number;
  soilTemperature?: number | null;
  soilPh: number;
  soilPhStatus: HealthStatus;
  electricalConductivity: number;
  npk: NPKReading;
  cropHealth: number;
  waterStress: RiskLevel;
  lastSynchronized: string;
  farmName: string;
  isDemo?: boolean;
  telemetryZoneId?: string | null;
  telemetrySource?: string | null;
}

export interface AIAnalysisResult {
  soilConditionScore: number;
  cropHealth: number;
  waterStressRisk: RiskLevel;
  diseaseRisk: RiskLevel;
  nutrientDeficiency: string;
  yieldRisk: RiskLevel;
  timestamp: string;
}

export interface SamplingPoint {
  id: string;
  zoneId: string;
  pointNumber: number;
  x: number;
  y: number;
  status: 'completed' | 'current' | 'pending' | 'attention';
}

export interface HistoricalDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface AnalyticsData {
  soilMoisture: HistoricalDataPoint[];
  ph: HistoricalDataPoint[];
  nitrogen: HistoricalDataPoint[];
  phosphorus: HistoricalDataPoint[];
  potassium: HistoricalDataPoint[];
  cropHealth: HistoricalDataPoint[];
  soilConditionScore: HistoricalDataPoint[];
  environmentalRisk: HistoricalDataPoint[];
  samplingCoverage: { zoneId: string; zoneName: string; coverage: number }[];
}

export interface SystemStatus {
  edgeAI: ConnectionStatus;
  sensors: ConnectionStatus;
  backend: ConnectionStatus;
}

export interface FarmMapData {
  rover: RoverStatus;
  samplingPoints: SamplingPoint[];
  zones: FarmZone[];
  attentionAreas: { x: number; y: number; zoneId: string }[];
}

export interface RelayState {
  mode: 'AUTO' | 'MANUAL';
  state: 'STANDBY' | 'ACTIVE' | 'OFF';
  pumpActive: boolean;
  lastUpdated?: string;
}

export interface IrrigationSchedule {
  status: 'DELAYED_FOR_RAIN' | 'IRRIGATION_RECOMMENDED' | 'ADEQUATELY_HYDRATED';
  nextWindow: string;
  nextWindowHi?: string;
  nextWindowMr?: string;
  durationMinutes: number;
  waterVolumeLiters: number;
  waterSavedLiters: number;
  rationale: string;
  rationaleHi?: string;
  rationaleMr?: string;
  currentSoilMoisture: number;
  targetSoilMoisture: number;
  rain48hForecastMm: number;
  evapotranspirationRateMm: number;
  valveRecommended: 'STANDBY' | 'SCHEDULED' | 'ACTIVE';
  irrigationMethod: string;
  timestamp: string;
  relayState: RelayState;
}

export interface ZoneYieldRisk {
  zoneId: string;
  zoneName: string;
  cropType: string;
  growthStage: string;
  growthStageHi?: string;
  growthStageMr?: string;
  stageDay: number;
  gddAccumulated: number;
  yieldRiskLevel: RiskLevel;
  yieldRiskPct: number;
  expectedYieldQuintalsPerAcre: number;
  potentialYieldQuintalsPerAcre: number;
  yieldSavedQuintalsPerAcre: number;
  waterPenaltyPct: number;
  nutrientPenaltyPct: number;
  diseasePenaltyPct: number;
  criticalSensitivity: boolean;
}

export interface YieldRiskForecast {
  overallYieldRisk: RiskLevel;
  projectedYieldRiskPct: number;
  yieldSavedQuintalsPerAcre: number;
  pesticideSavingsInrPerHa: number;
  revenuePreservedInrPerAcre: number;
  potentialYieldQuintalsPerAcre: number;
  cropType: string;
  blanketSprayCostInrPerHa: number;
  targetedSprayCostInrPerHa: number;
  zones: ZoneYieldRisk[];
  decisionInsights: {
    en: string;
    hi: string;
    mr: string;
  };
  timestamp: string;
}

export interface SMSDispatchRequest {
  phoneNumber: string;
  recipientName?: string;
  channel: 'SMS' | 'WHATSAPP';
  language: 'en' | 'hi' | 'mr';
  messageText: string;
  alertId?: string;
  zoneId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  fast2smsApiKey?: string;
  callmebotApiKey?: string;
}


export interface SMSDispatchResponse {
  status: string;
  channel: string;
  recipientName: string;
  phoneNumber: string;
  operator: string;
  referenceId: string;
  charCount: number;
  smsParts: number;
  costInr: number;
  deliveredAt: string;
  payloadPreview: string;
  liveDispatched?: boolean;
  whatsappUrl?: string;
  smsUri?: string;
}

