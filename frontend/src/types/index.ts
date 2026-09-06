export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type HealthStatus = 'Healthy' | 'Optimal' | 'Moderate' | 'Attention Required' | 'Critical';
export type RoverState = 'ACTIVE' | 'IDLE' | 'OFFLINE' | 'PAUSED' | 'RETURNING' | 'EMERGENCY_STOP';
export type FarmStatus = 'Healthy' | 'Attention Required' | 'Critical';
export type TimeRange = 'today' | '7d' | '30d' | '90d';
export type AlertFilter = 'all' | 'critical' | 'high' | 'medium' | 'low' | 'resolved';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type NutrientStatus = 'Good' | 'Moderate' | 'Low' | 'Deficient';
export type CropHealthStatus = 'Healthy' | 'Possible Disease Detected' | 'Possible Nutrient Deficiency' | 'Water Stress';
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
}

export interface Recommendation {
  id: string;
  category: 'IRRIGATION' | 'NUTRIENTS' | 'HEAT_STRESS' | 'DISEASE' | 'GENERAL';
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
  soilPh: number;
  soilPhStatus: HealthStatus;
  electricalConductivity: number;
  npk: NPKReading;
  cropHealth: number;
  waterStress: RiskLevel;
  lastSynchronized: string;
  farmName: string;
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
