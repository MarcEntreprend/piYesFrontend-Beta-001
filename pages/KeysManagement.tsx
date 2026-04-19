// pages/KeysManagement.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
/* Use react-router core for hooks */
import { useNavigate, useLocation } from 'react-router';
import { 
  ArrowLeft, Plus, Key as KeyIcon, Trash2, ArrowUpRight, 
  QrCode, X, Calendar, Clipboard, ArrowDownCircle, 
  Mic, Send, HelpCircle, ChevronRight,
  Smartphone, Clock, CalendarClock, ListTodo, ChevronRight as ChevronRightIcon,
  RotateCcw, Info, Globe2, Sparkles, Loader2, AlertTriangle, Check, RefreshCw, Link as LinkIcon,
  Scan, Shield, Camera as CameraIcon
} from 'lucide-react';
import QrScanner from '../components/QrScanner';
import { api } from '../services/apiService';
import { aiService, ParsedTransaction } from '../services/aiService';
import { Key } from '../shared/types';
import { useTranslation } from '../App';
import Modal from '../components/Modal';
import AiSupportChat from '../components/AiSupportChat';
import PageHeader from '../components/PageHeader';

const KeysManagement: React.FC = () => {
  const { t } = useTranslation();
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  // Intelligent Message States (Text Flow)
  const [message, setMessage] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStep, setAiStep] = useState<'idle' | 'reformulate' | 'confirm'>('idle');
  const [parsedData, setParsedData] = useState<ParsedTransaction | null>(null);
  const [editedRephrased, setEditedRephrased] = useState('');

  // Voice Flow States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceStep, setVoiceStep] = useState<'idle' | 'processing' | 'reformulate' | 'confirm'>('idle');
  const [voiceParsedData, setVoiceParsedData] = useState<ParsedTransaction | null>(null);
  const [voiceEditedRephrased, setVoiceEditedRephrased] = useState('');
  const timerRef = useRef<number | null>(null);

  // Paste Link States
  const [pastedLink, setPastedLink] = useState('');
  const [isAnalyzingLink, setIsAnalyzingLink] = useState(false);

  const [newKeyType, setNewKeyType] = useState('email');
  
  // Isolated states for each tab
  const [emailValue, setEmailValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [tagValue, setTagValue] = useState('');
  const [randomValue, setRandomValue] = useState('');
  
  const [isCheckingTag, setIsCheckingTag] = useState(false);
  const [isTagAvailable, setIsTagAvailable] = useState<boolean | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

  const [verifyingKey, setVerifyingKey] = useState<Key | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchKeys();
    
    if (searchParams.get('modal') === 'pix') {
      setShowPasteModal(true);
      const link = searchParams.get('link');
      if (link) setPastedLink(link);
    }

    const scrollTo = searchParams.get('scroll');
    if (scrollTo) {
      setTimeout(() => {
        const el = document.getElementById(scrollTo);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-4', 'ring-[var(--primary-color)]', 'ring-opacity-20', 'rounded-xl');
            setTimeout(() => el.classList.remove('ring-4'), 3000);
        }
      }, 500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [searchParams]);

  // Handle Textarea Auto-growth
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const fetchKeys = async () => {
    setLoading(true);
    const data = await api.getKeys();
    setKeys(data);
    setLoading(false);
  };

  // --- TEXT FLOW ACTIONS ---
  const handleAiInterpret = async () => {
    if (!message.trim() || isAiProcessing) return;
    setIsAiProcessing(true);
    const result = await aiService.parseMessage(message);
    setParsedData(result);
    if (result.type === 'error') {
        alert(result.rephrased);
        setIsAiProcessing(false);
    } else {
        setEditedRephrased(result.rephrased);
        setAiStep('reformulate');
        setIsAiProcessing(false);
    }
  };

  const handleFinalConfirm = async () => {
    if (!parsedData) return;
    setIsAiProcessing(true);
    const finalCheck = await aiService.parseMessage(editedRephrased);
    setParsedData(finalCheck);
    setAiStep('confirm');
    setIsAiProcessing(false);
  };

  const executeAction = () => {
    const data = parsedData;
    if (!data) return;
    const route = data.type === 'transfer' ? '/transfer' : '/request-payment';
    const params = new URLSearchParams();
    if (data.amount) params.append('amount', data.amount.toString());
    if (data.contact) params.append('name', data.contact);
    
    setMessage('');
    setAiStep('idle');
    navigate(`${route}?${params.toString()}`);
  };

  // --- VOICE FLOW ACTIONS ---
  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopVoiceRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setVoiceStep('processing');
    
    const mockTranscriptions = [
      "Voye 500 goud bay Ronald",
      "Mande Sarah 1250 gourdes",
      "Paie 2000 à l'école de musique",
      "Virement de 300 pour Marc"
    ];
    const transcription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    
    const result = await aiService.parseMessage(transcription);
    setVoiceParsedData(result);
    
    if (result.type === 'error') {
        alert(result.rephrased);
        setVoiceStep('idle');
    } else {
        setVoiceEditedRephrased(result.rephrased);
        setVoiceStep('reformulate');
    }
  };

  const handleVoiceFinalConfirm = async () => {
    if (!voiceParsedData) return;
    setVoiceStep('processing');
    const finalCheck = await aiService.parseMessage(voiceEditedRephrased);
    setVoiceParsedData(finalCheck);
    setVoiceStep('confirm');
  };

  const executeVoiceAction = () => {
    const data = voiceParsedData;
    if (!data) return;
    const route = data.type === 'transfer' ? '/transfer' : '/request-payment';
    const params = new URLSearchParams();
    if (data.amount) params.append('amount', data.amount.toString());
    if (data.contact) params.append('name', data.contact);
    
    setShowVoiceModal(false);
    navigate(`${route}?${params.toString()}`);
  };

  // --- LINK ANALYZER ACTIONS ---
  const handleAnalyzeLink = async () => {
    if (!pastedLink) return;
    setIsAnalyzingLink(true);
    
    try {
        const url = new URL(pastedLink);
        if (url.hostname.includes('piyes.ht')) {

            // ── Lien de confirmation de rappel (/schedule?token=...)
            const scheduleToken = url.searchParams.get('token');
            if (url.pathname.includes('/schedule') && scheduleToken) {
              setIsAnalyzingLink(false);
              setShowPasteModal(false);
              setPastedLink('');
              try {
                await api.getScheduleByToken(scheduleToken);
                // Naviguer vers scheduler avec le token pour déclencher le modal
                navigate(`/scheduler?tab=outgoing&confirm=${scheduleToken}`);
              } catch (e) {
                alert('Rappel introuvable ou lien expiré.');
              }
              return;
            }

            const amount = url.searchParams.get('amount');
            const to = url.searchParams.get('to');
            const type = url.searchParams.get('type');
            
            if (to) {
                let recipientKey = to;
                if (type === 'tag') recipientKey = '@' + to;
                else if (type === 'email') recipientKey = decodeURIComponent(to);
                
                const query = new URLSearchParams();
                if (amount) query.append('amount', amount);
                query.append('recipient', recipientKey);
                query.append('locked', 'true');
                query.append('source', 'link');
                query.append('from', 'keys');
                query.append('link', pastedLink);
                
                setShowPasteModal(false);
                setPastedLink('');
                navigate(`/transfer?${query.toString()}`);
            } else {
                alert(t('pix.paste_modal.error_invalid'));
            }
        } else {
            alert(t('pix.paste_modal.error_invalid'));
        }
    } catch (e) {
        alert(t('pix.paste_modal.error_invalid'));
    } finally {
        setIsAnalyzingLink(false);
    }
  };

  const handleScanQR = () => {
    setShowQRScanner(true);
  };

  const handleScanResult = (decodedText: string) => {
    setShowQRScanner(false);
    
    // Process the decoded text
    try {
            const url = new URL(decodedText);
            if (url.hostname.includes('piyes.ht')) {
              // ── QR de confirmation de rappel
              const scheduleToken = url.searchParams.get('token');
              if (url.pathname.includes('/schedule') && scheduleToken) {
                setShowQRScanner(false);
                navigate(`/scheduler?tab=outgoing&confirm=${scheduleToken}`);
                return;
              }
              const to = url.searchParams.get('to');
        const type = url.searchParams.get('type');
        const amount = url.searchParams.get('amount');
        const expiry = url.searchParams.get('expiry');
        
        if (to) {
          let recipientKey = to;
          if (type === 'tag') recipientKey = '@' + to;
          else if (type === 'email') recipientKey = decodeURIComponent(to);
          
          const query = new URLSearchParams();
          query.append('recipient', recipientKey);
          if (amount) query.append('amount', amount);
          if (expiry) query.append('expiry', expiry);
          query.append('locked', amount ? 'true' : 'false');
          query.append('source', 'qr');
          query.append('from', 'keys');
          
          navigate(`/transfer?${query.toString()}`);
        } else {
          alert(t('pix.actions.qr_invalid_dest'));
        }
      } else {
        // Fallback for other URLs or plain text
        navigate(`/transfer?recipient=${encodeURIComponent(decodedText)}`);
      }
    } catch (e) {
      // If not a URL, treat as a key
      navigate(`/transfer?recipient=${encodeURIComponent(decodedText)}`);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDeleteClick = (id: string) => {
    setKeyToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!keyToDelete) return;
    setLoading(true);
    try {
      await api.deleteKey(keyToDelete);
      setKeys(keys.filter(k => k.id !== keyToDelete));
      setShowDeleteConfirm(false);
      setKeyToDelete(null);
    } catch (e) {
      alert(t('common.error'));
    }
    setLoading(false);
  };

  // Tag validation and uniqueness check
  useEffect(() => {
    const checkTag = async () => {
      if (tagValue.length >= 4) {
        setIsCheckingTag(true);
        setTagError(null);
        try {
          const available = await api.checkTagAvailability(tagValue);
          setIsTagAvailable(available);
          if (!available) setTagError("Ce tag est déjà pris");
        } catch (e) {
          console.error(e);
        } finally {
          setIsCheckingTag(false);
        }
      } else {
        setIsTagAvailable(null);
        setTagError(null);
      }
    };

    if (newKeyType === 'tag') {
      const timer = setTimeout(checkTag, 500);
      return () => clearTimeout(timer);
    }
  }, [tagValue, newKeyType]);

  // Random key generation
  const generateRandomKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 25; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRandomValue(result);
  };

  useEffect(() => {
    if (newKeyType === 'random' && !randomValue) {
      generateRandomKey();
    }
  }, [newKeyType]);

  const handleCreateKey = async () => {
    let value = '';
    if (newKeyType === 'email') value = emailValue;
    else if (newKeyType === 'phone') value = `+509${phoneValue}`;
    else if (newKeyType === 'tag') value = tagValue.startsWith('@') ? tagValue : `@${tagValue}`;
    else if (newKeyType === 'random') value = randomValue;

    if (!value) return;
    
    setLoading(true);
    try {
      const k = await api.createKey(newKeyType, value);
      if (k.isVerified) {
        setKeys([...keys, k]);
        setShowNewModal(false);
        resetNewKeyStates();
      } else {
        // Trigger verification flow for email/phone
        setVerifyingKey(k);
        setShowNewModal(false);
      }
    } catch (e) {
      alert(t('common.error'));
    }
    setLoading(false);
  };

  const resetNewKeyStates = () => {
    setEmailValue('');
    setPhoneValue('');
    setTagValue('');
    setRandomValue('');
    setIsTagAvailable(null);
    setTagError(null);
  };

  const handleVerifyKey = async () => {
    if (!verifyingKey || !otpCode) return;
    setIsVerifying(true);
    try {
      const success = await api.verifySecondaryKey(verifyingKey.id, otpCode);
      if (success) {
        setKeys(keys.map(k => k.id === verifyingKey.id ? { ...k, isVerified: true } : k));
        setVerifyingKey(null);
        setOtpCode('');
        alert(t('pix.verify_modal.success'));
      } else {
        alert(t('otp.error_invalid'));
      }
    } catch (e) {
      alert(t('common.error'));
    }
    setIsVerifying(false);
  };

  const handleBackNavigation = () => {
    if (message.trim().length > 0 && aiStep === 'idle') {
        setPendingRoute('-1');
        setShowLeaveWarning(true);
    } else {
        navigate(-1);
    }
  };

  const GridAction = ({ icon, label, onClick, color = "theme-primary-text", id }: any) => (
    <button 
      id={id}
      onClick={onClick}
      className="flex flex-col items-center gap-2 group active:scale-95 transition-all py-2"
    >
      <div className="w-16 h-16 theme-bubble-bg rounded-2xl flex items-center justify-center theme-text-main shadow-sm border theme-border">
        <div className={color}>{icon}</div>
      </div>
      <span className="text-[11px] font-bold theme-text-main text-center leading-tight h-8 flex items-center">
        {label}
      </span>
    </button>
  );

  return (
  <div className="theme-card-bg min-h-screen pb-32">
    <PageHeader 
      title={t('pix.title')}
      onBack={handleBackNavigation}
      rightElement={
        <div className="w-10 h-10 rounded-full theme-bubble-bg flex items-center justify-center 
          theme-text-secondary active:scale-90 transition-transform opacity-80 
          hover:opacity-100"> 
          <HelpCircle size={22} onClick={() => setShowSupport(true)} />
        </div>
      }
      className="sticky top-0 theme-card-bg z-30 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
    />

    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <p className="text-sm theme-text-secondary leading-relaxed">
          {t('pix.tagline')}
        </p>
      </div>

        {/* Intelligent Interpretation Area (Text Flow Display) */}
        <div className="space-y-4">
            {aiStep === 'idle' && (
                <div className={`relative group transition-all ${isAiProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="w-full theme-bubble-bg border-2 border-transparent focus-within:border-[var(--primary-color)] theme-text-main rounded-3xl py-4 px-5 flex items-end gap-3 shadow-sm">
                        <textarea 
                            ref={textareaRef}
                            rows={1}
                            maxLength={120}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={t('pix.ai_placeholder')}
                            className="flex-1 bg-transparent outline-none resize-none font-bold text-sm no-scrollbar min-h-[24px]"
                        />
                        <button 
                            onClick={handleAiInterpret}
                            disabled={!message.trim()}
                            className={`p-3 rounded-full transition-all shrink-0 ${message.trim() ? 'theme-primary-bg text-white shadow-lg active:scale-90' : 'theme-text-secondary opacity-20'}`}
                        >
                            {isAiProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                    {message.length > 0 && (
                        <p className="text-[9px] font-bold theme-text-secondary uppercase text-right px-2 mt-1 opacity-50">
                            {message.length}/120
                        </p>
                    )}
                </div>
            )}

            {aiStep === 'reformulate' && (
                <div className="p-6 theme-bubble-bg border-2 border-[var(--primary-color)] rounded-[32px] space-y-4 animate-in zoom-in duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="theme-primary-text" />
                        <span className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">{t('pix.ai_step_reformulate.title')}</span>
                    </div>
                    <p className="text-xs theme-text-secondary font-medium italic">"{t('pix.ai_step_reformulate.hint')}"</p>
                    <textarea 
                        autoFocus
                        value={editedRephrased}
                        onChange={(e) => setEditedRephrased(e.target.value)}
                        className="w-full bg-white dark:bg-black/20 p-4 rounded-2xl border theme-border theme-text-main font-bold text-sm outline-none focus:border-[var(--primary-color)] transition-all resize-none"
                        rows={2}
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setAiStep('idle')}
                            className="flex-1 py-3 theme-card-bg theme-text-secondary rounded-xl font-bold text-xs border theme-border active:scale-95 transition-all"
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            onClick={handleFinalConfirm}
                            className="flex-[2] py-3 theme-primary-bg text-white rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all"
                        >
                            {t('common.confirm')}
                        </button>
                    </div>
                </div>
            )}

            {aiStep === 'confirm' && parsedData && (
                <div className="p-8 theme-card-bg border-2 border-green-500 rounded-[40px] space-y-6 animate-in slide-in-from-bottom duration-300 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-green-500"></div>
                    <div className="text-center space-y-1">
                        <h4 className="text-xl font-black theme-text-main tracking-tight">{t('pix.ai_step_confirm.title')}</h4>
                        <p className="text-xs theme-text-secondary">{t('pix.ai_step_confirm.sub')}</p>
                    </div>

                    <div className="space-y-4 py-4 border-y theme-border">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black theme-text-secondary uppercase">{t('pix.ai_step_confirm.label_op')}</span>
                            <span className={`text-xs font-black uppercase tracking-widest ${parsedData.type === 'transfer' ? 'theme-primary-text' : 'text-blue-500'}`}>
                                {parsedData.type === 'transfer' ? t('actions.transfer') : t('actions.receive')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black theme-text-secondary uppercase">{t('pix.ai_step_confirm.label_amount')}</span>
                            <span className="text-xl font-black theme-text-main">{parsedData.amount?.toLocaleString('fr-HT')} G.</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black theme-text-secondary uppercase">{t('pix.ai_step_confirm.label_contact')}</span>
                            <span className="text-sm font-bold theme-text-main">{parsedData.contact || '---'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={executeAction}
                            className="w-full py-4 theme-primary-bg text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {t('pix.ai_step_confirm.btn_continue', { target: parsedData.type === 'transfer' ? t('pix.ai_step_confirm.target_transfer') : t('pix.ai_step_confirm.target_request') })} <ChevronRightIcon size={18} />
                        </button>
                        <button 
                            onClick={() => setAiStep('reformulate')}
                            className="w-full py-3 theme-text-secondary font-bold text-xs"
                        >
                            {t('pix.ai_step_confirm.btn_edit')}
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-3 gap-y-4 gap-x-2">
          <GridAction id="pix-transfer" icon={<ArrowUpRight size={24} />} label={t('pix.actions.transfer')} onClick={() => navigate('/transfer')} />
          <GridAction id="pix-intl" icon={<Globe2 size={24} />} label={t('actions.international')} onClick={() => navigate('/international-transfer')} />
          <GridAction id="pix-qr" icon={<Scan size={24} />} label={t('pix.actions.read_qr')} onClick={handleScanQR} />
          
          <GridAction id="pix-copy" icon={<LinkIcon size={24} />} label={t('pix.actions.paste_link')} onClick={() => setShowPasteModal(true)} />
          <GridAction id="pix-receive" icon={<QrCode size={24} />} label={t('pix.actions.receive')} onClick={() => navigate('/request-payment')} />
          <GridAction id="pix-deposit" icon={<Plus size={24} />} label={t('pix.actions.deposit')} onClick={() => navigate('/deposit')} />
          
          <GridAction id="pix-voice" icon={<Mic size={24} />} label={t('pix.actions.voice')} onClick={() => { setVoiceStep('idle'); setShowVoiceModal(true); }} color="theme-primary-text" />
          <GridAction id="pix-sched" icon={<Calendar size={24} />} label={t('pix.actions.schedule')} onClick={() => navigate('/scheduler')} />
          <GridAction id="pix-proximity" icon={<Smartphone size={24} />} label={t('pix.actions.proximity')} onClick={() => alert(t('pix.actions.proximity_searching'))} />
        </div>

        <section id="keys-list" className="space-y-4 transition-all duration-700 p-2">
            <div className="flex justify-between items-center border-b theme-border pb-2">
              <h2 className="text-sm font-bold theme-text-secondary uppercase tracking-widest">{t('pix.keys_section')}</h2>
              <button onClick={() => setShowNewModal(true)} className="theme-primary-text font-bold text-xs flex items-center gap-1">
                <Plus size={14} /> {t('pix.add_key')}
              </button>
            </div>
            <div className="space-y-2">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between py-4 px-2 -mx-2 group border-b theme-border last:border-b-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 theme-bubble-bg rounded-full flex items-center justify-center theme-primary-text relative">
                      <KeyIcon size={18} />
                      {k.isVerified && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white p-0.5 rounded-full border-2 theme-card-bg">
                          <Check size={8} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs theme-text-secondary capitalize">{k.type}</p>
                        {!k.isVerified && (
                          <button 
                            onClick={() => setVerifyingKey(k)}
                            className="text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full"
                          >
                            {t('pix.key_not_verified')}
                          </button>
                        )}
                      </div>
                      <p className="font-bold theme-text-main text-sm">{k.value}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteClick(k.id)} className="p-2 theme-text-secondary hover:text-red-500 active:scale-90 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {keys.length === 0 && (
                <p className="text-center py-10 theme-text-secondary text-sm italic opacity-40">{t('pix.no_keys')}</p>
              )}
            </div>
        </section>
      </div>

      {/* QR Scanner Overlay */}
      {showQRScanner && (
        <QrScanner 
          onScan={handleScanResult} 
          onClose={() => setShowQRScanner(false)} 
        />
      )}

      {/* PASTE LINK MODAL */}
      <Modal isOpen={showPasteModal} onClose={() => setShowPasteModal(false)}>
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold theme-text-main">{t('pix.paste_modal.title')}</h3>
                    <p className="text-xs theme-text-secondary">{t('pix.paste_modal.sub')}</p>
                </div>
                <button onClick={() => setShowPasteModal(false)} className="p-2 theme-bubble-bg rounded-full theme-text-secondary"><X /></button>
            </div>
            <div className="space-y-4">
                <div className="relative">
                    <Clipboard className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary opacity-30" size={18} />
                    <input 
                        type="text" 
                        autoFocus
                        placeholder={t('pix.paste_modal.placeholder')} 
                        value={pastedLink} 
                        onChange={(e) => setPastedLink(e.target.value)} 
                        className="w-full theme-bubble-bg p-4 pl-12 rounded-2xl outline-none theme-text-main border theme-border focus:border-[var(--primary-color)] transition-all text-xs" 
                    />
                </div>
                <button 
                    onClick={handleAnalyzeLink} 
                    disabled={isAnalyzingLink || !pastedLink} 
                    className="w-full theme-primary-bg text-white py-4 rounded-full font-bold active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                    {isAnalyzingLink ? <Loader2 className="animate-spin" size={18} /> : <LinkIcon size={18} />}
                    {t('pix.paste_modal.btn_analyze')}
                </button>
            </div>
            <div className="p-4 theme-bubble-bg rounded-2xl border theme-border flex gap-3 items-start opacity-70">
                <Info size={16} className="theme-primary-text shrink-0 mt-0.5" />
                <p className="text-[10px] theme-primary-text font-medium leading-relaxed">
                    {t('pix.paste_modal.hint_url').split('https://piyes.ht/pay?')[0]}<strong>https://piyes.ht/pay?</strong>{t('pix.paste_modal.hint_url').split('https://piyes.ht/pay?')[1]}
                </p>
            </div>
        </div>
      </Modal>

      {/* LEAVE WARNING MODAL */}
      <Modal isOpen={showLeaveWarning} onClose={() => setShowLeaveWarning(false)} type="centered">
        <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-black theme-text-main tracking-tight">{t('pix.leave_modal.title')}</h3>
                <p className="text-sm theme-text-secondary">{t('pix.leave_modal.sub')}</p>
            </div>
            <div className="flex flex-col gap-3">
                <button 
                    onClick={() => { setShowLeaveWarning(false); if(pendingRoute === '-1') navigate(-1); else navigate(pendingRoute || '/'); }}
                    className="w-full py-4 theme-bubble-bg theme-text-main rounded-2xl font-bold active:scale-95 transition-all"
                >
                    {t('pix.leave_modal.btn_leave')}
                </button>
                <button 
                    onClick={() => setShowLeaveWarning(false)}
                    className="w-full py-4 theme-primary-bg text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg"
                >
                    {t('pix.leave_modal.btn_stay')}
                </button>
            </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} type="centered">
        <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <Trash2 size={32} />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-black theme-text-main tracking-tight">{t('pix.delete_modal.title')}</h3>
                <p className="text-sm theme-text-secondary">{t('pix.delete_modal.sub')}</p>
            </div>
            <div className="flex flex-col gap-3">
                <button 
                    onClick={confirmDelete}
                    disabled={loading}
                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                    {t('pix.delete_modal.btn_delete')}
                </button>
                <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-4 theme-bubble-bg theme-text-main rounded-2xl font-bold active:scale-95 transition-all"
                >
                    {t('common.cancel')}
                </button>
            </div>
        </div>
      </Modal>

      {/* NEW KEY MODAL */}
      <Modal isOpen={showNewModal} onClose={() => { setShowNewModal(false); resetNewKeyStates(); }}>
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold theme-text-main">{t('pix.modal.title')}</h3>
            <button onClick={() => { setShowNewModal(false); resetNewKeyStates(); }} className="p-2 theme-bubble-bg rounded-full theme-text-secondary"><X /></button>
          </div>
          <div className="space-y-6">
            <div className="flex gap-2 p-1 theme-bubble-bg rounded-2xl border theme-border overflow-x-auto no-scrollbar">
              {['email', 'phone', 'tag', 'random'].map(type => (
                <button
                  key={type}
                  onClick={() => setNewKeyType(type)}
                  className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newKeyType === type ? 'theme-primary-bg text-white shadow-md' : 'theme-text-secondary'}`}
                >
                  {type === 'random' ? t('pix.types.random') : t(`pix.types.${type}` as any)}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {newKeyType === 'email' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">{t('pix.labels.email')}</label>
                  <input 
                    type="email" 
                    placeholder="email@exemple.com" 
                    value={emailValue} 
                    onChange={(e) => setEmailValue(e.target.value)} 
                    className="w-full theme-bubble-bg p-4 rounded-2xl outline-none theme-text-main border theme-border focus:theme-card-bg focus:border-[var(--primary-color)] transition-all font-bold" 
                  />
                </div>
              )}

              {newKeyType === 'phone' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">{t('pix.labels.phone')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold theme-text-secondary">+509</span>
                    <input 
                      type="tel" 
                      placeholder="XXXX XXXX" 
                      maxLength={8}
                      value={phoneValue} 
                      onChange={(e) => setPhoneValue(e.target.value.replace(/\D/g, ''))} 
                      className="w-full theme-bubble-bg p-4 pl-16 rounded-2xl outline-none theme-text-main border theme-border focus:theme-card-bg focus:border-[var(--primary-color)] transition-all font-bold" 
                    />
                  </div>
                </div>
              )}

              {newKeyType === 'tag' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">{t('pix.labels.tag')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold theme-text-secondary">@</span>
                    <input 
                      type="text" 
                      placeholder={t('pix.labels.tag_placeholder')} 
                      value={tagValue} 
                      onChange={(e) => setTagValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                      className={`w-full theme-bubble-bg p-4 pl-8 rounded-2xl outline-none theme-text-main border transition-all font-bold ${tagError ? 'border-red-500' : 'theme-border focus:border-[var(--primary-color)]'}`} 
                    />
                    {isCheckingTag && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin theme-primary-text" size={16} />
                    )}
                    {isTagAvailable === true && !isCheckingTag && (
                      <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                    )}
                  </div>
                  {tagError && <p className="text-[10px] text-red-500 font-bold px-1">{tagError}</p>}
                  <p className="text-[9px] theme-text-secondary px-1 italic">{t('pix.labels.tag_hint')}</p>
                </div>
              )}

              {newKeyType === 'random' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">{t('pix.labels.random')}</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        readOnly
                        value={randomValue} 
                        className="w-full theme-bubble-bg p-4 pr-12 rounded-2xl outline-none theme-text-main border theme-border font-mono text-xs font-bold" 
                      />
                      <button 
                        onClick={generateRandomKey}
                        className="absolute right-4 top-1/2 -translate-y-1/2 theme-primary-text active:rotate-180 transition-transform duration-500"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 theme-bubble-bg rounded-2xl border theme-border flex gap-3 items-start opacity-70">
                    <Info size={16} className="theme-primary-text shrink-0 mt-0.5" />
                    <p className="text-[10px] theme-primary-text font-medium leading-relaxed">
                      {t('pix.labels.random_hint')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleCreateKey} 
              disabled={
                loading || 
                (newKeyType === 'email' && !emailValue.includes('@')) ||
                (newKeyType === 'phone' && phoneValue.length < 8) ||
                (newKeyType === 'tag' && (tagValue.length < 4 || !isTagAvailable)) ||
                (newKeyType === 'random' && !randomValue)
              } 
              className="w-full theme-primary-bg text-white py-5 rounded-[24px] font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : t('pix.modal.btn_confirm')}
            </button>
          </div>
        </div>
      </Modal>

      {/* VERIFY KEY MODAL */}
      <Modal isOpen={!!verifyingKey} onClose={() => setVerifyingKey(null)} type="centered">
        <div className="p-8 space-y-8 text-center">
            <div className="w-16 h-16 theme-bubble-bg rounded-[24px] flex items-center justify-center mx-auto theme-primary-text shadow-inner">
                <Shield size={32} />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-black theme-text-main tracking-tight">{t('pix.verify_modal.title')}</h3>
                <p className="text-xs theme-text-secondary leading-relaxed">
                    {t('pix.verify_modal.sub', { channel: verifyingKey?.type === 'email' ? 'e-mail' : 'SMS' })}
                </p>
            </div>
            <div className="space-y-6">
                <input 
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-gray-50 dark:bg-white/5 p-5 rounded-2xl text-center text-3xl font-black tracking-[0.5em] theme-text-main outline-none border-2 border-transparent focus:border-[var(--primary-color)] transition-all"
                />
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleVerifyKey}
                        disabled={isVerifying || otpCode.length < 6}
                        className="w-full py-5 theme-primary-bg text-white rounded-[24px] font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
                    >
                        {isVerifying ? <Loader2 className="animate-spin mx-auto" size={20} /> : t('pix.verify_modal.btn_verify')}
                    </button>
                    <button 
                        onClick={() => setVerifyingKey(null)}
                        className="w-full py-3 theme-text-secondary font-bold text-xs"
                    >
                        {t('common.cancel')}
                    </button>
                </div>
            </div>
        </div>
      </Modal>

      {/* VOICE INTERPRETATION MODAL */}
      <Modal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} type="centered">
        <div className="p-8 flex flex-col items-center gap-8 relative overflow-hidden">
            <button 
              onClick={() => setShowVoiceModal(false)}
              className="absolute top-6 right-6 p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90"
            >
                <X size={20} />
            </button>

            {/* STEP 1 & 2: Recording and Processing */}
            {(voiceStep === 'idle' || voiceStep === 'processing') && (
                <div className="w-full flex flex-col items-center gap-10 py-6">
                    <div className="text-center space-y-2 pt-4">
                        <h3 className="text-2xl font-black theme-text-main tracking-tight">
                            {voiceStep === 'idle' ? t('pix.voice_modal.title') : t('pix.voice_modal.processing')}
                        </h3>
                        <p className="text-xs theme-text-secondary font-medium">{t('pix.voice_modal.hint')}</p>
                    </div>

                    <div className="relative">
                        <div className={`w-32 h-32 rounded-full theme-primary-bg flex items-center justify-center shadow-2xl transition-all duration-500 ${isRecording ? 'scale-110' : ''} ${voiceStep === 'processing' ? 'animate-pulse opacity-50' : ''}`}>
                            {voiceStep === 'processing' ? <Loader2 size={48} className="text-white animate-spin" /> : <Mic size={48} className="text-white" />}
                        </div>
                        {isRecording && (
                            <div className="absolute -inset-6 border-4 border-purple-500 rounded-full animate-ping opacity-20"></div>
                        )}
                    </div>

                    <div className="text-center space-y-4 w-full px-4">
                        {isRecording ? (
                            <>
                                <p className="text-2xl font-mono font-black theme-primary-text">{formatTime(recordingTime)}</p>
                                <p className="text-[10px] font-black theme-text-secondary uppercase tracking-widest animate-pulse">{t('pix.voice_modal.listening')}</p>
                                <button 
                                onClick={stopVoiceRecording}
                                className="w-full py-5 bg-red-500 text-white rounded-[24px] font-black shadow-xl active:scale-95 transition-all"
                                >
                                    {t('pix.voice_modal.btn_stop')}
                                </button>
                            </>
                        ) : voiceStep === 'idle' && (
                            <button 
                            onClick={startVoiceRecording}
                            className="w-full py-5 theme-primary-bg text-white rounded-[24px] font-black shadow-xl active:scale-95 transition-all"
                            >
                                {t('pix.voice_modal.btn_start')}
                            </button>
                        )}
                        {voiceStep === 'processing' && (
                            <p className="text-[10px] font-black theme-text-secondary uppercase tracking-[0.2em]">{t('pix.voice_modal.listening_hint')}</p>
                        )}
                    </div>
                </div>
            )}

            {/* STEP 3: Reformulate */}
            {voiceStep === 'reformulate' && (
                <div className="w-full space-y-6 animate-in zoom-in duration-300">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="theme-primary-text" />
                        <span className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">{t('pix.voice_modal.step_reformulate.title')}</span>
                    </div>
                    <p className="text-xs theme-text-secondary font-medium italic">"{t('pix.voice_modal.step_reformulate.hint')}"</p>
                    <textarea 
                        autoFocus
                        value={voiceEditedRephrased}
                        onChange={(e) => setVoiceEditedRephrased(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/20 p-5 rounded-[24px] border theme-border theme-text-main font-bold text-sm outline-none focus:border-[var(--primary-color)] transition-all resize-none"
                        rows={2}
                    />
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleVoiceFinalConfirm}
                            className="w-full py-5 theme-primary-bg text-white rounded-[24px] font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest"
                        >
                            {t('common.confirm')}
                        </button>
                        <button 
                            onClick={() => setVoiceStep('idle')}
                            className="w-full py-3 theme-text-secondary font-bold text-xs"
                        >
                            {t('common.back')}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 4: Final Confirmation */}
            {voiceStep === 'confirm' && voiceParsedData && (
                <div className="w-full space-y-8 animate-in slide-in-from-bottom duration-300">
                    <div className="text-center space-y-1">
                        <h4 className="text-2xl font-black theme-text-main tracking-tight">{t('pix.voice_modal.step_confirm.title')}</h4>
                        <p className="text-xs theme-text-secondary">{t('pix.voice_modal.step_confirm.sub')}</p>
                    </div>

                    <div className="space-y-5 py-6 border-y theme-border">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">{t('pix.voice_modal.step_confirm.label_op')}</span>
                            <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${voiceParsedData.type === 'transfer' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                {voiceParsedData.type === 'transfer' ? t('actions.transfer') : t('actions.receive')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">{t('pix.voice_modal.step_confirm.label_amount')}</span>
                            <span className="text-2xl font-black theme-text-main">{voiceParsedData.amount?.toLocaleString('fr-HT')} G.</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">{t('pix.voice_modal.step_confirm.label_contact')}</span>
                            <span className="text-sm font-bold theme-text-main">{voiceParsedData.contact || '---'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={executeVoiceAction}
                            className="w-full py-5 theme-primary-bg text-white rounded-[24px] font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.1em]"
                        >
                            {t('pix.voice_modal.step_confirm.btn_continue')} <ChevronRightIcon size={18} />
                        </button>
                        <button 
                            onClick={() => setVoiceStep('reformulate')}
                            className="w-full py-2 theme-text-secondary font-bold text-xs"
                        >
                            {t('pix.voice_modal.step_confirm.btn_edit')}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </Modal>
      <AiSupportChat isOpen={showSupport} onClose={() => setShowSupport(false)} context="QR & Proximité" />
    </div>
  );
};

export default KeysManagement;
