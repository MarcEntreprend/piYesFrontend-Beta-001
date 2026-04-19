
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell, Mail, Smartphone, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { useTranslation } from '../App';
import { notificationService, NotificationPrefs } from '../services/notificationService';
import PageHeader from '../components/PageHeader';

const NotificationsSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const [settings, setSettings] = useState<NotificationPrefs>(() => notificationService.getPreferences());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const scrollTo = searchParams.get('scroll');
    if (scrollTo) {
        setTimeout(() => {
            const el = document.getElementById(scrollTo);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-[var(--primary-color)]', 'ring-opacity-20');
                setTimeout(() => el.classList.remove('ring-4'), 3000);
            }
        }, 300);
    }
  }, [searchParams]);

  const toggle = async (key: keyof NotificationPrefs) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    setSyncing(true);
    await notificationService.updatePreferences(newSettings);
    setSyncing(false);
  };

  const NotificationItem = ({ id, icon, label, sublabel, enabled }: any) => (
    <div className="flex items-center justify-between p-4 theme-bubble-bg rounded-2xl border theme-border shadow-sm active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 theme-card-bg rounded-xl flex items-center justify-center theme-primary-text border theme-border shadow-inner">
          {icon}
        </div>
        <div className="text-left">
          <p className="font-bold theme-text-main text-sm">{label}</p>
          <p className="text-[10px] theme-text-secondary font-medium tracking-tight">{sublabel}</p>
        </div>
      </div>
      <button 
        onClick={() => toggle(id)}
        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative border ${enabled ? 'theme-primary-bg border-transparent' : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
      </button>
    </div>
  );

  return (
    <div className="theme-card-bg min-h-screen flex flex-col animate-in slide-in-from-right duration-500 pb-32">
      <PageHeader
        title={t('notif_settings.title')}
        onBack={() => navigate('/notifications')}
        rightElement={syncing && <RefreshCw size={16} className="theme-primary-text animate-spin mr-2" />}
        className="sticky top-0 theme-card-bg z-30 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />


      <div className="p-6 space-y-8">
        <section id="notif-channels" className="space-y-4 transition-all duration-500 p-2 rounded-2xl">
          <h3 className="text-[11px] font-black theme-text-secondary uppercase tracking-[0.2em] px-1">{t('notif_settings.channels')}</h3>
          <div className="space-y-3">
            <NotificationItem 
              id="push" 
              icon={<Bell size={20} />} 
              label={t('notif_settings.items.push.label')} 
              sublabel={t('notif_settings.items.push.sub')}
              enabled={settings.push} 
            />
            <NotificationItem 
              id="email" 
              icon={<Mail size={20} />} 
              label={t('notif_settings.items.email.label')} 
              sublabel={t('notif_settings.items.email.sub')}
              enabled={settings.email} 
            />
            <NotificationItem 
              id="sms" 
              icon={<Smartphone size={20} />} 
              label={t('notif_settings.items.sms.label')} 
              sublabel={t('notif_settings.items.sms.sub')}
              enabled={settings.sms} 
            />
          </div>
        </section>

        <section id="notif-categories" className="space-y-4 transition-all duration-500 p-2 rounded-2xl">
          <h3 className="text-[11px] font-black theme-text-secondary uppercase tracking-[0.2em] px-1 pt-4">{t('notif_settings.categories')}</h3>
          <div className="space-y-3">
            <NotificationItem 
              id="security" 
              icon={<AlertCircle size={20} />} 
              label={t('notif_settings.items.security.label')} 
              sublabel={t('notif_settings.items.security.sub')}
              enabled={settings.security} 
            />
            <NotificationItem 
              id="promotions" 
              icon={<Bell size={20} className="opacity-50" />} 
              label={t('notif_settings.items.promo.label')} 
              sublabel={t('notif_settings.items.promo.sub')}
              enabled={settings.promotions} 
            />
          </div>
        </section>

        <div className="p-5 theme-bubble-bg rounded-3xl border border-dashed border-[var(--primary-color)] opacity-70 mt-8">
            <div className="flex gap-3 items-start">
                <Info size={18} className="theme-primary-text shrink-0 mt-0.5" />
                <p className="text-[10px] theme-primary-text font-medium leading-relaxed italic">
                    {t('notif_settings.disclaimer')}
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettings;
