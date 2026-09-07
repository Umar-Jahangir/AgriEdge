export type Language = 'en' | 'hi' | 'mr';

export interface Translations {
  // Navigation & Headers
  dashboard: string;
  farmMap: string;
  soilHealth: string;
  cropHealth: string;
  aiAnalysis: string;
  recommendations: string;
  environmentalRisk: string;
  rover: string;
  analytics: string;
  alerts: string;
  settings: string;
  logout: string;

  // Workstation Header
  workstationTitle: string;
  site: string;
  roverStatus: string;
  connected: string;
  offline: string;
  sync: string;
  prototype: string;

  // Dashboard Sections
  fieldTopography: string;
  actionablePrescriptions: string;
  coordinateGridTitle: string;
  samplingArrayTitle: string;
  aiFused: string;

  // Map Sectors & Legends
  sectorNW: string;
  sectorNE: string;
  sectorSW: string;
  sectorSE: string;
  legendCompleted: string;
  legendCurrent: string;
  legendPending: string;
  legendAttention: string;
  coordinatesStamp: string;

  // Agronomic Telemetry
  soilConditionScore: string;
  soilMoisture: string;
  soilTemperature: string;
  soilPh: string;
  electricalConductivity: string;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  cropVigor: string;
  cropHealthPercent: string;

  // Statuses
  healthy: string;
  optimal: string;
  moderate: string;
  attentionRequired: string;
  critical: string;
  active: string;
  resolved: string;

  // Risk Vectors
  droughtRisk: string;
  floodRisk: string;
  heatStressRisk: string;
  diseaseRisk: string;
  waterStressRisk: string;

  // Rover & Controls
  startMission: string;
  pause: string;
  resume: string;
  returnToBase: string;
  emergencyStop: string;
  samplingProgress: string;
  waypoints: string;
  battery: string;
  distanceCovered: string;

  // Recommendations & Categories
  agronomicAdvisory: string;
  irrigateNow: string;
  delayIrrigation: string;
  readAloud: string;
  readingOutLoud: string;
  category: string;
  severity: string;
  recommendedAction: string;
  cause: string;
  catIrrigation: string;
  catDisease: string;
  catPest: string;
  catNutrients: string;
  catHeatStress: string;
  catGeneral: string;

  // ElevenLabs Voice
  elevenLabsVoice: string;
  elevenLabsStatus: string;

  // Edge AI
  edgeAiInference: string;
  uploadFoliage: string;
  analyzing: string;
  leafInspection: string;
  confidence: string;

  // Common
  allEvents: string;
  today: string;
  sevenDays: string;
  thirtyDays: string;
  ninetyDays: string;
  sector: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    dashboard: 'Dashboard',
    farmMap: 'Farm Map',
    soilHealth: 'Soil Health',
    cropHealth: 'Crop Health',
    aiAnalysis: 'AI Analysis',
    recommendations: 'Recommendations',
    environmentalRisk: 'Environmental Risk',
    rover: 'Rover Control',
    analytics: 'Analytics',
    alerts: 'Alerts & Events',
    settings: 'Settings',
    logout: 'Logout',

    workstationTitle: 'AGRIEDGE // AUTONOMOUS ROVER WORKSTATION',
    site: 'SITE',
    roverStatus: 'ROVER',
    connected: 'CONNECTED',
    offline: 'OFFLINE',
    sync: 'SYNC',
    prototype: 'PROTOTYPE',

    fieldTopography: 'FIELD TOPOGRAPHY & ROVER TRAJECTORY',
    actionablePrescriptions: 'ACTIONABLE FIELD PRESCRIPTIONS',
    coordinateGridTitle: 'FIELD COORDINATE GRID',
    samplingArrayTitle: 'AUTONOMOUS ROVER SAMPLING ARRAY',
    aiFused: 'AI FUSED',

