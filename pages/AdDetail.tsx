
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Share2, Heart, MoreVertical, MapPin, 
  Clock, ShieldCheck, Phone, MessageSquare, CreditCard, 
  ShieldAlert, ChevronRight, Info, Star, Bookmark,
  HardDrive, Palette, Calendar
} from 'lucide-react';
import { useTranslation } from '../App';

const AdDetail: React.FC = () => {
  const { t, language } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(() => {
    const saved = localStorage.getItem('piyes-favorites');
    if (saved && id) {
      const favs = JSON.parse(saved);
      return favs.includes(id);
    }
    return false;
  });
  const [showMenu, setShowMenu] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const ad = {
    id: id || 'ad1',
    title: 'iPhone 15 Pro Max',
    description: 'État neuf, batterie 100%, 512GB. Facture fournie. Vendu avec coque de protection et verre trempé déjà posé. Pas de rayures, toujours utilisé avec soin.',
    price: 185000,
    location: 'Pétion-Ville, Haïti',
    category: 'Électronique',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1695048133230-019672688756?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1695048133222-1a20484d2569?w=800&h=800&fit=crop'
    ],
    rating: 4.9,
    date: '10 Mars 2025',
    seller: { 
      id: 's1', 
      name: 'Ronald Richards', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ronald', 
      acceptsPiyes: true, 
      phone: '+509 3744-1122',
      memberSince: '2023'
    },
    specs: [
      { label: t('ad_detail.specs.storage'), value: '512GB', icon: <HardDrive size={18} /> },
      { label: t('ad_detail.specs.color'), value: 'Titane', icon: <Palette size={18} /> },
      { label: t('ad_detail.specs.year'), value: '2024', icon: <Calendar size={18} /> }
    ]
  };

  const startInterval = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setCurrentImgIndex(prev => (prev + 1) % ad.images.length);
    }, 4000);
  };

  useEffect(() => {
    startInterval();
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const toggleFavorite = () => {
    const saved = localStorage.getItem('piyes-favorites');
    let favs = saved ? JSON.parse(saved) : [];
    if (isFavorite) {
      favs = favs.filter((fid: string) => fid !== ad.id);
    } else {
      favs.push(ad.id);
    }
    localStorage.setItem('piyes-favorites', JSON.stringify(favs));
    setIsFavorite(!isFavorite);
  };

  return (
    <div className="theme-card-bg min-h-screen pb-32 flex flex-col animate-in slide-in-from-right duration-400">
      <header className="px-6 pt-12 pb-4 fixed top-0 w-full z-50 flex justify-between items-center pointer-events-none">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-black/30 backdrop-blur-md text-white rounded-full pointer-events-auto active:scale-90 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2 pointer-events-auto">
            <button className="p-3 bg-black/30 backdrop-blur-md text-white rounded-full active:scale-90"><Share2 size={22} /></button>
            <button onClick={() => setShowMenu(!showMenu)} className="p-3 bg-black/30 backdrop-blur-md text-white rounded-full active:scale-90"><MoreVertical size={22} /></button>
        </div>
      </header>

      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
        <div className="flex h-full transition-transform duration-700" style={{ transform: `translateX(-${currentImgIndex * 100}%)` }}>
          {ad.images.map((img, idx) => (<img key={idx} src={img} className="w-full h-full object-cover flex-shrink-0" />))}
        </div>
        <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-6 py-3 rounded-[24px] shadow-2xl border border-white/20">
           <span className="text-2xl font-black theme-primary-text">{ad.price.toLocaleString('fr-HT')} {t('currency.symbol')}</span>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="space-y-2">
            <div className="flex justify-between items-start gap-4">
                <h1 className="text-2xl font-black theme-text-main leading-tight">{ad.title}</h1>
                <button onClick={toggleFavorite} className={`p-3 rounded-full ${isFavorite ? 'bg-red-50 text-red-500' : 'theme-bubble-bg text-secondary'}`}>
                    <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-1.5 text-[10px] font-bold theme-text-secondary uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                    <MapPin size={14} className="theme-primary-text" /> {ad.location}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold theme-text-secondary uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                    <Clock size={14} className="theme-primary-text" /> {t('ad_detail.published_on', { date: ad.date })}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
            {ad.specs.map((spec, i) => (
                <div key={i} className="p-4 theme-bubble-bg border theme-border rounded-[24px] flex flex-col items-center gap-2 text-center group">
                    <div className="theme-primary-text opacity-70">{spec.icon}</div>
                    <div className="space-y-0.5">
                        <p className="text-[8px] font-black theme-text-secondary uppercase tracking-tighter">{spec.label}</p>
                        <p className="text-[10px] font-bold theme-text-main">{spec.value}</p>
                    </div>
                </div>
            ))}
        </div>

        <div className="space-y-3">
            <h3 className="text-[11px] font-black theme-text-secondary uppercase tracking-[0.2em] px-1">Description</h3>
            <p className="text-sm theme-text-main leading-relaxed opacity-80 bg-gray-50/50 dark:bg-white/5 p-6 rounded-[32px] border theme-border">
                {ad.description}
            </p>
        </div>

        <div className="p-6 theme-bubble-bg rounded-[40px] border theme-border flex items-center gap-5">
            <div className="w-16 h-16 rounded-[24px] border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden shrink-0">
                <img src={ad.seller.avatar} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                    <p className="font-black theme-text-main text-sm">{ad.seller.name}</p>
                    {ad.seller.acceptsPiyes && <ShieldCheck size={16} className="text-blue-500" />}
                </div>
                <div className="flex items-center gap-1.5">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold theme-text-main">{ad.rating}</span>
                    <span className="text-[10px] theme-text-secondary opacity-50">• {t('ad_detail.member_since', { year: ad.seller.memberSince })}</span>
                </div>
            </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-[11px] font-black theme-text-secondary uppercase tracking-[0.2em]">{t('boutique.reviews.title')}</h3>
                <div className="flex items-center gap-1.5">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span className="text-sm font-black theme-text-main">{ad.rating}</span>
                    <span className="text-[10px] theme-text-secondary font-bold">(12 avis)</span>
                </div>
            </div>

            <div className="space-y-4">
                {[
                    { id: 1, user: 'Jean Marc', rating: 5, comment: 'Excellent produit, conforme à la description. Vendeur très sérieux.', date: 'Il y a 2 jours', verified: true },
                    { id: 2, user: 'Marie L.', rating: 4, comment: 'Très satisfaite de mon achat. Livraison rapide.', date: 'Il y a 1 semaine', verified: true },
                ].map(review => (
                    <div key={review.id} className="p-6 theme-card-bg border theme-border rounded-[32px] space-y-3 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black theme-text-main border theme-border">
                                    {review.user[0]}
                                </div>
                                <div>
                                    <p className="text-xs font-bold theme-text-main">{review.user}</p>
                                    <p className="text-[9px] theme-text-secondary font-medium">{review.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={10} className={i < review.rating ? "text-amber-500 fill-amber-500" : "text-gray-300 dark:text-gray-700"} />
                                ))}
                            </div>
                        </div>
                        <p className="text-xs theme-text-main leading-relaxed opacity-80">{review.comment}</p>
                        {review.verified && (
                            <div className="flex items-center gap-1.5 text-[8px] font-black text-green-600 uppercase tracking-widest bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full w-fit">
                                <ShieldCheck size={10} /> {t('boutique.reviews.verified_purchase')}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button className="w-full py-5 theme-bubble-bg border theme-border rounded-[24px] text-[10px] font-black theme-text-secondary uppercase tracking-[0.2em] active:scale-95 transition-all">
                {t('boutique.reviews.leave_review')}
            </button>
            <p className="text-[9px] text-center theme-text-secondary font-medium italic opacity-50">
                {t('boutique.reviews.only_buyers')}
            </p>
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md theme-card-bg border-t theme-border p-6 pb-10 z-[60] flex gap-4">
            <button onClick={() => navigate(`/chat/${ad.id}`)} className="flex-1 flex items-center justify-center gap-3 theme-bubble-bg theme-primary-text py-5 rounded-[24px] font-black text-xs active:scale-95 border theme-border">
                <MessageSquare size={20} /> {t('ad_detail.footer.contact')}
            </button>
            {ad.seller.acceptsPiyes ? (
                <button onClick={() => navigate(`/transfer?name=${encodeURIComponent(ad.title)}&amount=${ad.price}`)} className="flex-1 flex items-center justify-center gap-3 theme-primary-bg text-white py-5 rounded-[24px] font-black text-xs active:scale-95 shadow-xl">
                    <CreditCard size={20} /> {t('ad_detail.footer.pay')}
                </button>
            ) : (
                <button onClick={() => window.location.href = `tel:${ad.seller.phone}`} className="flex-1 flex items-center justify-center gap-3 bg-gray-900 text-white py-5 rounded-[24px] font-black text-xs active:scale-95 shadow-xl">
                    <Phone size={20} /> {t('ad_detail.footer.call')}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdDetail;
