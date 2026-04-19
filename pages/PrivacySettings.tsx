
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Shield, 
  UserX, 
  EyeOff, 
  HelpCircle, 
  Check, 
  Search, 
  X,
  UserCheck,
  Lock,
  UserPlus,
  Info,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/apiService';
import { PrivacySettings as PrivacySettingsType, Contact, getInitials } from '../shared/types';
import { useTranslation } from '../App';
import Button from '../components/Button';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';

const PrivacySettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PrivacySettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modals
  const [helpModal, setHelpModal] = useState<{ title: string; content: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [searchModal, setSearchModal] = useState<{ type: 'requests' | 'transfers' } | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        api.getPrivacySettings(),
        api.getContacts()
      ]);
      setSettings(s);
      setContacts(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (newSettings: Partial<PrivacySettingsType>) => {
    if (!settings) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    setSaving(true);
    try {
      await api.updatePrivacySettings(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleBlockOption = (type: 'requests' | 'transfers', option: string) => {
    if (option === 'specific') {
      setSearchModal({ type });
      return;
    }
    
    const field = type === 'requests' ? 'blockRequestsFrom' : 'blockTransfersFrom';
    updateSetting({ [field]: option });
  };

  const confirmBlock = (tag: string, type: 'requests' | 'transfers') => {
    setConfirmModal({
      title: t('privacy_settings.confirm_block_title'),
      message: t('privacy_settings.confirm_block_msg', { type: type === 'requests' ? 'demandes' : 'transferts', tag }),
      onConfirm: () => {
        if (!settings) return;
        const updatedEntities = [...settings.blockedEntities, tag];
        updateSetting({ blockedEntities: updatedEntities });
        setConfirmModal(null);
        setSearchModal(null);
      }
    });
  };

  if (loading || !settings) {
    return (
      <div className="theme-card-bg min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h3 className="px-6 text-[11px] font-bold theme-text-secondary uppercase tracking-[0.15em] mb-4">{title}</h3>
      <div className="px-2 space-y-1">
        {children}
      </div>
    </div>
  );

  const Option = ({ label, active, onClick, help }: { label: string; active: boolean; onClick: () => void; help?: string }) => (
    <div className="flex items-center gap-2">
      <button 
        onClick={onClick}
        className={`flex-1 flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] ${active ? 'theme-bubble-bg border border-[var(--primary-color)]/20' : 'hover:theme-bubble-bg'}`}
      >
        <span className={`text-sm font-bold ${active ? 'theme-primary-text' : 'theme-text-main'}`}>{label}</span>
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${active ? 'theme-primary-bg border-transparent' : 'theme-border'}`}>
          {active && <Check size={14} className="text-white" />}
        </div>
      </button>
      {help && (
        <button 
          onClick={() => setHelpModal({ title: label, content: help })}
          className="p-3 theme-text-secondary opacity-40 hover:opacity-100 transition-opacity"
        >
          <HelpCircle size={18} />
        </button>
      )}
    </div>
  );

  const Toggle = ({ label, active, onClick, help }: { label: string; active: boolean; onClick: () => void; help?: string }) => (
    <div className="flex items-center gap-2">
      <button 
        onClick={onClick}
        className="flex-1 flex items-center justify-between p-4 rounded-2xl hover:theme-bubble-bg transition-all active:scale-[0.98]"
      >
        <span className="text-sm font-bold theme-text-main">{label}</span>
        <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${active ? 'theme-primary-bg' : 'theme-bubble-bg border theme-border'}`}>
          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </div>
      </button>
      {help && (
        <button 
          onClick={() => setHelpModal({ title: label, content: help })}
          className="p-3 theme-text-secondary opacity-40 hover:opacity-100 transition-opacity"
        >
          <HelpCircle size={18} />
        </button>
      )}
    </div>
  );

  return (
    <div className="theme-card-bg min-h-screen pb-32">
     <PageHeader 
  title={t('privacy_settings.title')}
  onBack={() => navigate(-1)}
  rightElement={
    <>
      {saving && (
        <div className="ml-auto text-[10px] font-bold theme-primary-text animate-pulse uppercase tracking-widest">
          {t('privacy_settings.saving')}
        </div>
      )}
    </>
  }
  className="sticky top-0 theme-card-bg z-20 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
/>


      <div className="animate-in fade-in duration-500 py-6">
        <Section title={t('privacy_settings.requests_section')}>
          <Option 
            label={settings.blockRequestsFrom === 'none' ? t('privacy_settings.allow_everyone') : t('privacy_settings.block_everyone')} 
            active={settings.blockRequestsFrom === 'everyone'} 
            onClick={() => handleBlockOption('requests', settings.blockRequestsFrom === 'everyone' ? 'none' : 'everyone')}
            help={t('privacy_settings.help_requests')}
          />
          <Option 
            label={t('privacy_settings.contacts_only')} 
            active={settings.blockRequestsFrom === 'non_contacts'} 
            onClick={() => handleBlockOption('requests', 'non_contacts')}
            help={t('privacy_settings.help_requests')}
          />
          <Option 
            label={t('privacy_settings.specific_contacts')} 
            active={settings.blockRequestsFrom === 'specific'} 
            onClick={() => handleBlockOption('requests', 'specific')}
          />
        </Section>

        <Section title={t('privacy_settings.transfers_section')}>
          <Option 
            label={settings.blockTransfersFrom === 'none' ? t('privacy_settings.allow_transfers_everyone') : t('privacy_settings.block_transfers_everyone')} 
            active={settings.blockTransfersFrom === 'everyone'} 
            onClick={() => handleBlockOption('transfers', settings.blockTransfersFrom === 'everyone' ? 'none' : 'everyone')}
            help={t('privacy_settings.help_transfers')}
          />
          <Option 
            label={t('privacy_settings.contacts_only')} 
            active={settings.blockTransfersFrom === 'non_contacts'} 
            onClick={() => handleBlockOption('transfers', 'non_contacts')}
          />
          <Option 
            label={t('privacy_settings.specific_contacts')} 
            active={settings.blockTransfersFrom === 'specific'} 
            onClick={() => handleBlockOption('transfers', 'specific')}
          />
        </Section>

        <Section title={t('privacy_settings.visibility_section')}>
          <Option 
            label={t('privacy_settings.visibility_everyone')} 
            active={settings.visibility === 'everyone'} 
            onClick={() => updateSetting({ visibility: 'everyone' })}
          />
          <Option 
            label={t('privacy_settings.visibility_contacts')} 
            active={settings.visibility === 'contacts_only'} 
            onClick={() => updateSetting({ visibility: 'contacts_only' })}
            help={t('privacy_settings.help_visibility_contacts')}
          />
          <Option 
            label={t('privacy_settings.visibility_mutual')} 
            active={settings.visibility === 'mutual_only'} 
            onClick={() => updateSetting({ visibility: 'mutual_only' })}
            help={t('privacy_settings.help_visibility_mutual')}
          />
          <Option 
            label={t('privacy_settings.visibility_private')} 
            active={settings.visibility === 'private'} 
            onClick={() => updateSetting({ visibility: 'private' })}
            help={t('privacy_settings.help_visibility_private')}
          />
        </Section>

        <Section title={t('privacy_settings.others_section')}>
          <Toggle 
            label={t('privacy_settings.anonymous_transfers')} 
            active={settings.allowAnonymousTransfers} 
            onClick={() => updateSetting({ allowAnonymousTransfers: !settings.allowAnonymousTransfers })}
            help={t('privacy_settings.help_anonymous')}
          />
          <Toggle 
            label={t('privacy_settings.hide_tag')} 
            active={settings.hideTagInReceipts} 
            onClick={() => updateSetting({ hideTagInReceipts: !settings.hideTagInReceipts })}
            help={t('privacy_settings.help_hide_tag')}
          />
          <Toggle 
            label={t('privacy_settings.friends_only_requests')} 
            active={settings.requestsOnlyFromFriends} 
            onClick={() => updateSetting({ requestsOnlyFromFriends: !settings.requestsOnlyFromFriends })}
            help={t('privacy_settings.help_friends_only')}
          />
        </Section>
      </div>

      {/* Help Modal */}
      <Modal isOpen={!!helpModal} onClose={() => setHelpModal(null)} type="bottom-sheet">
        {helpModal && (
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3 theme-primary-text">
              <Info size={24} />
              <h3 className="text-xl font-bold theme-text-main">{helpModal.title}</h3>
            </div>
            <p className="theme-text-secondary text-sm leading-relaxed">{helpModal.content}</p>
            <Button
              onClick={() => setHelpModal(null)}
              variant="primary"
              fullWidth
            >
              {t('privacy_settings.got_it')}
            </Button>
          </div>
        )}
      </Modal>

      {/* Confirm Block Modal */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} type="bottom-sheet">
        {confirmModal && (
          <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold theme-text-main">{confirmModal.title}</h3>
              <p className="theme-text-secondary text-sm">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setConfirmModal(null)}
                variant="secondary"
                fullWidth
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={confirmModal.onConfirm}
                variant="danger"
                fullWidth
              >
                {t('common.confirm')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Search/Block Modal */}
      <Modal isOpen={!!searchModal} onClose={() => setSearchModal(null)} type="bottom-sheet">
        {searchModal && (
          <div className="p-8 space-y-6 h-[80vh] flex flex-col">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold theme-text-main">
                {searchModal.type === 'requests' ? t('privacy_settings.block_requests_title') : t('privacy_settings.block_transfers_title')}
              </h3>
              <button onClick={() => setSearchModal(null)} className="p-2 theme-bubble-bg rounded-full theme-text-secondary">
                <X size={20} />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary opacity-40" size={18} />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('privacy_settings.search_block_placeholder')}
                className="w-full theme-bubble-bg p-4 pl-12 rounded-2xl outline-none theme-text-main border theme-border focus:border-[var(--primary-color)]"
              />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
              {contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.tag.toLowerCase().includes(searchTerm.toLowerCase())).map(contact => (
                <button 
                  key={contact.id}
                  onClick={() => confirmBlock(contact.tag, searchModal.type)}
                  className="w-full flex items-center justify-between p-4 theme-bubble-bg rounded-2xl border theme-border hover:border-[var(--primary-color)] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 theme-card-bg rounded-full flex items-center justify-center font-bold theme-primary-text border theme-border">
                      {getInitials(contact.name)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold theme-text-main">{contact.name}</p>
                      <p className="text-[10px] theme-text-secondary">{contact.tag}</p>
                    </div>
                  </div>
                  <UserX size={18} className="text-red-500" />
                </button>
              ))}
              {searchTerm && !contacts.some(c => c.tag === searchTerm) && (
                <button 
                  onClick={() => confirmBlock(searchTerm.startsWith('@') ? searchTerm : '@' + searchTerm, searchModal.type)}
                  className="w-full flex items-center justify-between p-4 border-2 border-dashed theme-border rounded-2xl hover:theme-bubble-bg transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 theme-bubble-bg rounded-full flex items-center justify-center">
                      <Search size={18} className="theme-primary-text" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold theme-text-main">{t('privacy_settings.block_tag_exact', { tag: searchTerm })}</p>
                      <p className="text-[10px] theme-text-secondary">{t('privacy_settings.block_tag_hint')}</p>
                    </div>
                  </div>
                  <UserX size={18} className="text-red-500" />
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PrivacySettings;
