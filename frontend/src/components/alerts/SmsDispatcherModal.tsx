import { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Send,
  CheckCircle2,
  Phone,
  MessageSquare,
  Signal,
  Battery,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Key,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import type { Alert, SMSDispatchResponse } from '../../types';

interface SmsDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAlert?: Alert | null;
}

interface FarmerPreset {
  name: string;
  phone: string;
  device: string;
  location: string;
}

const FARMER_PRESETS: FarmerPreset[] = [
  { name: 'My Phone (Live Demo)', phone: '+91 8329672851', device: 'Live Handset (WhatsApp/SMS)', location: 'My Device' },
  { name: 'Ramesh Patil', phone: '+91 98220 12345', device: 'JioPhone 4G Keypad', location: 'Zone B / Baramati' },
  { name: 'Suresh Borde', phone: '+91 94231 67890', device: 'Nokia 105 2G GSM', location: 'Zone C / Nashik' },
];

const SCENARIO_PRESETS = {
  blight: {
    titleKey: 'presetBlight',
    hi: '[किसान अलर्ट - AgriEdge] जोन C में टमाटर की फसल में अगेती झुलसा (Early Blight) का 87% खतरा पाया गया है। तुरंत कॉपर फंगीसाइड का छिड़काव करें।',
    mr: '[शेतकरी इशारा - AgriEdge] झोन C मध्ये टोमॅटो पिकावर करपा रोगाचा (Early Blight) ८७% धोका आढळला आहे. त्वरित कॉपर बुरशीनाशकाची फवारणी करा.',
    en: '[Kisan Alert - AgriEdge] Zone C: Early Blight fungal risk detected (87% confidence). Apply copper fungicide immediately.',
  },
  water: {
    titleKey: 'presetWater',
    hi: '[किसान अलर्ट - AgriEdge] जोन B में मिट्टी की नमी 28% पर गिर गई है। कल सुबह 06:00 बजे 45 मिनट के लिए ड्रिप सिंचाई की सलाह है।',
    mr: '[शेतकरी इशारा - AgriEdge] झोन B मध्ये मातीचा ओलावा २८% पर्यंत कमी झाला आहे. उद्या सकाळी ०६:०० वाजता ४५ मिनिटे ठिबक सिंचन सुरू करा.',
    en: '[Kisan Alert - AgriEdge] Zone B: Soil moisture dropped to 28%. Scheduled drip irrigation for 45 mins tomorrow 06:00 AM.',
  },
  rain: {
    titleKey: 'presetRain',
    hi: '[किसान अलर्ट - AgriEdge] अगले 48 घंटों में 35mm भारी वर्षा का अनुमान। सिंचाई स्थगित करें। 3,400 लीटर भूजल की बचत होगी।',
    mr: '[शेतकरी इशारा - AgriEdge] पुढील ४८ तासांत ३५ मिमी मुसळधार पावसाचा अंदाज. सिंचन थांबवा. ३,४०० लिटर पाण्याची बचत होईल.',
    en: '[Kisan Alert - AgriEdge] 35mm heavy rainfall predicted in 48h. Hold irrigation to conserve 3,400L groundwater.',
  },
};

