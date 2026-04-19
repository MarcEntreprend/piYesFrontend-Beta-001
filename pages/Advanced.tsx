
import React, { useState, useEffect } from 'react';
/* Use react-router core for hooks */
import { useNavigate } from 'react-router';
import { ArrowLeft, Database, Activity, Terminal, Wallet, CheckCircle, RefreshCcw, ChevronRight } from 'lucide-react';
import { api } from '../services/apiService';
import { useTranslation } from '../App';
import PageHeader from '../components/PageHeader';

const Advanced: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [health, setHealth] = useState<any | null>(null);
  const [debugId, setDebugId] = useState('');
  const [decryptedValue, setDecryptedValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getAccounts().then(setAccounts);
    api.getHealth().then(setHealth);
  }, []);

  const handleDecrypt = async () => {
    if (!debugId) return;
    setLoading(true);
    try {
      const val = await api.decryptId(debugId);
      setDecryptedValue(val);
    } catch (e) {
      alert(t('common.error'));
    }
    setLoading(false);
  };

  return (
    <div className="theme-card-bg min-h-screen pb-20">
      <PageHeader
        title={t('advanced.title')}
        onBack={() => navigate(-1)}
        className="sticky top-0 theme-card-bg z-30 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />


      <div className="p-6 space-y-8 animate-in fade-in duration-300">
        <section className="space-y-4">
          <h3 className="text-xs font-bold theme-text-secondary uppercase tracking-widest flex items-center gap-2">
            <Wallet size={14} /> {t('advanced.sections.accounts')}
          </h3>
          <div className="space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="p-4 theme-bubble-bg rounded-2xl border theme-border flex justify-between items-center">
                <div>
                  <p className="font-bold theme-text-main">{acc.label}</p>
                  <p className="text-[10px] theme-text-secondary">ID: {acc.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold theme-primary-text">{acc.balance.toLocaleString('fr-HT')} {t('currency.symbol')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold theme-text-secondary uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} /> {t('advanced.sections.health')}
          </h3>
          <div className="p-5 border theme-border rounded-2xl bg-gray-50 dark:bg-gray-800">
            {health ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs theme-text-secondary">{t('advanced.health.status')}</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                    <CheckCircle size={10} /> {health.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs theme-text-secondary">{t('advanced.health.version')}</span>
                  <span className="text-xs theme-text-main font-mono">{health.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs theme-text-secondary">{t('advanced.health.uptime')}</span>
                  <span className="text-xs theme-text-main">{health.uptime}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs theme-text-secondary text-center py-4">{t('common.loading')}</p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold theme-text-secondary uppercase tracking-widest flex items-center gap-2">
            <Terminal size={14} /> {t('advanced.sections.debug')}
          </h3>
          <div className="p-5 border theme-border rounded-2xl space-y-4">
            <p className="text-[10px] theme-text-secondary uppercase tracking-wider">{t('advanced.debug.label')}</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder={t('advanced.debug.placeholder')}
                value={debugId}
                onChange={(e) => setDebugId(e.target.value)}
                className="flex-1 theme-bubble-bg border theme-border rounded-xl px-3 text-xs theme-text-main outline-none focus:border-[var(--primary-color)]"
              />
              <button onClick={handleDecrypt} className="bg-gray-200 dark:bg-gray-700 p-3 rounded-xl active:scale-95 transition-all">
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            {decryptedValue && (
              <div className="p-3 bg-black rounded-lg">
                <p className="text-[10px] font-mono text-green-500 break-all">{decryptedValue}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Advanced;
