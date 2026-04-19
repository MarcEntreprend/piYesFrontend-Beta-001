
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, CreditCard, Lock, Unlock, Eye, EyeOff, 
  Settings, ChevronRight, X, PlusCircle, 
  Palette, Globe, Shield, RefreshCw, Repeat, ArrowUpRight, 
  PlusSquare, ChevronDown, ChevronUp, Trash2, Clock, Calendar, 
  Loader2, Sparkles, Check, HelpCircle
} from 'lucide-react';
import { api } from '../services/apiService';
import { Card, CardType, CardStatus, Transaction } from '../shared/types';
import { useTranslation } from '../App';
import Modal from '../components/Modal';
import AiSupportChat from '../components/AiSupportChat';
import PageHeader from '../components/PageHeader';

const CardsHub: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showNumbers, setShowNumbers] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [creationStep, setCreationStep] = useState(1);
  const [cardTypeChoice, setCardTypeChoice] = useState<'multi' | '24h' | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#830AD1');
  const [isCreating, setIsCreating] = useState(false);

  const [history, setHistory] = useState<Transaction[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [showSupport, setShowSupport] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await api.getCards();
    setCards(data);
    if (data.length > 0) setSelectedCardId(data[0].id);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCardId) {
        api.getCardTransactions(selectedCardId).then(setHistory);
    }
  }, [selectedCardId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const itemWidth = 280;
    const index = Math.round(scrollLeft / itemWidth);
    setScrollIndex(index);
  };

  const scrollToCard = (id: string, index: number) => {
    setSelectedCardId(id);
    if (scrollRef.current) {
        const offset = (index + 1) * 280;
        scrollRef.current.scrollTo({ left: offset - 20, behavior: 'smooth' });
    }
  };

  const selectedCard = cards.find(c => c.id === selectedCardId);

  const handleToggleFreeze = async () => {
    if (!selectedCardId) return;
    await api.toggleCardFreeze(selectedCardId, !selectedCard?.isFrozen);
    setCards(cards.map(c => c.id === selectedCardId ? { ...c, isFrozen: !c.isFrozen } : c));
  };

  const handleDeleteCard = async () => {
    if (!selectedCardId) return;
    if (confirm("Supprimer définitivement cette carte ?")) {
      await api.deleteCard(selectedCardId);
      const remaining = cards.filter(c => c.id !== selectedCardId);
      setCards(remaining);
      setSelectedCardId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const resetCreation = () => {
    setShowAddModal(false);
    setCreationStep(1);
    setCardTypeChoice(null);
    setNewName('');
    setNewColor('#830AD1');
  };

  const handleCreateVirtualCard = async () => {
    setIsCreating(true);
    const isTemp = cardTypeChoice === '24h';
    const finalName = isTemp ? 'Temp Card' : newName;
    const finalColor = isTemp ? '#1C1C1C' : newColor;
    
    const newCard = await api.createPiyesCard(finalName, CardType.VIRTUAL, finalColor, isTemp);
    setCards([...cards, newCard]);
    setSelectedCardId(newCard.id);
    setCreationStep(4);
    setIsCreating(false);
  };

  const colors = ['#830AD1', '#00C2A8', '#FF6B6B', '#1C1C1C', '#002F6C'];

  return (
    <div className="theme-card-bg min-h-screen pb-24">
      <PageHeader 
  title={t('cards.title')}
  onBack={() => navigate(-1)}
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


      <div className="py-6">
        {loading && cards.length === 0 ? (
          <div className="px-6 space-y-6">
            <div className="h-52 theme-bubble-bg rounded-[32px] shimmer"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 theme-bubble-bg rounded-2xl shimmer"></div>)}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-4">
                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="overflow-x-auto no-scrollbar flex gap-4 px-6 snap-x snap-mandatory pb-4"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex-shrink-0 w-20 h-44 border-2 theme-border border-dashed rounded-[32px] flex items-center justify-center theme-text-secondary active:scale-95 transition-transform snap-center bg-gray-50/50 dark:bg-white/5 group hover:border-[var(--primary-color)] hover:theme-primary-text"
                    >
                        <Plus size={32} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                    </button>

                    {cards.map((card, idx) => (
                    <button 
                        key={card.id}
                        onClick={() => scrollToCard(card.id, idx)}
                        className={`relative flex-shrink-0 w-72 h-44 rounded-[32px] p-6 flex flex-col justify-between transition-all duration-500 transform snap-center ${
                        selectedCardId === card.id ? 'scale-100 shadow-2xl opacity-100 z-10' : 'scale-90 opacity-40 grayscale translate-y-2'
                        }`}
                        style={{ backgroundColor: card.color }}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                             <Sparkles size={120} />
                        </div>

                        <div className="flex justify-between items-start relative z-10">
                            <div className="text-white text-left">
                                <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">
                                  {card.type === 'physical' ? t('cards.labels.physical') : t('cards.labels.virtual')} CARD
                                </p>
                                <p className="font-bold text-sm mt-0.5 truncate max-w-[120px]">{card.nameOnCard}</p>
                            </div>
                            <div className="text-white">
                                {card.brand === 'piyes' ? (
                                    <span className="font-black italic text-lg tracking-tighter">piYès!</span>
                                ) : (
                                    <div className="flex"><div className="w-5 h-5 bg-red-500/80 rounded-full"></div><div className="w-5 h-5 bg-orange-500/80 rounded-full -ml-3"></div></div>
                                )}
                            </div>
                        </div>

                        <div className="text-white text-left space-y-2 relative z-10">
                            <p className="text-xl font-mono tracking-[0.15em]">
                                {showNumbers ? `**** **** **** ${card.lastFour}` : `•••• •••• •••• ${card.lastFour}`}
                            </p>
                            <div className="flex justify-between items-end">
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-[7px] opacity-60 uppercase font-black">{t('cards.labels.valid_thru')}</p>
                                        <p className="text-xs font-bold">{card.expiryDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-[7px] opacity-60 uppercase font-black">{t('cards.labels.cvc')}</p>
                                        <p className="text-xs font-bold">{showNumbers ? card.cvv : '***'}</p>
                                    </div>
                                </div>
                                <div className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">
                                    {t('cards.labels.debit_virtual')}
                                </div>
                            </div>
                        </div>

                        {card.isFrozen && (
                        <div className="absolute inset-0 bg-black/60 rounded-[32px] flex flex-col items-center justify-center backdrop-blur-[2px] z-20 animate-in fade-in duration-300">
                            <Lock size={32} className="text-white opacity-80 mb-2" />
                            <span className="text-white text-[10px] font-bold uppercase tracking-widest">{t('cards.status_frozen')}</span>
                        </div>
                        )}
                    </button>
                    ))}
                </div>

                <div className="flex justify-center gap-2">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${scrollIndex === 0 ? 'theme-primary-bg w-4' : 'bg-gray-300 w-1.5'}`}></div>
                    {cards.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${scrollIndex === i + 1 ? 'theme-primary-bg w-4' : 'bg-gray-300 w-1.5'}`}></div>
                    ))}
                </div>
            </div>

            {selectedCard && (
              <div className="px-6 grid grid-cols-3 gap-3">
                <button onClick={() => setShowNumbers(!showNumbers)} className="flex flex-col items-center gap-2 p-4 rounded-2xl theme-bubble-bg active:scale-95 transition-all border theme-border shadow-sm group">
                  <div className="theme-primary-text group-hover:scale-110 transition-transform">{showNumbers ? <EyeOff size={22} /> : <Eye size={22} />}</div>
                  <span className="text-[10px] font-bold theme-text-main text-center leading-tight">{t('cards.actions.view')}</span>
                </button>
                <button onClick={handleToggleFreeze} className="flex flex-col items-center gap-2 p-4 rounded-2xl theme-bubble-bg active:scale-95 transition-all border theme-border shadow-sm group">
                  <div className="theme-primary-text group-hover:scale-110 transition-transform">{selectedCard.isFrozen ? <Unlock size={22} /> : <Lock size={22} />}</div>
                  <span className="text-[10px] font-bold theme-text-main text-center leading-tight">
                    {selectedCard.isFrozen ? t('cards.actions.unfreeze') : t('cards.actions.freeze')}
                  </span>
                </button>
                <button onClick={handleDeleteCard} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 active:scale-95 transition-all border border-red-100 dark:border-red-900/20 shadow-sm group">
                  <div className="text-red-500 group-hover:scale-110 transition-transform"><Trash2 size={22} /></div>
                  <span className="text-[10px] font-bold text-red-600 text-center leading-tight">{t('cards.actions.delete')}</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-2xl theme-bubble-bg active:scale-95 transition-all border theme-border shadow-sm group">
                  <div className="theme-primary-text group-hover:scale-110 transition-transform"><PlusSquare size={22} /></div>
                  <span className="text-[10px] font-bold theme-text-main text-center leading-tight">{t('cards.actions.add_money')}</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-2xl theme-bubble-bg active:scale-95 transition-all border theme-border shadow-sm group" onClick={() => navigate('/transfer')}>
                  <div className="theme-primary-text group-hover:scale-110 transition-transform"><ArrowUpRight size={22} /></div>
                  <span className="text-[10px] font-bold theme-text-main text-center leading-tight">{t('cards.actions.transfer')}</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-2xl theme-bubble-bg active:scale-95 transition-all border theme-border shadow-sm group">
                  <div className="theme-primary-text group-hover:scale-110 transition-transform"><Settings size={22} /></div>
                  <span className="text-[10px] font-bold theme-text-main text-center leading-tight">{t('cards.actions.config')}</span>
                </button>
              </div>
            )}

            {selectedCard && (
                <div className="px-6 space-y-2 border-t theme-border pt-6">
                    <button onClick={() => setIsDetailsOpen(!isDetailsOpen)} className="w-full flex justify-between items-center py-2">
                        <h3 className="text-xs font-bold theme-text-secondary uppercase tracking-[0.2em]">{t('cards.details.title')}</h3>
                        {isDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {isDetailsOpen && (
                        <div className="space-y-4 p-5 theme-bubble-bg rounded-[24px] border theme-border animate-in slide-in-from-top duration-300">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] theme-text-secondary font-bold uppercase">{t('cards.details.number')}</span>
                                <span className="text-sm font-mono theme-text-main font-bold tracking-widest">**** **** **** {selectedCard.lastFour}</span>
                            </div>
                            {selectedCard.isFrozen && (
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] theme-text-secondary font-bold uppercase">{t('receipt.status_label')}</span>
                                    <span className="text-xs font-bold text-red-500 uppercase">{t('cards.status_frozen')}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] theme-text-secondary font-bold uppercase">{t('cards.details.holder')}</span>
                                <span className="text-sm theme-text-main font-bold">{selectedCard.nameOnCard}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] theme-text-secondary font-bold uppercase">{t('cards.details.expiry')}</span>
                                <span className="text-sm theme-text-main font-bold">{selectedCard.expiryDate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] theme-text-secondary font-bold uppercase">{t('cards.details.type')}</span>
                                <span className="text-sm theme-text-main font-bold capitalize">
                                  {selectedCard.type === 'physical' ? t('cards.labels.physical') : t('cards.labels.virtual')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={resetCreation}>
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold theme-text-main">{t('cards.add_card')}</h3>
            <button onClick={resetCreation} className="p-2 theme-bubble-bg rounded-full theme-text-secondary"><X /></button>
          </div>
          
          {creationStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="font-bold theme-text-main">{t('cards.card_type')}</p>
                <p className="text-xs theme-text-secondary">{t('cards.card_usage')}</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => { setCardTypeChoice('multi'); setCreationStep(2); }} className="flex items-center justify-between p-5 theme-bubble-bg rounded-[32px] border theme-border active:scale-[0.98] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 theme-primary-bg text-white rounded-2xl flex items-center justify-center shadow-lg"><PlusCircle /></div>
                    <div className="text-left">
                      <p className="font-bold theme-text-main text-sm">{t('cards.multi_use')}</p>
                      <p className="text-[10px] theme-text-secondary">{t('cards.multi_use_desc')}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="theme-text-secondary opacity-30" />
                </button>
                <button onClick={() => { setCardTypeChoice('24h'); handleCreateVirtualCard(); }} className="flex items-center justify-between p-5 theme-bubble-bg rounded-[32px] border theme-border active:scale-[0.98] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg"><Clock /></div>
                    <div className="text-left">
                      <p className="font-bold theme-text-main text-sm">{t('cards.temp_use')}</p>
                      <p className="text-[10px] theme-text-secondary">{t('cards.temp_use_desc')}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="theme-text-secondary opacity-30" />
                </button>
              </div>
            </div>
          )}

          {creationStep === 4 && (
            <div className="flex flex-col items-center py-10 space-y-6">
              <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl animate-bounce"><Check size={40} /></div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold theme-text-main">Carte créée !</h3>
                <p className="text-xs theme-text-secondary">Votre nouvelle carte virtuelle est prête à l'emploi.</p>
              </div>
              <button onClick={resetCreation} className="w-full theme-primary-bg text-white py-4 rounded-full font-bold">Terminer</button>
            </div>
          )}
        </div>
      </Modal>
      <AiSupportChat isOpen={showSupport} onClose={() => setShowSupport(false)} context="Cartes" />
    </div>
  );
};

export default CardsHub;
