
import React, { useState, useEffect } from 'react';
/* Use react-router core for hooks */
import { useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, Landmark, FileText, Home, HelpCircle, MapPin, Search, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../services/apiService';
import { User } from '../shared/types';
import { useTranslation, useSecurity, useGlobalSync } from '../App';
import AccountSummary from '../components/AccountSummary';
import OperationResult from '../components/OperationResult';
import AiSupportChat from '../components/AiSupportChat';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';

interface DepositFlowProps {
  user: User;
  onUpdateUser?: (user: User) => void;
}

type FlowStep = 'amount' | 'agent';

const DepositFlow: React.FC<DepositFlowProps> = ({ user, onUpdateUser }) => {
  const { t } = useTranslation();
  const { refresh } = useGlobalSync();
  const [step, setStep] = useState<FlowStep>('amount');
  const [amount, setAmount] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: 'success' | 'failure'; tx?: any; error?: string } | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 'agent') {
      api.getAgents().then(setAgents);
    }
  }, [step]);

  const handlePreDeposit = () => {
    setStep('agent');
  };

  const { triggerSensitiveAction } = useSecurity();

  const handleDeposit = async (agent: any) => {
    setSelectedAgent(agent);
    setLoading(true);
    try {
      const depositAmount = parseFloat(amount);
      const tx = await api.deposit(depositAmount, agent.name);
      
      // Trigger global sync refresh to update balance everywhere
      await api.syncFresh();
      await refresh();

      setLoading(false);
      setResult({ status: 'success', tx });
    } catch (e: any) {
      setLoading(false);
      setResult({ status: 'failure', error: e.message || t('common.error') });
    }
  };

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (result) return (
    <OperationResult 
      type="deposit" 
      status={result.status} 
      amount={parseFloat(amount) || 0} 
      reason={result.error}
      txId={result.tx?.id}
      role="receiver"
    />
  );

  return (
    <div className="theme-card-bg min-h-screen flex flex-col relative overflow-hidden">
      <PageHeader 
  title={t('deposit.title')}
  onBack={() => step === 'agent' ? setStep('amount') : navigate(-1)}
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
  className="sticky top-0 theme-card-bg z-20 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
/>


      <div className="flex-1 px-6 flex flex-col overflow-y-auto no-scrollbar pb-6 pt-6">
        {step === 'amount' && (
          <div className="flex-1 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-8 theme-text-main">{t('deposit.amount_q', { currency: t('currency.name_plural') })}</h2>
              <div className="flex items-center border-b-2 theme-border pb-2 mb-10 focus-within:border-[var(--primary-color)] transition-all">
                <span className="text-xl font-bold theme-text-secondary mr-2">{t('currency.name_plural')}</span>
                <input
                  autoFocus
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('transfer.amount_placeholder')}
                  className="w-full text-5xl font-bold outline-none bg-transparent theme-text-main"
                />
              </div>

              <AccountSummary user={user} type="deposit" amount={amount} />
            </div>

            <div className="pb-32 pt-6">
              <Button
                fullWidth
                disabled={!amount || parseFloat(amount) <= 0 || loading}
                onClick={handlePreDeposit}
              >
                {t('common.continue')}
              </Button>
            </div>
          </div>
        )}

        {step === 'agent' && (
          <div className="flex-1 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex-1 space-y-6">
              <h2 className="text-2xl font-bold theme-text-main">{t('deposit.where_q')}</h2>
              
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary" size={20} />
                <input 
                  type="text"
                  placeholder={t('withdraw.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full theme-bubble-bg pl-12 pr-4 py-4 rounded-2xl outline-none theme-text-main border theme-border focus:border-[var(--primary-color)] transition-all"
                />
              </div>

              <div className="space-y-3">
                {filteredAgents.map(agent => (
                  <button 
                    key={agent.id}
                    onClick={() => handleDeposit(agent)}
                    disabled={agent.status === 'closed' || loading}
                    className="w-full theme-bubble-bg p-5 rounded-[28px] flex items-center gap-4 border theme-border active:scale-[0.98] transition-all disabled:opacity-50 text-left"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${agent.type === 'atm' ? 'bg-blue-500' : 'bg-green-500'} text-white`}>
                      {loading && selectedAgent?.id === agent.id ? <Loader2 className="animate-spin" size={24} /> : (agent.type === 'atm' ? <Landmark size={24} /> : <MapPin size={24} />)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold theme-text-main">{agent.name}</p>
                      <p className="text-xs theme-text-secondary">{agent.address} • {agent.distance}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ChevronRight size={20} className="theme-text-secondary" />
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${agent.status === 'open' ? 'text-green-500' : 'text-red-500'}`}>
                        {agent.status === 'open' ? t('withdraw.status_open') : t('withdraw.status_closed')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <AiSupportChat isOpen={showSupport} onClose={() => setShowSupport(false)} context={t('actions.deposit')} />
    </div>
  );
};

export default DepositFlow;
