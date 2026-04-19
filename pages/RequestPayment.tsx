// pages/RequestPayment.tsx

import React, { useState, useEffect, useMemo } from 'react';
/* Use react-router core for hooks */
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, QrCode, X, Check, Copy, CalendarClock, ChevronRight, Info, AlertCircle, HelpCircle, Send, Clock } from 'lucide-react';
import { api } from '../services/apiService';
import { User, Key, Contact, getInitials, Friendship, FriendshipStatus } from '../shared/types';
import { ScheduledPayment } from './ScheduledPayments';
import { useTranslation, useGlobalSync } from '../App';
import Modal from '../components/Modal';
import Button from '../components/Button';
import AccountSummary from '../components/AccountSummary';
import AiSupportChat from '../components/AiSupportChat';
import { ContactItem, ContactSection } from '@/components/ContactComponents';
import { ContactSearch } from '@/components/ContactSearch';
import OperationResult from '../components/OperationResult';
import { useToast } from '../App';
import PageHeader from '../components/PageHeader';

interface RequestPaymentProps {
  user: User;
}

import SearchInput from '../components/SearchInput';

const RequestPayment: React.FC<RequestPaymentProps> = ({ user }) => {
  const { t } = useTranslation();
  const { syncData } = useGlobalSync() || { syncData: null };
  const navigate = useNavigate();
  /* Manual searchParams implementation */
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const [keys, setKeys] = useState<Key[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
    const [friendships, setFriendships] = useState<Friendship[]>([]);

  const [selectedKey, setSelectedKey] = useState('');
  const [payerName, setPayerName] = useState(searchParams.get('name') || '');
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [step, setStep] = useState(1);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [isExpired, setIsExpired] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const { showToast } = useToast();

  // Suivi paiement reçu (polling post-génération QR)
  const [receivedTx, setReceivedTx] = useState<{ txId: string; amount: number; senderName: string } | null>(null);
  const [pollingStartBalance, setPollingStartBalance] = useState<number | null>(null);

  
  const [loading, setLoading] = useState(true);

  // Scheduler Form State
  const [schedTitle, setSchedTitle] = useState('');
  const [schedName, setSchedName] = useState(payerName);
  const [schedAmount, setSchedAmount] = useState(amount);
  const [schedDate, setSchedDate] = useState('');

  const isMutualContact = useMemo(() => {
    if (!schedName) return false;
    const search = schedName.toLowerCase().replace('@', '');
    
    // Find contact by name or tag
    const contact = contacts.find(c => 
      c.name.toLowerCase() === search || 
      c.tag.toLowerCase().replace('@', '') === search
    );

    if (!contact || !contact.contactUserId) return false;

    // Check friendship status in syncData
    const friendship = syncData?.friendships?.find(f => 
      (f.requesterId === contact.contactUserId || f.receiverId === contact.contactUserId) &&
      f.status === 'friends'
    );

    return !!friendship;
  }, [contacts, schedName, syncData]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsData, syncData] = await Promise.all([
        api.getContactsFresh(), // Forcer refresh au chargement de la page
        api.syncFresh()
      ]);
      setContacts(contactsData);
      setFriendships(syncData.friendships || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (payerName) setSchedName(payerName);
    if (amount) setSchedAmount(amount);
  }, [payerName, amount]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  //  useEffect de polling
  // Polling toutes les 3s pour détecter un paiement reçu pendant l'affichage du QR
  useEffect(() => {
    if (step !== 2 || isExpired || pollingStartBalance === null) return;

    const interval = setInterval(async () => {
      try {
        const sync = await api.syncFresh();
        const newBalance = sync.user.balance;

        // Solde augmenté → paiement reçu
        if (newBalance > pollingStartBalance) {
          clearInterval(interval);

          // Récupérer la dernière transaction pour le nom de l'expéditeur
          const history = await api.getHistory({ limit: 1 });
          const lastTx = history[0];
          const senderName = lastTx?.counterpartyName || payerName || '';
          
          setReceivedTx({
            txId: lastTx?.id || '',
            amount: parseFloat(amount),
            senderName,
          });
        }
      } catch { /* ignore erreurs polling */ }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, isExpired, pollingStartBalance, amount, payerName]);



  const handleGenerateQR = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    let to = user.accountNumber;
    let type = 'id';
    
    if (selectedKey) {
      const key = keys.find(k => k.value === selectedKey);
      if (key) {
        to = key.value;
        type = key.type;
        if (type === 'tag') to = to.replace('@', '');
      }
    } else {
      if (user.tag) { to = user.tag.replace('@', ''); type = 'tag'; }
      else if (user.phone) { to = user.phone; type = 'phone'; }
      else if (user.email) { to = user.email; type = 'email'; }
    }

    const expiry = Date.now() + (120 * 1000);
    const qrData = `https://piyes.ht/pay?to=${encodeURIComponent(to)}&type=${type}&amount=${amount}&expiry=${expiry}&payer=${encodeURIComponent(payerName)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    setGeneratedQR(qrUrl);
    setTimeLeft(120);
    setIsExpired(false);

    // Snapshot du solde courant → détecter la réception par comparaison
    try {
      const sync = await api.syncFresh();
      setPollingStartBalance(sync.user.balance);
    } catch { /* ignore */ }

    setStep(2);
  };

  const handleCreateScheduled = () => {
    if (!schedName || !schedAmount || !schedDate) return;
    
    const newSched: ScheduledPayment = {
        id: Math.random().toString(36).substring(2, 9),
        title: schedTitle || `Demande à @${schedName.replace(/\s+/g, '').toLowerCase()}`,
        counterparty: schedName,
        amount: parseFloat(schedAmount),
        dueDate: schedDate,
        status: 'pending',
        type: 'incoming'
    };

    const existing = JSON.parse(localStorage.getItem('piyes-scheduled-payments') || '[]');
    localStorage.setItem('piyes-scheduled-payments', JSON.stringify([newSched, ...existing]));
    
    setShowSchedulerModal(false);
    navigate('/scheduler?tab=incoming');
  };

  const handleCopyLink = () => {
    let to = user.accountNumber;
    let type = 'id';
    
    if (selectedKey) {
      const key = keys.find(k => k.value === selectedKey);
      if (key) {
        to = key.value;
        type = key.type;
        if (type === 'tag') to = to.replace('@', '');
      }
    } else {
      if (user.tag) { to = user.tag.replace('@', ''); type = 'tag'; }
      else if (user.phone) { to = user.phone; type = 'phone'; }
      else if (user.email) { to = user.email; type = 'email'; }
    }

    const link = `https://piyes.ht/pay?to=${encodeURIComponent(to)}&type=${type}&amount=${amount}`;
    navigator.clipboard.writeText(link);
    alert(t('request.copy_link'));
  };

  const handleSelectUser = (user: any) => {
    setPayerName(user.tag || user.phone || user.email || user.name);
  };


  // Rendu conditionnel
  // Bascule automatique vers OperationResult si paiement reçu pendant le QR
  if (receivedTx) {
    return (
      <OperationResult
        type="transfer"
        status="success"
        amount={receivedTx.amount}
        recipientName={receivedTx.senderName}
        txId={receivedTx.txId}
        role="receiver"
      />
    );
  }

  return (
    <div className="theme-card-bg min-h-screen flex flex-col">
      <PageHeader 
  title={t('request.title')}
  onBack={() => step === 1 ? navigate(-1) : setStep(1)}
  rightElement={
    <div className="w-10 h-10 rounded-full theme-bubble-bg flex items-center justify-center 
                    theme-text-secondary active:scale-90 transition-transform opacity-80 
                    hover:opacity-100">
      <HelpCircle 
        size={20} 
        onClick={() => setShowSupport(true)} 
      />
    </div>
  }
  className="sticky top-0 theme-card-bg z-10 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
/>


      <div className="flex-1 p-6 space-y-8 animate-in fade-in overflow-y-auto no-scrollbar">
        {step === 1 ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold theme-text-secondary uppercase tracking-widest px-1">
                {t('request.amount_label', { required: t('common.required') })}
              </label>
              <div className="flex items-center border-b-2 theme-border pb-2">
                <span className="text-xl font-bold theme-text-secondary mr-2">{t('currency.symbol')}</span>
                <input
                    autoFocus
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('transfer.amount_placeholder')}
                    className="w-full text-5xl font-bold outline-none bg-transparent theme-text-main"
                />
              </div>
            </div>

            <AccountSummary user={user} type="deposit" amount={amount} />

            <div className="space-y-2">
              <label className="text-xs font-bold theme-text-secondary uppercase tracking-widest px-1">
                {t('request.key_label', { optional: t('common.optional') })}
              </label>
              <select 
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full theme-bubble-bg p-4 rounded-2xl outline-none theme-text-main border theme-border"
              >
                <option value="">{t('request.account_default')}</option>
                {keys.map(k => <option key={k.id} value={k.value}>{k.type}: {k.value}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold theme-text-secondary uppercase tracking-widest px-1">
                {t('request.payer_label', { optional: t('common.optional') })}
              </label>
              <SearchInput 
                contacts={contacts} 
                onSelect={handleSelectUser} 
                onContactChange={fetchData}
                currentUser={user}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4">
                <Button
                  fullWidth
                  disabled={!amount || parseFloat(amount) <= 0}
                  onClick={handleGenerateQR}
                  leftIcon={<QrCode size={20} />}
                >
                    {t('request.btn_qr')}
                </Button>
                <Button
                  variant="utility"
                  fullWidth
                  disabled={!amount || parseFloat(amount) <= 0}
                  onClick={() => navigate(`/transfer?amount=${amount}`)}
                  leftIcon={<Send size={20} />}
                >
                    {t('request.btn_send_amount')}
                </Button>
                <Button
                  variant="utility"
                  fullWidth
                  onClick={() => setShowSchedulerModal(true)}
                  leftIcon={<CalendarClock size={20} />}
                >
                    {t('request.btn_schedule')}
                </Button>
            </div>

            <div className="p-4 theme-bubble-bg rounded-2xl border theme-border flex gap-3 items-start">
                <Info size={18} className="theme-primary-text shrink-0 mt-0.5" />
                <p className="text-[10px] theme-primary-text font-medium leading-relaxed italic">
                    {t('request.info_tip')}
                </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in zoom-in duration-300">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full mb-2">
                    <Check size={32} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold theme-text-main">{t('request.success_title')}</h2>
                <p className="text-3xl font-black theme-primary-text">{parseFloat(amount).toLocaleString('fr-HT')} {t('currency.symbol')}</p>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-2xl border theme-border mx-auto max-w-[280px] relative">
                <div className={`transition-all duration-300 ${isExpired ? 'blur-md opacity-20 grayscale' : ''}`}>
                  <img src={generatedQR!} alt="Request QR" className="w-full h-full" />
                </div>
                {isExpired && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                      <AlertCircle size={24} />
                    </div>
                    <p className="text-sm font-black text-red-600 uppercase tracking-tighter">{t('request.qr_expired')}</p>
                    <button 
                      onClick={handleGenerateQR}
                      className="text-[10px] font-bold theme-primary-text underline"
                    >
                      {t('request.generate_new')}
                    </button>
                  </div>
                )}
            </div>

            {!isExpired && (
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center gap-2 theme-text-secondary">
                  <Clock size={14} />
                  <span className="text-xs font-bold">{t('request.expires_in')} {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${timeLeft < 30 ? 'bg-red-500' : 'theme-primary-bg'}`}
                    style={{ width: `${(timeLeft / 120) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="space-y-4">
                <Button
                  variant="utility"
                  fullWidth
                  onClick={handleCopyLink}
                  leftIcon={<Copy size={18} />}
                >
                    {t('request.copy_link')}
                </Button>
                <button 
                  onClick={() => setStep(1)}
                  className="w-full text-center theme-text-secondary text-xs font-bold"
                >
                    {t('request.modify')}
                </button>
            </div>

            <div className="p-6 border-t theme-border">
                <p className="text-center text-[10px] theme-text-secondary leading-relaxed italic">
                  {t('request.footer_tip')}
                </p>
            </div>
          </div>
        )}
      </div>

      {/* Scheduler Modal */}
      <Modal isOpen={showSchedulerModal} onClose={() => setShowSchedulerModal(false)}>
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <CalendarClock className="theme-primary-text" size={24} />
                    <h2 className="text-2xl font-bold theme-text-main">{t('scheduler.title')}</h2>
                </div>
                <button onClick={() => setShowSchedulerModal(false)} className="p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                      {t('scheduler.form.title_label', { optional: t('common.optional') })}
                    </label>
                    <input 
                      type="text" 
                      placeholder={t('scheduler.form.title_placeholder', { name: payerName || '...' })}
                      value={schedTitle}
                      onChange={(e) => setSchedTitle(e.target.value)}
                      className="w-full theme-bubble-bg p-4 rounded-2xl outline-none theme-text-main border theme-border font-bold" 
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                      {t('scheduler.form.contact_label', { required: t('common.required') })}
                    </label>
                    <SearchInput 
                      contacts={contacts} 
                      onSelect={(user) => setSchedName(user.tag || user.phone || user.email || user.name)} 
                      onContactChange={fetchData}
                      currentUser={user}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                          {t('scheduler.form.amount_label', { required: t('common.required') })}
                        </label>
                        <input 
                          type="number" 
                          value={schedAmount}
                          onChange={(e) => setSchedAmount(e.target.value)}
                          className="w-full theme-bubble-bg p-4 rounded-2xl outline-none theme-text-main border theme-border font-black" 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-1">
                          {t('scheduler.form.date_label', { required: t('common.required') })}
                        </label>
                        <input 
                          type="date" 
                          value={schedDate}
                          onChange={(e) => setSchedDate(e.target.value)}
                          className="w-full theme-bubble-bg p-4 rounded-2xl outline-none theme-text-main border theme-border font-bold text-sm" 
                        />
                    </div>
                </div>

                <div className="p-4 theme-bubble-bg rounded-2xl border theme-border flex gap-3 items-start">
                    <AlertCircle size={18} className={isMutualContact ? "theme-primary-text shrink-0 mt-0.5" : "text-amber-500 shrink-0 mt-0.5"} />
                    <p className={`text-[9px] font-medium leading-relaxed ${isMutualContact ? "theme-primary-text" : "text-amber-600"}`}>
                    {isMutualContact 
                      ? t('scheduler.form.info') 
                      : t('request.scheduler_friends_only')}
                </p>
                </div>

                <Button
                    fullWidth
                    disabled={!schedName || !schedAmount || !schedDate || !isMutualContact}
                    onClick={handleCreateScheduled}
                >
                    {t('scheduler.form.btn_create')}
                </Button>
            </div>
        </div>
      </Modal>
      <AiSupportChat isOpen={showSupport} onClose={() => setShowSupport(false)} context={t('actions.deposit')} />
    </div>
  );
};

export default RequestPayment;
