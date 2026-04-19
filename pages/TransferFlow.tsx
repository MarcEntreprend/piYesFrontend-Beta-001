// pages/TransferFlow.tsx

import React, { useState, useEffect, useMemo } from 'react';
/* Use react-router core for hooks */
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, ChevronRight, CheckCircle2, FileText, Home, Loader2, HelpCircle } from 'lucide-react';
import { api } from '../services/apiService';
import { financeService } from '../services/financeService';
import { User, Contact, getInitials } from '../shared/types';
import { useTranslation, useSecurity, useGlobalSync } from '../App';
import PinOverlay from '../components/PinOverlay';
import AccountSummary from '../components/AccountSummary';
import OperationResult from '../components/OperationResult';
import AiSupportChat from '../components/AiSupportChat';
import Button from '../components/Button';
import { ContactSearch } from '@/components/ContactSearch';
import { ContactItem } from '@/components/ContactComponents';
import PageHeader from '../components/PageHeader';
import { formatRecipientValue, isOwnKey, getRecipientType, RecipientType } from '../shared/recipientUtils';

interface TransferFlowProps {
  user: User;
  onUpdateUser?: (user: User) => void;
}

const TransferFlow: React.FC<TransferFlowProps> = ({ user, onUpdateUser }) => {
  const { t } = useTranslation();
  const { triggerSensitiveAction, handleForgotPin } = useSecurity();
  const { refresh } = useGlobalSync();
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [keyValue, setKeyValue] = useState(searchParams.get('recipient') || searchParams.get('name') || '');
  const isLocked = searchParams.get('locked') === 'true';
  const source = searchParams.get('source');
  const from = searchParams.get('from');
  const originalLink = searchParams.get('link');
  const schedulerId = searchParams.get('schedulerId') || ''; // ID rappel scheduler si paiement depuis rappel
  const schedulerTitle = searchParams.get('schedulerTitle') || ''; // titre du rappel pour affichage
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: 'success' | 'failure'; tx?: any; error?: string } | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [qrExpired, setQrExpired] = useState(false);
  // Pre-check destinataire (résolution avant étape 3)
  const [resolvedRecipient, setResolvedRecipient] = useState<{ id: string; name: string; tag?: string; avatarUrl?: string } | null>(null);
  const [resolvingRecipient, setResolvingRecipient] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const navigate = useNavigate();

  const getPriorityKey = (contact: Contact | Partial<Contact>) => {
    if (contact.tag) {
      const type = getRecipientType(contact.tag);
      if (type === RecipientType.TAG) {
        return contact.tag.startsWith('@') ? contact.tag : `@${contact.tag}`;
      }
      return contact.tag;
    }
    if (contact.phone) return contact.phone.startsWith('+') ? contact.phone : `+${contact.phone}`;
    if (contact.email) return contact.email;
    if (contact.randomKey) return contact.randomKey;
    return contact.name || '';
  };

  const favorites = useMemo(() => contacts.filter(c => c.isFavorite), [contacts]);

  const recentContacts = useMemo(() => {
    return [...contacts]
      .filter(c => c.lastTransactionDate)
      .sort((a, b) => new Date(b.lastTransactionDate!).getTime() - new Date(a.lastTransactionDate!).getTime())
      .slice(0, 5);
  }, [contacts]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const data = await api.getContacts();
    setContacts(data);
  };

  // Pré-sélection du destinataire depuis les searchParams (QR, lien, scheduler, dashboard...)
  useEffect(() => {
    const recipientParam = searchParams.get('recipient');
    const nameParam = searchParams.get('name');
    const tagParam = searchParams.get('tag');
    const expiryParam = searchParams.get('expiry');
    const amountParam = searchParams.get('amount');

    if (expiryParam) {
      const expiryTime = parseInt(expiryParam);
      if (Date.now() > expiryTime) { setQrExpired(true); return; }
    }

    // Si source = scheduler : lookup par receiverUserId → extraire la bonne clé
    const receiverUserId = searchParams.get('receiverUserId');
    if (receiverUserId && contacts.length > 0 && !selectedContact) {
      const found = contacts.find(c => c.contactUserId === receiverUserId);
      if (found) {
        setSelectedContact(found);
        setKeyValue(getPriorityKey(found));
        if (amountParam) { setAmount(amountParam); setStep(3); }
        else setStep(2);
      }
      return;
    }

    if (recipientParam) {
      setKeyValue(recipientParam);
      const q = recipientParam.toLowerCase();
      const qNoPrefix = q.startsWith('@') || q.startsWith('+') ? q.substring(1) : q;
      const contact = contacts.find(c =>
        (c.tag && c.tag.toLowerCase() === qNoPrefix) ||
        (c.phone && c.phone.toLowerCase() === qNoPrefix) ||
        (c.email && c.email.toLowerCase() === q) ||
        (c.randomKey && c.randomKey.toLowerCase() === q) ||
        (c.name && c.name.toLowerCase() === q)
      );
      if (contact) setSelectedContact(contact);
      setStep(amountParam ? 3 : 2);
      if (amountParam) setAmount(amountParam);
    } else if (tagParam) {
      const contact = contacts.find(c => c.tag === tagParam);
      if (contact) {
        setSelectedContact(contact);
        setKeyValue(getPriorityKey(contact));
        setStep(amountParam ? 3 : 2);
      } else {
        setKeyValue(tagParam);
        setStep(2);
      }
      if (amountParam) setAmount(amountParam);
    } else if (nameParam && contacts.length > 0) {
      const contact = contacts.find(c => c.name === nameParam);
      if (contact && !selectedContact) {
        setSelectedContact(contact);
        setKeyValue(getPriorityKey(contact));
        if (amountParam) { setAmount(amountParam); setStep(3); }
        else setStep(2);
      }
    }
  }, [contacts, searchParams, selectedContact]);

  // Pre-check destinataire quand on passe à l'étape 3
  useEffect(() => {
    if (step !== 3 || !keyValue) return;
    
    if (isOwnKey(keyValue, user)) {
      setRecipientError(t('transfer.self_transfer_error', { key: keyValue }));
      return;
    }

    setResolvingRecipient(true);
    setRecipientError(null);
    setResolvedRecipient(null);

    api.resolveRecipient(keyValue)
      .then(data => {
        setResolvedRecipient(data);
        setResolvingRecipient(false);
      })
      .catch((e: any) => {
        const msg = e?.data?.error?.message || e?.message || t('transfer.recipient_not_found_error');
        setRecipientError(msg);
        setResolvingRecipient(false);
      });
  }, [step, keyValue, user, t]);

  const handlePreTransfer = () => {
    triggerSensitiveAction((pin) => {
        handleTransfer(pin);
    });
  };

  const handleTransfer = async (pin?: string) => {
    setLoading(true);
    try {
      const numericAmount = parseFloat(amount);
      const { netAmount } = financeService.calculateFees(numericAmount, 'transfer');
      const targetId = keyValue || selectedContact?.userId;

      let description = undefined;
      if (source === 'link') description = t('transfer.prefilled_link_desc');
      else if (source === 'qr') description = t('transfer.prefilled_qr_desc');
      else if (source === 'scheduler') {
        const schedulerNote = searchParams.get('description');
        description = schedulerNote || t('transfer.scheduler_payment_desc');
      }

      const tx = await api.transfer(netAmount, targetId, description, pin, schedulerId || undefined);

      await api.syncFresh();
      await refresh();

      if (tx.recipientId) {
        const contactData: any = {
          contactUserId: tx.recipientId,
          name: tx.recipientName || getRecipientDisplay(),
          avatarUrl: tx.recipientAvatarUrl,
          lastTransactionDate: new Date().toISOString()
        };
        const searchVal = keyValue.toLowerCase();
        if (searchVal.startsWith('@')) contactData.tag = searchVal;
        else if (searchVal.includes('@')) contactData.email = searchVal;
        else if (searchVal.length === 25) contactData.randomKey = searchVal;
        else if (/^\d{8}$/.test(searchVal) || searchVal.startsWith('+509')) contactData.phone = searchVal;
        try { await api.saveContact(contactData); } catch (e) { console.error('Failed to save contact:', e); }
      }

      setLoading(false);
      setResult({ status: 'success', tx });
    } catch (e: any) {
      setLoading(false);
      setResult({ status: 'failure', error: e.message || t('common.error') });
    }
  };

  const handleSelectUser = (user: Partial<Contact>) => {
    // Check if it's a contact
    const contact = contacts.find(c => 
      (user.id && (c.id === user.id || c.contactUserId === user.id)) ||
      (user.tag && c.tag === user.tag) ||
      (user.phone && c.phone === user.phone) ||
      (user.email && c.email === user.email)
    );

    if (contact) {
      setSelectedContact(contact);
      setKeyValue(getPriorityKey(contact));
    } else {
      setSelectedContact(null);
      setKeyValue(getPriorityKey(user));
    }
    setStep(2);
  };

  const getRecipientDisplay = () => {
    if (selectedContact) return selectedContact.name;
    return keyValue;
  };

  const getRecipientInitials = () => {
    if (selectedContact) return getInitials(selectedContact.name);
    if (keyValue.startsWith('@') && getRecipientType(keyValue) === RecipientType.TAG) return keyValue.substring(1, 3).toUpperCase();
    if (keyValue.includes('@')) return keyValue.substring(0, 2).toUpperCase();
    return keyValue.substring(0, 2).toUpperCase();
  };

  const getRecipientKeyType = () => {
    // Si paiement depuis un rappel → afficher le contexte rappel
    if (source === 'scheduler') {
      const title = schedulerTitle || searchParams.get('description') || t('transfer.scheduler_reminder');
      return title;
    }
    if (keyValue.startsWith('@') && getRecipientType(keyValue) === RecipientType.TAG) return t('transfer.key_tag');
    if (keyValue.includes('@')) return t('transfer.key_email');
    if (/^\+?\d+$/.test(keyValue)) return t('transfer.key_phone');
    if (keyValue.length === 25) return t('transfer.key_random');
    return t('transfer.key_recipient');
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
    } else if (source === 'scheduler' && step === 3) {
      // Cas rappel : retour direct vers scheduler onglet "À régler", item déployé
      navigate(`/scheduler?tab=outgoing&openItem=${schedulerId}`);
    } else if (step === 3 && isLocked && from === 'keys') {
      navigate(`/keys?modal=pix&link=${encodeURIComponent(originalLink || '')}`);
    } else {
      setStep(step - 1);
    }
  };

  if (qrExpired) return (
    <OperationResult 
      type="transfer" 
      status="failure" 
      amount={parseFloat(amount)} 
      recipientName={getRecipientDisplay()}
      reason={t('transfer.qr_expired_msg')}
      role="payer"
    />
  );

  if (result) return (
    <OperationResult 
      type="transfer" 
      status={result.status} 
      amount={parseFloat(amount)} 
      recipientName={getRecipientDisplay()}
      reason={result.error}
      txId={result.tx?.id}
      role="payer"
    />
  );

  return (
  <div className="theme-card-bg min-h-screen pb-32">
    <PageHeader 
      title={t('transfer.title')}
      onBack={handleBack}
      rightElement={
        <div className="w-10 h-10 rounded-full theme-bubble-bg flex items-center justify-center 
          theme-text-secondary active:scale-90 transition-transform opacity-80 
          hover:opacity-100">
          <button onClick={() => setShowSupport(true)}>
            <HelpCircle size={20} />
          </button>
        </div>
      }
      className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
    />
      <div className="flex-1 px-0 flex flex-col overflow-y-auto no-scrollbar pb-6 pt-6">
        {step === 1 ? (
          <div className="flex-1 animate-in slide-in-from-right duration-300">
            <h2 className="text-2xl font-bold mb-8 theme-text-main px-6">{t('transfer.step_who')}</h2>
            
            <ContactSearch 
              contacts={contacts} 
              onSelect={handleSelectUser} 
              placeholder={t('transfer.search_placeholder')}
              query={searchQuery}
              setQuery={setSearchQuery}
              currentUser={user}
            />

            {!searchQuery.trim() && (
              <div className="space-y-6 mt-4">
                {favorites.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-8">{t('transfer.favorites')}</h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-6">
                      {favorites.map(c => (
                        <ContactItem 
                          key={`fav-${c.id}`} 
                          contact={c} 
                          onClick={() => { 
                            setSelectedContact(c); 
                            setKeyValue(getPriorityKey(c));
                            setStep(2); 
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {recentContacts.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-8">{t('transfer.recent')}</h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-6">
                      {recentContacts.map(c => (
                        <ContactItem 
                          key={`recent-${c.id}`} 
                          contact={c} 
                          onClick={() => { 
                            setSelectedContact(c); 
                            setKeyValue(getPriorityKey(c));
                            setStep(2); 
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black theme-text-secondary uppercase tracking-widest px-8">{t('transfer.all_contacts')}</h3>
                  <div className="bg-white theme-bubble-bg rounded-[32px] overflow-hidden border theme-border mx-6">
                    {contacts.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                      <ContactItem 
                        key={c.id} 
                        contact={c} 
                        variant="list"
                        onClick={() => { 
                          setSelectedContact(c); 
                          setKeyValue(getPriorityKey(c));
                          setStep(2); 
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : step === 2 ? (
          <div className="flex-1 animate-in slide-in-from-right duration-300 px-6">
            <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold theme-text-main">{t('transfer.step_amount', { currency: t('currency.name_plural') })}</h2>
                <div className="bg-purple-100 dark:bg-purple-900/30 px-4 py-1.5 rounded-full flex items-center gap-2">
    <span className="text-[10px] font-black theme-primary-text uppercase tracking-wider">{keyValue || getRecipientDisplay()}</span>
</div>
            </div>
            <div className="flex items-center border-b-2 theme-border pb-2 focus-within:border-[var(--primary-color)] transition-colors mb-10">
              <span className="text-xl font-bold theme-text-secondary mr-2">{t('currency.symbol')}</span>
              <input
                autoFocus
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('transfer.amount_placeholder')}
                disabled={isLocked}
                className="w-full text-5xl font-bold outline-none bg-transparent theme-text-main disabled:opacity-70"
              />
            </div>
            
            <AccountSummary 
              user={user} 
              type="transfer" 
              amount={amount} 
              recipientName={getRecipientDisplay()}
              onAmountChange={(val) => setAmount(val)}
            />
          </div>
        ) : (
          <div className="flex-1 animate-in slide-in-from-right duration-300 px-6">
            <h2 className="text-2xl font-bold mb-8 theme-text-main">{t('transfer.step_review')}</h2>

            {/* Bloc recap destinataire */}
            <div className="theme-bubble-bg p-8 rounded-[32px] space-y-8 border theme-border relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 theme-primary-bg opacity-20"></div>

              {/* Montant */}
              <div className="flex flex-col gap-1">
                <span className="theme-text-secondary font-bold uppercase text-[9px] tracking-[0.2em]">{t('transfer.review_amount')}</span>
                <span className="text-3xl font-black theme-text-main">{parseFloat(amount).toLocaleString('fr-HT')} {t('currency.symbol')}</span>
              </div>

              <div className="h-px bg-gray-200 dark:bg-gray-700"></div>

              {/* Destinataire — 3 états : loading / erreur / succès */}
              {resolvingRecipient ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <Loader2 size={20} className="animate-spin theme-text-secondary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="theme-text-secondary font-bold uppercase text-[9px] tracking-[0.2em]">{t('transfer.review_dest')}</span>
                    <span className="text-sm theme-text-secondary">{t('transfer.verifying_recipient')}</span>
                  </div>
                </div>
              ) : recipientError ? (
                // Destinataire introuvable ou permission refusée
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0 text-xs font-black">
                    ✕
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="theme-text-secondary font-bold uppercase text-[9px] tracking-[0.2em]">{t('transfer.review_dest')}</span>
                    <span className="font-bold text-red-500 text-sm">{t('transfer.recipient_not_found')}</span>
                    <span className="text-xs font-bold bg-red-100/60 dark:bg-red-900/20 text-red-500 px-2 py-0.5 rounded-lg w-fit">{keyValue}</span>
                    <p className="text-[10px] text-red-400">{recipientError}</p>
                  </div>
                </div>
              ) : (
                // Destinataire résolu avec succès
                <div className="flex items-center gap-4">
                  {/* Avatar en cercle */}
                  <div className="w-12 h-12 rounded-full theme-primary-bg text-white flex items-center justify-center font-bold shadow-lg shrink-0 overflow-hidden">
                    {resolvedRecipient?.avatarUrl
                      ? <img src={resolvedRecipient.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      : getRecipientInitials()}
                  </div>
                  <div className="flex flex-col">
                    <span className="theme-text-secondary font-bold uppercase text-[9px] tracking-[0.2em]">{t('transfer.review_dest')}</span>
                    {/* Nom prioritaire : resolvedRecipient.name > selectedContact.name > keyValue */}
                    <span className="font-bold theme-text-main text-lg">
                      {resolvedRecipient?.name || selectedContact?.name || keyValue}
                    </span>
                    {keyValue && <span className="text-xs theme-primary-text font-bold">{keyValue}</span>}
                    {/* Texte dynamique : rappel ou type standard */}
                    <p className="text-[10px] theme-text-secondary">{getRecipientKeyType()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="sticky bottom-0 bg-transparent pt-6 mt-auto pb-32 px-6">
          {step === 1 ? (
             <div className="h-14"></div> 
          ) : step === 2 ? (
            <Button
              fullWidth
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > user.balance}
              onClick={() => setStep(3)}
              rightIcon={<ChevronRight size={20} />}
            >
              {t('common.continue')}
            </Button>
          ) : step === 3 ? (
            <Button
              fullWidth
              isLoading={loading}
              disabled={resolvingRecipient || !!recipientError}
              onClick={handlePreTransfer}
            >
              {t('transfer.confirm_btn')}
            </Button>
          ) : null}
        </div>
      </div>

      <AiSupportChat isOpen={showSupport} onClose={() => setShowSupport(false)} context={t('actions.transfer')} />
    </div>
  );
};

export default TransferFlow;