    sectorNW: 'SECTOR A // NW',
    sectorNE: 'SECTOR B // NE',
    sectorSW: 'SECTOR C // SW',
    sectorSE: 'SECTOR D // SE',
    legendCompleted: 'COMPLETED',
    legendCurrent: 'CURRENT',
    legendPending: 'PENDING',
    legendAttention: 'ATTENTION',
    coordinatesStamp: 'COORDINATES: LAT 18.5204° N, LONG 73.8567° E',

    soilConditionScore: 'Soil Condition Score',
    soilMoisture: 'Soil Moisture',
    soilTemperature: 'Soil Temperature',
    soilPh: 'Soil pH',
    electricalConductivity: 'Electrical Conductivity',
    nitrogen: 'Nitrogen (N)',
    phosphorus: 'Phosphorus (P)',
    potassium: 'Potassium (K)',
    cropVigor: 'Canopy Vigor Index',
    cropHealthPercent: 'Crop Health Index',

    healthy: 'Healthy',
    optimal: 'Optimal',
    moderate: 'Moderate',
    attentionRequired: 'Attention Required',
    critical: 'Critical',
    active: 'Active',
    resolved: 'Resolved',

    droughtRisk: 'Drought Risk',
    floodRisk: 'Flood Risk',
    heatStressRisk: 'Heat Stress Risk',
    diseaseRisk: 'Disease Risk',
    waterStressRisk: 'Water Stress Risk',

    startMission: 'START MISSION',
    pause: 'PAUSE',
    resume: 'RESUME',
    returnToBase: 'RETURN TO BASE',
    emergencyStop: 'EMERGENCY STOP',
    samplingProgress: 'Sampling Progress',
    waypoints: 'Waypoints',
    battery: 'Battery',
    distanceCovered: 'Distance Covered',

    agronomicAdvisory: 'Agronomic Prescriptions & Directives',
    irrigateNow: 'Irrigate Now',
    delayIrrigation: 'Delay Irrigation',
    readAloud: 'LISTEN ADVISORY',
    readingOutLoud: 'PLAYING AUDIO...',
    category: 'CATEGORY',
    severity: 'SEVERITY',
    recommendedAction: 'RECOMMENDED ACTION',
    cause: 'CAUSE',
    catIrrigation: 'IRRIGATION',
    catDisease: 'DISEASE',
    catPest: 'PEST',
    catNutrients: 'NUTRIENTS',
    catHeatStress: 'HEAT STRESS',
    catGeneral: 'GENERAL',

    elevenLabsVoice: 'ElevenLabs Studio Voice',
    elevenLabsStatus: 'Active Multilingual V2',

    edgeAiInference: 'Edge AI Inference',
    uploadFoliage: 'Upload Leaf Image',
    analyzing: 'Analyzing...',
    leafInspection: 'Leaf Pathology Station',
    confidence: 'Confidence',