export function SmsDispatcherModal({ isOpen, onClose, initialAlert }: SmsDispatcherModalProps) {
  const { language: currentLang, t, speakText } = useLanguage();

  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'mr'>(currentLang);
  const [channel, setChannel] = useState<'SMS' | 'WHATSAPP'>('WHATSAPP');
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerPreset>(FARMER_PRESETS[0]);
  const [phoneNumber, setPhoneNumber] = useState(FARMER_PRESETS[0].phone);
  const [recipientName, setRecipientName] = useState(FARMER_PRESETS[0].name);
  const [messageText, setMessageText] = useState(SCENARIO_PRESETS.blight[currentLang] || SCENARIO_PRESETS.blight.en);
  const [activeScenario, setActiveScenario] = useState<'blight' | 'water' | 'rain'>('blight');
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState<SMSDispatchResponse | null>(null);
  const [keypadFeedback, setKeypadFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showGatewayConfig, setShowGatewayConfig] = useState(false);
  const [fast2smsKey, setFast2smsKey] = useState(localStorage.getItem('agriedge_fast2sms_key') || '');
  const [callmebotKey, setCallmebotKey] = useState(localStorage.getItem('agriedge_callmebot_key') || '');
  const [handsetScreenState, setHandsetScreenState] = useState<'IDLE' | 'TRANSMITTING' | 'RECEIVED'>('IDLE');

  // Sync language with scenario
  useEffect(() => {
    setSelectedLanguage(currentLang);
    setMessageText(SCENARIO_PRESETS[activeScenario][currentLang] || SCENARIO_PRESETS[activeScenario].en);
  }, [currentLang]);

  // When initialAlert is passed, format an initial alert message
  useEffect(() => {
    if (initialAlert) {
      const loc = initialAlert.location || 'Farm';
      const msg = `[Kisan Alert - AgriEdge] ${loc}: ${initialAlert.message} (Severity: ${initialAlert.severity})`;
      setMessageText(msg);
    }
  }, [initialAlert]);

  if (!isOpen) return null;

  const handleSelectScenario = (key: 'blight' | 'water' | 'rain') => {
    setActiveScenario(key);
    setMessageText(SCENARIO_PRESETS[key][selectedLanguage] || SCENARIO_PRESETS[key].en);
    setReceipt(null);
    setHandsetScreenState('IDLE');
  };

  const handleLanguageChange = (lang: 'en' | 'hi' | 'mr') => {
    setSelectedLanguage(lang);
    setMessageText(SCENARIO_PRESETS[activeScenario][lang] || SCENARIO_PRESETS[activeScenario].en);
    setReceipt(null);
    setHandsetScreenState('IDLE');
  };

  const handleFarmerChange = (farmer: FarmerPreset) => {
    setSelectedFarmer(farmer);
    setPhoneNumber(farmer.phone);
    setRecipientName(farmer.name);
    setReceipt(null);
    setHandsetScreenState('IDLE');
  };

  const getCleanPhone = (phone: string) => {
    const rawDigits = phone.replace(/\D/g, '');
    return rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
  };

  const handleOpenWhatsAppLive = () => {
    const clean = getCleanPhone(phoneNumber);
    const url = `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const handleOpenSMSLive = () => {
    const clean = getCleanPhone(phoneNumber);
    const uri = `sms:+${clean}?body=${encodeURIComponent(messageText)}`;
    window.location.href = uri;
  };

  const handleCallLive = () => {
    const clean = getCleanPhone(phoneNumber);
    window.location.href = `tel:+${clean}`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Play retro keypad click sound
  const playKeypadBeep = (keyLabel: string) => {
    setKeypadFeedback(keyLabel);
    setTimeout(() => setKeypadFeedback(null), 180);
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {
      // AudioContext unavailable
    }
  };

  // Play authentic Nokia incoming SMS ringtone
  const playIncomingSmsChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const notes = [
          { freq: 880, start: now + 0.0, dur: 0.1 },
          { freq: 880, start: now + 0.15, dur: 0.1 },
          { freq: 880, start: now + 0.3, dur: 0.1 },
          { freq: 659, start: now + 0.5, dur: 0.25 },
        ];
        notes.forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.08, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + dur);
        });
      }
    } catch {
      // AudioContext unavailable
    }
  };

  const isUnicode = messageText.split('').some((c) => c.charCodeAt(0) > 127);
  const charLimitPerPart = isUnicode ? 70 : 160;
  const currentParts = Math.max(1, Math.ceil(messageText.length / charLimitPerPart));
  const estCost = (currentParts * 0.12).toFixed(2);

  const handleDispatch = async (autoOpenWhatsApp = true) => {
    try {
      setSending(true);
      setHandsetScreenState('TRANSMITTING');
      const res = await api.dispatchSMSAlert({
        phoneNumber,
        recipientName,
        channel,
        language: selectedLanguage,
        messageText,
        priority: 'HIGH',
        fast2smsApiKey: fast2smsKey || undefined,
        callmebotApiKey: callmebotKey || undefined,
      });
      setReceipt(res);
      setHandsetScreenState('RECEIVED');

      // Play authentic received chime & device vibration
      playIncomingSmsChime();
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([300, 100, 300, 100, 500]);
        } catch {
          // Vibration not allowed
        }
      }

      // If channel is WHATSAPP and user clicked primary action, open WhatsApp
      if (channel === 'WHATSAPP' && autoOpenWhatsApp) {
        const targetUrl = res.whatsappUrl || `https://api.whatsapp.com/send?phone=${getCleanPhone(phoneNumber)}&text=${encodeURIComponent(messageText)}`;
        window.open(targetUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to dispatch SMS:', err);
      setHandsetScreenState('IDLE');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative my-auto w-full max-w-4xl border border-earth-300 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-earth-300 bg-farm-900 px-4 py-3 sm:px-6 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center bg-farm-800 text-farm-300">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold tracking-tight">
                  {t('smsDispatcherTitle')}
                </h3>
                <span className="border border-farm-700 bg-farm-800/80 px-2 py-0.5 font-mono text-[10px] font-bold text-farm-300">
                  PS §6 COMPLIANCE
                </span>
                <span className="hidden sm:inline border border-emerald-500 bg-emerald-900/60 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                  AUTO-SEND & RECEIVE
                </span>
              </div>
              <p className="text-xs text-farm-200">
                {t('smsDispatcherSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="border border-farm-700 p-1.5 text-farm-300 hover:bg-farm-800 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Grid: Configurator on Left, Feature Phone Simulator on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-earth-300">
          {/* Left Column: Form & Presets (7 cols) */}
          <div className="p-4 sm:p-6 lg:col-span-7 space-y-4">
            {/* Delivery Channel Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-earth-700">
                  // TELECOM DELIVERY CHANNEL
                </label>
                <span className="font-mono text-[10px] text-emerald-700 font-semibold">
                  {channel === 'WHATSAPP' ? '● Opens Live WhatsApp' : '● Telecom Gateway / SMS'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setChannel('WHATSAPP');
                    setReceipt(null);
                    setHandsetScreenState('IDLE');
                  }}
                  className={`flex items-center justify-center gap-2 border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                    channel === 'WHATSAPP'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-earth-300 bg-white text-earth-600 hover:bg-earth-50'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                  <span>WhatsApp (Instant Real Msg)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChannel('SMS');
                    setReceipt(null);
                    setHandsetScreenState('IDLE');
                  }}
                  className={`flex items-center justify-center gap-2 border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                    channel === 'SMS'
                      ? 'border-farm-800 bg-farm-50 text-farm-900 shadow-xs ring-2 ring-farm-500/20'
                      : 'border-earth-300 bg-white text-earth-600 hover:bg-earth-50'
                  }`}
                >
                  <Phone className="h-3.5 w-3.5 text-farm-700" />
                  <span>2G GSM SMS (Telecom)</span>
                </button>
              </div>
            </div>

            {/* Farmer Preset Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-earth-700">
                  // RECIPIENT PHONE PRESETS
                </label>
                <span className="font-mono text-[10px] text-earth-500">
                  {selectedFarmer.device}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {FARMER_PRESETS.map((farmer) => (
                  <button
                    key={farmer.phone}
                    type="button"
                    onClick={() => handleFarmerChange(farmer)}
                    className={`border p-2 text-left transition-all cursor-pointer ${
                      selectedFarmer.phone === farmer.phone
                        ? 'border-farm-800 bg-farm-50/70 text-farm-950 font-bold ring-1 ring-farm-700'
                        : 'border-earth-200 bg-white text-earth-600 hover:bg-earth-50'
                    }`}
                  >
                    <p className="text-xs truncate">{farmer.name}</p>
                    <p className="font-mono text-[10px] text-earth-500 truncate">{farmer.phone}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone & Recipient Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[11px] font-semibold text-earth-700 mb-1">
                  {t('recipientFarmer')}
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full border border-earth-300 bg-earth-50 px-2.5 py-1.5 font-mono text-xs text-earth-900 focus:border-farm-600 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] font-semibold text-earth-700 mb-1">
                  {t('phoneNumberLabel')} (Any 10-digit number)
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 8329672851"
                  className="w-full border border-earth-300 bg-earth-50 px-2.5 py-1.5 font-mono text-xs text-earth-900 focus:border-farm-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Scenario Preset Buttons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-earth-700">
                  // {t('selectAlertPreset')}
                </label>
                {/* Language Switcher for Payload */}
                <div className="flex items-center border border-earth-300 bg-earth-100 p-0.5">
                  {(['en', 'hi', 'mr'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageChange(lang)}
                      className={`px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                        selectedLanguage === lang
                          ? 'bg-white text-earth-950 shadow-xs'
                          : 'text-earth-600 hover:text-earth-900'
                      }`}
                    >
                      {lang === 'hi' ? 'हिंदी' : lang === 'mr' ? 'मराठी' : 'EN'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                {(['blight', 'water', 'rain'] as const).map((key) => {
                  const item = SCENARIO_PRESETS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectScenario(key)}
                      className={`w-full text-left border px-3 py-2 text-xs flex items-center justify-between transition-all cursor-pointer ${
                        activeScenario === key
                          ? 'border-farm-700 bg-farm-50/60 font-semibold text-farm-950'
                          : 'border-earth-200 bg-white text-earth-700 hover:bg-earth-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            key === 'blight' ? 'bg-red-600' : key === 'water' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                        />
                        <span>{t(item.titleKey as keyof typeof t)}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-earth-400" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-mono text-[11px] font-semibold text-earth-700">
                  {t('messageContentLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-farm-800 hover:text-farm-950 cursor-pointer"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                  <span className="text-earth-300">•</span>
                  <div className="font-mono text-[10px] text-earth-500 space-x-1.5">
                    <span>{messageText.length} chars</span>
                    <span>•</span>
                    <span>{currentParts} part(s)</span>
                    <span>•</span>
                    <span>Est. ₹{estCost}</span>
                  </div>
                </div>
              </div>
              <textarea
                rows={3}
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  setReceipt(null);
                  setHandsetScreenState('IDLE');
                }}
                className="w-full border border-earth-300 bg-white p-2.5 font-mono text-xs text-earth-900 focus:border-farm-700 focus:outline-none"
              />
              <p className="mt-1 font-mono text-[10px] text-earth-500">
                {isUnicode
                  ? 'Devanagari Unicode SMS standard: 70 characters/part (TRAI / mKisan telecom rule).'
                  : 'Standard GSM SMS: 160 characters/part.'}
              </p>
            </div>

            {/* LIVE ACTION BUTTONS STRIP */}
            <div className="space-y-2 pt-1">
              {/* Primary Dispatch Button */}
              {channel === 'WHATSAPP' ? (
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => handleDispatch(true)}
                  className="w-full flex items-center justify-center gap-2 border border-emerald-800 bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Transmit & Auto-Deliver WhatsApp Alert to {phoneNumber}</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => handleDispatch(false)}
                  className="w-full flex items-center justify-center gap-2 border border-farm-800 bg-farm-800 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-farm-900 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {sending ? (
                    <>
                      <Radio className="h-4 w-4 animate-spin text-farm-300" />
                      <span>{t('sendingAlertBtn')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 text-farm-300" />
                      <span>Transmit & Deliver Alert to Handset</span>
                    </>
                  )}
                </button>
              )}

              {/* Instant Real Handset Actions (Opens real app immediately) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleOpenWhatsAppLive}
                  className="flex items-center justify-center gap-1.5 border border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-950 hover:bg-emerald-100 transition-all cursor-pointer"
                  title="Open live chat on WhatsApp Web or WhatsApp App"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Open in WhatsApp Live</span>
                  <ExternalLink className="h-3 w-3 text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={handleOpenSMSLive}
                  className="flex items-center justify-center gap-1.5 border border-farm-700 bg-farm-50 px-3 py-2 text-xs font-bold text-farm-950 hover:bg-farm-100 transition-all cursor-pointer"
                  title="Open Phone's default SMS app to send real SMS via SIM"
                >
                  <Phone className="h-3.5 w-3.5 text-farm-700" />
                  <span>Open in Phone SMS App</span>
                  <ExternalLink className="h-3 w-3 text-farm-600" />
                </button>
              </div>
            </div>

            {/* Optional Cloud Gateway Keys (CallMeBot & Fast2SMS) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowGatewayConfig(!showGatewayConfig)}
                className="flex items-center gap-1 font-mono text-[10px] text-earth-600 hover:text-earth-900 cursor-pointer"
              >
                <Key className="h-3 w-3 text-farm-700" />
                <span>{showGatewayConfig ? '▼ Hide Real Cloud Gateway Keys' : '▶ Configure Real Cloud Bots (CallMeBot WhatsApp / Fast2SMS Cellular)'}</span>
              </button>

              {showGatewayConfig && (
                <div className="mt-2 border border-earth-300 bg-earth-50 p-3 text-xs space-y-3 animate-fade-in">
                  {/* CallMeBot Section */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                        CallMeBot WhatsApp (Receives real incoming msg from cloud bot)
                      </span>
                      <a
                        href="https://api.whatsapp.com/send?phone=34941875007&text=I%20allow%20callmebot%20to%20send%20me%20messages"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-800 underline font-semibold flex items-center gap-0.5"
                      >
                        <span>1-Click: Get Free Key on WhatsApp</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                    <input
                      type="password"
                      value={callmebotKey}
                      onChange={(e) => {
                        setCallmebotKey(e.target.value);
                        localStorage.setItem('agriedge_callmebot_key', e.target.value);
                      }}
                      placeholder="Paste CallMeBot API Key (e.g. 123456)"
                      className="w-full border border-earth-300 bg-white px-2.5 py-1 font-mono text-xs text-earth-900"
                    />
                  </div>

                  {/* Fast2SMS Section */}
                  <div className="space-y-1 pt-1 border-t border-earth-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-farm-950 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-farm-700" />
                        Fast2SMS (Real Indian Cellular GSM SMS via SIM towers)
                      </span>
                      <a
                        href="https://www.fast2sms.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-farm-800 underline font-semibold flex items-center gap-0.5"
                      >
                        <span>Fast2SMS Dashboard</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                    <input
                      type="password"
                      value={fast2smsKey}
                      onChange={(e) => {
                        setFast2smsKey(e.target.value);
                        localStorage.setItem('agriedge_fast2sms_key', e.target.value);
                      }}
                      placeholder="Paste Fast2SMS API Key"
                      className="w-full border border-earth-300 bg-white px-2.5 py-1 font-mono text-xs text-earth-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Telecom Delivery Receipt Card */}
            {receipt && (
              <div className="animate-fade-in border border-emerald-300 bg-emerald-50/80 p-3 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {t('alertSentSuccess')}
                  </span>
                  <span className="font-mono text-[11px] bg-emerald-100 px-2 py-0.5 text-emerald-800 border border-emerald-200">
                    {receipt.referenceId}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-emerald-800">
                  <div>
                    <span className="font-semibold">Operator:</span> {receipt.operator}
                  </div>
                  <div>
                    <span className="font-semibold">Recipient:</span> {receipt.phoneNumber}
                  </div>
                  <div>
                    <span className="font-semibold">Segments:</span> {receipt.smsParts} part ({receipt.charCount} chars)
                  </div>
                  <div>
                    <span className="font-semibold">Carrier Route:</span> mKisan / TRAI 51969
                  </div>
                </div>

                {/* Quick 1-click live triggers from receipt */}
                <div className="flex items-center gap-2 pt-1 border-t border-emerald-200">
                  <button
                    type="button"
                    onClick={handleOpenWhatsAppLive}
                    className="inline-flex items-center gap-1 border border-emerald-600 bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Send on WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenSMSLive}
                    className="inline-flex items-center gap-1 border border-emerald-700 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-900 hover:bg-emerald-50 cursor-pointer"
                  >
                    <Phone className="h-3 w-3" />
                    <span>Send via Phone SIM</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Retro 2G Keypad Feature Phone Mockup (5 cols) */}
          <div className="p-4 sm:p-6 lg:col-span-5 bg-earth-100 flex flex-col items-center justify-center">
            <div className="w-full text-center mb-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-earth-600">
                // {t('featurePhonePreview')}
              </span>
              <p className="text-[10px] text-earth-500">
                Target: {selectedFarmer.device} • {phoneNumber}
              </p>
            </div>

            {/* Live Receiving Notification Pill */}
            {handsetScreenState === 'RECEIVED' && (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500 bg-emerald-100 px-3 py-1 font-mono text-[11px] font-bold text-emerald-900 animate-bounce">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>INCOMING ALERT RECEIVED!</span>
              </div>
            )}

            {/* Handset Chassis */}
            <div className={`w-68 sm:w-72 rounded-3xl bg-slate-900 p-4 shadow-2xl border-4 transition-all relative ${
              handsetScreenState === 'RECEIVED' ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-slate-800'
            }`}>
              {/* Earpiece Speaker Slit */}
              <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-700" />

              {/* Handset LCD Screen */}
              <div className={`rounded-xl border-2 p-2 text-stone-100 shadow-inner transition-colors ${
                handsetScreenState === 'RECEIVED' ? 'border-emerald-500 bg-stone-950' : 'border-slate-700 bg-stone-900'
              }`}>
                {/* Status Bar */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-1 font-mono text-[9px] text-stone-400">
                  <div className="flex items-center gap-1">
                    <Signal className="h-3 w-3 text-emerald-400" />
                    <span className="font-bold text-stone-300">
                      {channel === 'SMS' ? 'BSNL 2G' : 'Jio 4G'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {handsetScreenState === 'RECEIVED' && (
                      <span className="text-[8px] bg-emerald-500 text-black px-1 font-bold rounded animate-pulse">
                        NEW SMS
                      </span>
                    )}
                    <Clock className="h-2.5 w-2.5 text-stone-400" />
                    <span>14:35</span>
                    <Battery className="h-3 w-3 text-emerald-400" />
                  </div>
                </div>

                {/* Message Header */}
                <div className="mt-1.5 flex items-center justify-between border-b border-stone-800 pb-1 text-[10px]">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <span>{channel === 'SMS' ? '✉️ 51969 (mKisan)' : '💬 WhatsApp Agri'}</span>
                  </span>
                  <span className="font-mono text-[9px] text-emerald-400 font-bold">
                    {handsetScreenState === 'RECEIVED' ? '● RECEIVED' : '1/1'}
                  </span>
                </div>

                {/* SMS Text Body Container */}
                <div className="my-2 min-h-24 max-h-32 overflow-y-auto rounded bg-stone-950 p-2 font-sans text-xs leading-relaxed text-stone-100 border border-stone-800">
                  <p className="font-medium text-emerald-300 text-[11px] leading-snug">
                    {messageText}
                  </p>
                </div>

                {/* Softkey Menu at Screen Bottom */}
                <div className="flex items-center justify-between border-t border-stone-800 pt-1 font-mono text-[9px] text-stone-400">
                  <button
                    type="button"
                    onClick={() => speakText(messageText)}
                    className="font-bold text-emerald-400 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Volume2 className="h-2.5 w-2.5" />
                    <span>[ Speak ]</span>
                  </button>

                  <span className="text-[8px] text-stone-500">AgriEdge v2.1</span>
                  <button
                    type="button"
                    onClick={handleOpenSMSLive}
                    className="font-bold text-stone-300 hover:underline cursor-pointer"
                  >
                    [ Reply ]
                  </button>
                </div>
              </div>

              {/* Handset Brand Logo */}
              <div className="my-2 text-center">
                <span className="font-mono text-[10px] font-bold tracking-widest text-slate-500">
                  AGRI-EDGE // 2G
                </span>
              </div>

              {/* Functional Keypad */}
              <div className="space-y-1.5">
                {/* Top Control Bar: Left Soft Key, D-Pad, Right Soft Key */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playKeypadBeep('WA');
                      handleOpenWhatsAppLive();
                    }}
                    className="h-7 rounded-md bg-slate-800 border border-slate-700 text-[9px] font-bold text-emerald-400 hover:bg-slate-700 active:bg-slate-600 transition-colors cursor-pointer"
                    title="Send via WhatsApp"
                  >
                    WA 💬
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playKeypadBeep('OK');
                      handleDispatch(channel === 'WHATSAPP');
                    }}
                    className="h-7 rounded-md bg-slate-700 border border-slate-600 text-[9px] font-bold text-emerald-400 hover:bg-slate-600 active:bg-slate-500 transition-colors shadow-xs cursor-pointer"
                    title="Transmit Alert"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playKeypadBeep('SMS');
                      handleOpenSMSLive();
                    }}
                    className="h-7 rounded-md bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-300 hover:bg-slate-700 active:bg-slate-600 transition-colors cursor-pointer"
                    title="Send via Phone SMS"
                  >
                    SMS 📱
                  </button>
                </div>

                {/* Call / End buttons */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playKeypadBeep('CALL');
                      handleCallLive();
                    }}
                    className="h-6 rounded-md bg-emerald-950 border border-emerald-700 text-[9px] font-bold text-emerald-300 hover:bg-emerald-900 transition-colors cursor-pointer"
                    title="Call this phone number"
                  >
                    📞 CALL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playKeypadBeep('END');
                      onClose();
                    }}
                    className="h-6 rounded-md bg-red-950 border border-red-700 text-[9px] font-bold text-red-300 hover:bg-red-900 transition-colors cursor-pointer"
                    title="Close"
                  >
                    END ✕
                  </button>
                </div>

                {/* 12 Classic Numeric Keypad Buttons */}
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {[
                    { key: '1', sub: '. -' },
                    { key: '2', sub: 'ABC' },
                    { key: '3', sub: 'DEF' },
                    { key: '4', sub: 'GHI' },
                    { key: '5', sub: 'JKL' },
                    { key: '6', sub: 'MNO' },
                    { key: '7', sub: 'PQRS' },
                    { key: '8', sub: 'TUV' },
                    { key: '9', sub: 'WXYZ' },
                    { key: '*', sub: '⇄' },
                    { key: '0', sub: '␣' },
                    { key: '#', sub: '🔔' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => playKeypadBeep(item.key)}
                      className={`flex flex-col items-center justify-center h-8 rounded-md bg-slate-800/90 border border-slate-700/80 text-slate-200 hover:bg-slate-700 active:scale-95 transition-all cursor-pointer ${
                        keypadFeedback === item.key ? 'ring-2 ring-emerald-400 bg-slate-600' : ''
                      }`}
                    >
                      <span className="text-[11px] font-bold leading-none">{item.key}</span>
                      <span className="text-[7px] text-slate-400 leading-none mt-0.5">{item.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Microphone Pinhole */}
              <div className="mx-auto mt-3 h-1 w-1 rounded-full bg-slate-700" />
            </div>

            {/* Bottom Caption */}
            <p className="mt-3 text-center font-mono text-[10px] text-earth-500 max-w-xs">
              Direct offline telemetry bridging the digital divide for India's 350M+ 2G keypad phone farmers.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-earth-300 bg-earth-50 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2 text-xs text-earth-600">
            <ShieldCheck className="h-4 w-4 text-farm-700" />
            <span className="font-mono text-[11px]">
              Govt. of India mKisan (51969) / TRAI Priority Agronomic SMS Gateway
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-earth-300 bg-white px-3 py-1.5 text-xs font-semibold text-earth-800 hover:bg-earth-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
