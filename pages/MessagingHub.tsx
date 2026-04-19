
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, MoreVertical, Smartphone, ShoppingBag, UserCircle, ChevronRight, Tag } from 'lucide-react';
import { Conversation } from '../shared/types';
import { useTranslation } from '../App';
import { messagingService } from '../services/messagingService';

interface MessagingHubProps {
  isTab?: boolean;
}

const MessagingHub: React.FC<MessagingHubProps> = ({ isTab = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    messagingService.getConversations().then(data => {
      setConversations(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return conversations.filter(c => 
        c.counterparty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.adTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  return (
    <div className={`flex flex-col animate-in fade-in duration-500 ${isTab ? '' : 'min-h-screen theme-card-bg pb-32'}`}>
      {!isTab && (
        <header className="px-6 pt-12 pb-4 theme-card-bg border-b theme-border flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 theme-text-secondary active:scale-90 transition-transform">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold theme-text-main">{t('boutique.tabs.messages')}</h1>
          </div>
          <button className="p-2 theme-text-secondary hover:theme-bubble-bg rounded-full transition-colors">
            <MoreVertical size={24} />
          </button>
        </header>
      )}

      <div className="p-6">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary opacity-40" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom ou annonce..."
            className="w-full theme-bubble-bg py-4 pl-12 pr-4 rounded-[24px] outline-none theme-text-main text-sm border theme-border focus:theme-card-bg focus:shadow-md transition-all shadow-sm"
          />
        </div>

        {loading ? (
            <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 theme-bubble-bg rounded-[32px] shimmer"></div>)}
            </div>
        ) : (
            <div className="space-y-2">
            {filtered.map(chat => (
                <div 
                key={chat.id} 
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="p-5 flex gap-5 hover:theme-bubble-bg transition-all cursor-pointer group rounded-[32px] relative border theme-border shadow-sm active:scale-[0.98]"
                >
                <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 theme-border group-active:scale-95 transition-transform theme-bubble-bg shadow-sm">
                    <img src={chat.counterparty.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl border-2 border-white dark:border-gray-800 overflow-hidden shadow-md">
                    <img src={chat.adImage} alt="" className="w-full h-full object-cover" />
                    </div>
                </div>
                
                <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-black theme-text-main text-sm truncate">{chat.counterparty.name}</h4>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0 ${chat.role === 'seller' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                {chat.role === 'seller' ? 'Ma Vente' : 'Mon Achat'}
                            </span>
                        </div>
                        <span className="text-[10px] font-bold theme-text-secondary uppercase shrink-0">{chat.lastTime}</span>
                    </div>
                    <p className="text-[9px] font-black theme-primary-text uppercase tracking-[0.1em] truncate opacity-80">{chat.adTitle}</p>
                    <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'theme-text-main font-black' : 'theme-text-secondary opacity-60'}`}>
                    {chat.lastMessage}
                    </p>
                </div>

                {chat.unreadCount > 0 && (
                    <div className="flex items-center">
                        <div className="w-5 h-5 theme-primary-bg text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                            {chat.unreadCount}
                        </div>
                    </div>
                )}
                </div>
            ))}

            {filtered.length === 0 && (
                <div className="py-20 text-center space-y-4 opacity-30 flex flex-col items-center">
                    <div className="w-20 h-20 theme-bubble-bg rounded-full flex items-center justify-center">
                        <Smartphone size={40} strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-bold">Aucune conversation trouvée.</p>
                </div>
            )}
            </div>
        )}
      </div>

      {!isTab && (
          <button className="fixed bottom-28 right-6 w-16 h-16 theme-primary-bg text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white dark:border-gray-900 shadow-xl">
              <Plus size={32} strokeWidth={2.5} />
          </button>
      )}
    </div>
  );
};

export default MessagingHub;