    allEvents: 'All Events',
    today: 'Today',
    sevenDays: '7 Days',
    thirtyDays: '30 Days',
    ninetyDays: '90 Days',
    sector: 'Sector',
  },

  hi: {
    dashboard: 'डैशबोर्ड',
    farmMap: 'खेत का नक्शा',
    soilHealth: 'मृदा स्वास्थ्य',
    cropHealth: 'फसल स्वास्थ्य',
    aiAnalysis: 'एआई विश्लेषण',
    recommendations: 'कृषि सलाह',
    environmentalRisk: 'मौसम और पर्यावरण जोखिम',
    rover: 'रोवर नियंत्रण',
    analytics: 'पुराने आंकड़े (एनालिटिक्स)',
    alerts: 'सचेत और अलर्ट',
    settings: 'सेटिंग्स',
    logout: 'लॉगआउट',

    workstationTitle: 'एग्री-एज // स्वायत्त रोवर स्टेशन',
    site: 'खेत',
    roverStatus: 'रोवर',
    connected: 'जुड़ा हुआ है',
    offline: 'ऑफलाइन',
    sync: 'सिंक',
    prototype: 'प्रोटोटाइप',

    fieldTopography: 'खेत की स्थलाकृति और रोवर पथ',
    actionablePrescriptions: 'किसान सलाह एवं उपचार निर्देश',
    coordinateGridTitle: 'खेत निर्देशांक ग्रिड',
    samplingArrayTitle: 'स्वायत्त रोवर नमूना जांच प्रणाली',
    aiFused: 'एआई द्वारा प्रमाणित',

    sectorNW: 'जोन A // उत्तर-पश्चिम',
    sectorNE: 'जोन B // उत्तर-पूर्व',
    sectorSW: 'जोन C // दक्षिण-पश्चिम',
    sectorSE: 'जोन D // दक्षिण-पूर्व',
    legendCompleted: 'जांच पूर्ण (COMPLETED)',
    legendCurrent: 'वर्तमान बिंदु (CURRENT)',
    legendPending: 'शेष (PENDING)',
    legendAttention: 'सावधानी (ATTENTION)',
    coordinatesStamp: 'निर्देशांक: अक्षांश 18.5204° N, देशांतर 73.8567° E',

    soilConditionScore: 'मृदा स्वास्थ्य स्कोर',
    soilMoisture: 'मिट्टी की नमी',
    soilTemperature: 'मिट्टी का तापमान',
    soilPh: 'मिट्टी का पीएच (pH)',
    electricalConductivity: 'विद्युत चालकता (EC)',
    nitrogen: 'नाइट्रोजन (N)',
    phosphorus: 'फास्फोरस (P)',
    potassium: 'पोटैशियम (K)',
    cropVigor: 'फसल विकास सूचकांक',
    cropHealthPercent: 'फसल स्वास्थ्य प्रतिशत',

    healthy: 'स्वस्थ',
    optimal: 'उत्कृष्ट',
    moderate: 'मध्यम',
    attentionRequired: 'ध्यान आवश्यक',
    critical: 'गंभीर',
    active: 'सक्रिय',
    resolved: 'हल किया गया',

    droughtRisk: 'सूखे का खतरा',
    floodRisk: 'जलभराव / बाढ़ का खतरा',
    heatStressRisk: 'अत्यधिक गर्मी का खतरा',
    diseaseRisk: 'फसल रोग का खतरा',
    waterStressRisk: 'पानी की कमी का खतरा',

    startMission: 'निरीक्षण शुरू करें',
    pause: 'रोकें',
    resume: 'पुनः चालू करें',
    returnToBase: 'बेस पर लौटें',
    emergencyStop: 'आपातकालीन रोक (STOP)',
    samplingProgress: 'नमूना जांच प्रगति',
    waypoints: 'जांच बिंदु',
    battery: 'बैटरी',
    distanceCovered: 'तय की गई दूरी',

    agronomicAdvisory: 'किसान सलाह एवं उपचार निर्देश',
    irrigateNow: 'अभी सिंचाई करें',
    delayIrrigation: 'सिंचाई टालें',
    readAloud: 'सलाह सुनें (आवाज़)',
    readingOutLoud: 'आवाज़ बज रही है...',
    category: 'श्रेणी',
    severity: 'गंभीरता',
    recommendedAction: 'उपचार और कार्यवाही',
    cause: 'कारण',
    catIrrigation: 'सिंचाई (IRRIGATION)',
    catDisease: 'रोग नियंत्रण (DISEASE)',
    catPest: 'कीट प्रकोप (PEST)',
    catNutrients: 'पोषक तत्व (NUTRIENTS)',
    catHeatStress: 'गर्मी का तनाव (HEAT)',
    catGeneral: 'सामान्य सलाह',

    elevenLabsVoice: 'इलेवन-लैब्स आवाज (ElevenLabs)',
    elevenLabsStatus: 'मल्टीलिंगुअल V2 सक्रिय',

    edgeAiInference: 'ऑन-डिवाइस एआई जांच',
    uploadFoliage: 'पत्ते की फोटो अपलोड करें',
    analyzing: 'विश्लेषण हो रहा है...',
    leafInspection: 'पत्ता रोग परीक्षण केंद्र',
    confidence: 'सटीकता',

    allEvents: 'सभी अलर्ट',
    today: 'आज',
    sevenDays: '7 दिन',
    thirtyDays: '30 दिन',
    ninetyDays: '90 दिन',
    sector: 'भाग / जोन',
  },

  mr: {
    dashboard: 'डॅशबोर्ड',
    farmMap: 'शेत नकाशा',
    soilHealth: 'मातीचे आरोग्य',
    cropHealth: 'पीक आरोग्य',
    aiAnalysis: 'एआय विश्लेषण',
    recommendations: 'शेतकरी सल्ला',
    environmentalRisk: 'हवामान व जोखीम',
    rover: 'रोव्हर नियंत्रण',
    analytics: 'जुनी आकडेवारी',
    alerts: 'सूचना व इशारे',
    settings: 'सेटिंग्ज',
    logout: 'बाहेर पडा',

    workstationTitle: 'अ‍ॅग्री-एज // स्वयंचलित रोव्हर केंद्र',
    site: 'शेत',
    roverStatus: 'रोव्हर',
    connected: 'जोडलेले आहे',
    offline: 'ऑफलाइन',
    sync: 'सिंक',
    prototype: 'प्रोटोटाइप',

    fieldTopography: 'शेताची रचना आणि रोव्हर मार्ग',
    actionablePrescriptions: 'शेतकरी सल्ला व उपाययोजना',
    coordinateGridTitle: 'शेत निर्देशांक ग्रिड',
    samplingArrayTitle: 'स्वयंचलित रोव्हर नमुना तपासणी',
    aiFused: 'एआय आधारित',

    sectorNW: 'झोन A // वायव्य',
    sectorNE: 'झोन B // ईशान्य',
    sectorSW: 'झोन C // नैऋत्य',
    sectorSE: 'झोन D // आग्नेय',
    legendCompleted: 'तपासणी पूर्ण (COMPLETED)',
    legendCurrent: 'सध्याचे स्थान (CURRENT)',
    legendPending: 'प्रलंबित (PENDING)',
    legendAttention: 'लक्ष द्या (ATTENTION)',
    coordinatesStamp: 'निर्देशांक: अक्षांश 18.5204° N, रेखांश 73.8567° E',

    soilConditionScore: 'माती आरोग्य निर्देशांक',
    soilMoisture: 'मातीतील ओलावा',
    soilTemperature: 'मातीचे तापमान',
    soilPh: 'मातीचा सामू (pH)',
    electricalConductivity: 'विद्युत वाहकता (EC)',
    nitrogen: 'नायट्रोजन (N)',
    phosphorus: 'फॉस्फरस (P)',
    potassium: 'पोटॅशियम (K)',
    cropVigor: 'पीक वाढ निर्देशांक',
    cropHealthPercent: 'पीक आरोग्य टक्केवारी',

    healthy: 'निरोगी',
    optimal: 'उत्कृष्ट',
    moderate: 'मध्यम',
    attentionRequired: 'लक्ष देणे गरजेचे',
    critical: 'गंभीर',
    active: 'सक्रिय',
    resolved: 'निवारण झाले',

    droughtRisk: 'दुष्काळ जोखीम',
    floodRisk: 'अतिवृष्टी / पूर जोखीम',
    heatStressRisk: 'उष्णतेचा ताण',
    diseaseRisk: 'रोग प्रादुर्भाव जोखीम',
    waterStressRisk: 'पाण्याचा ताण',

    startMission: 'तपासणी सुरू करा',
    pause: 'थांबवा',
    resume: 'पुन्हा सुरू करा',
    returnToBase: 'मुख्यालयात परता',
    emergencyStop: 'तातडीने थांबवा (STOP)',
    samplingProgress: 'नमुना तपासणी प्रगती',
    waypoints: 'तपासणी बिंदू',
    battery: 'बॅटरी',
    distanceCovered: 'कापलेले अंतर',

    agronomicAdvisory: 'शेतकरी सल्ला व उपाययोजना',
    irrigateNow: 'आता पाणी द्या',
    delayIrrigation: 'पाणी देणे पुढे ढकला',
    readAloud: 'सल्ला ऐका (आवाज)',
    readingOutLoud: 'आवाज ऐकू येत आहे...',
    category: 'प्रवर्ग',
    severity: 'तीव्रता',
    recommendedAction: 'शिफारस केलेली कृती',
    cause: 'कारण',
    catIrrigation: 'पाणी व्यवस्थापन (IRRIGATION)',
    catDisease: 'रोग नियंत्रण (DISEASE)',
    catPest: 'कीड नियंत्रण (PEST)',
    catNutrients: 'खत व्यवस्थापन (NUTRIENTS)',
    catHeatStress: 'उष्णता ताण (HEAT)',
    catGeneral: 'सर्वसाधारण सल्ला',

    elevenLabsVoice: 'इलेव्हन-लॅब्स आवाज (ElevenLabs)',
    elevenLabsStatus: 'मल्टीलिंग्युअल V2 सक्रिय',

    edgeAiInference: 'ऑन-डिव्हाइस एआय तपासणी',
    uploadFoliage: 'पानाचा फोटो अपलोड करा',
    analyzing: 'तपासणी सुरू आहे...',
    leafInspection: 'पान रोग निदान केंद्र',
    confidence: 'अचूकता',

    allEvents: 'सर्व इशारे',
    today: 'आज',
    sevenDays: '७ दिवस',
    thirtyDays: '३० दिवस',
    ninetyDays: '९० दिवस',
    sector: 'विभाग / झोन',
  },
};

/** Dynamic Agronomic Content Translators **/

const issueTranslations: Record<string, Record<Language, string>> = {
  'possible water stress indicators': {
    en: 'Possible water stress indicators',
    hi: 'जल तनाव (पानी की कमी) के संकेत',
    mr: 'पाण्याचा ताण जाणवत आहे',
  },
  'possible disease detected': {
    en: 'Possible disease detected',
    hi: 'पत्तियों में संभावित रोग के लक्षण',
    mr: 'पानांवर संभाव्य रोगाची लक्षणे',
  },
  'pest activity detected': {
    en: 'Pest activity detected',
    hi: 'कीट (पेस्ट) प्रकोप का पता चला',
    mr: 'किडीचा प्रादुर्भाव आढळला',
  },
  'nitrogen deficiency': {
    en: 'Nitrogen Deficiency',
    hi: 'नाइट्रोजन की कमी',
    mr: 'नायट्रोजनची कमतरता',
  },
  'temperature monitoring': {
    en: 'Temperature Monitoring',
    hi: 'तापमान निगरानी चेतावनी',
    mr: 'तापमान वाढीची चेतावणी',
  },
  'disease screening': {
    en: 'Disease Screening',
    hi: 'रोग जांच एवं निगरानी',
    mr: 'रोग तपासणी व देखरेख',
  },
};

const actionTranslations: Record<string, Record<Language, string>> = {
  'inspect zone b and consider irrigation based on crop requirements and local agronomic guidance.': {
    en: 'Inspect Zone B and consider irrigation based on crop requirements and local agronomic guidance.',
    hi: 'जोन B का निरीक्षण करें और फसल की आवश्यकतानुसार तुरंत सिंचाई शुरू करें।',
    mr: 'झोन B ची पाहणी करा आणि पिकाच्या गरजेनुसार ताबडतोब पाणी द्या.',
  },
  'inspect affected plants in zone c. visual symptoms suggest possible disease.': {
    en: 'Inspect affected plants in Zone C. Visual symptoms suggest possible disease.',
    hi: 'जोन C में प्रभावित पौधों की जांच करें। लक्षणों के आधार पर कवकनाशी या जैविक उपचार लागू करें।',
    mr: 'झोन C मधील बाधित पिकांची पाहणी करा आणि त्वरित औषध फवारणी करा.',
  },
  'pest activity detected in zone d. inspect affected plants and consider appropriate integrated pest-management action.': {
    en: 'Pest activity detected in Zone D. Inspect affected plants and consider appropriate integrated pest-management action.',
    hi: 'जोन D में कीट देखे गए हैं। जैविक कीटनाशक या नीम के तेल का छिड़काव करें।',
    mr: 'झोन D मध्ये किडीचा प्रादुर्भाव झाला आहे. योग्य कीटकनाशकाची फवारणी करा.',
  },
  'consider nitrogen supplementation. consult local agronomist for appropriate application.': {
    en: 'Consider nitrogen supplementation. Consult local agronomist for appropriate application.',
    hi: 'फसल में नाइट्रोजन (यूरिया अथवा जैविक खाद) की खुराक दें।',
    mr: 'पिकास नायट्रोजनयुक्त खतांची मात्रा द्या किंवा तज्ज्ञांचा सल्ला घ्या.',
  },
  'monitor crop stress indicators. ensure adequate soil moisture.': {
    en: 'Monitor crop stress indicators. Ensure adequate soil moisture.',
    hi: 'फसल में गर्मी के तनाव की निगरानी करें और मिट्टी में पर्याप्त नमी बनाए रखें।',
    mr: 'पिकातील उष्णतेचा ताण तपासा आणि मातीत पुरेसा ओलावा राखा.',
  },
  'no significant disease indicators detected. continue regular monitoring.': {
    en: 'No significant disease indicators detected. Continue regular monitoring.',
    hi: 'कोई गंभीर बीमारी नहीं पाई गई। नियमित रोवर निगरानी जारी रखें।',
    mr: 'कोणताही मोठा रोग आढळला नाही. नियमित तपासणी सुरू ठेवा.',
  },
};

const reasonTranslations: Record<string, Record<Language, string>> = {
  'demo scenario: possible_water_stress': {
    en: 'Soil moisture deficit (< 35%)',
    hi: 'मिट्टी में पानी की कमी (नमी 35% से कम)',
    mr: 'मातीत ओलाव्याची कमतरता (ओलावा ३५% पेक्षा कमी)',
  },
  'demo scenario: possible_disease': {
    en: 'Foliage chlorosis & leaf lesion spots',
    hi: 'पत्तियों पर धब्बे और पीलापन देखा गया',
    mr: 'पानांवर डाग आणि पिवळेपणा आढळला',
  },
  'demo scenario: pest_detected': {
    en: 'Foliage damage from insect pests',
    hi: 'कीटों द्वारा पत्तियों का क्षरण',
    mr: 'किडीमुळे पानांचे नुकसान झाले आहे',
  },
};

export function translateDynamicContent(text: string, lang: Language): string {
  if (lang === 'en' || !text) return text;
  const key = text.trim().toLowerCase();

  if (issueTranslations[key]?.[lang]) {
    return issueTranslations[key][lang];
  }
  if (actionTranslations[key]?.[lang]) {
    return actionTranslations[key][lang];
  }
  if (reasonTranslations[key]?.[lang]) {
    return reasonTranslations[key][lang];
  }

  // Substring matching for partial text
  for (const [pattern, map] of Object.entries(actionTranslations)) {
    if (key.includes(pattern) || pattern.includes(key)) {
      return map[lang];
    }
  }
  for (const [pattern, map] of Object.entries(issueTranslations)) {
    if (key.includes(pattern) || pattern.includes(key)) {
      return map[lang];
    }
  }
  for (const [pattern, map] of Object.entries(reasonTranslations)) {
    if (key.includes(pattern) || pattern.includes(key)) {
      return map[lang];
    }
  }

  return text;
}
