
export interface SearchResult {
  id: string;
  title: string;
  category: string;
  route: string;
  keywords: string[];
  iconName: string;
  tab?: string;
  anchor?: string;
}

/**
 * Normalise un texte en supprimant les accents et en passant en minuscules
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "");
};

/**
 * Récupère l'historique des recherches
 */
export const getRecentSearches = (): string[] => {
  const saved = localStorage.getItem('piyes-recent-searches');
  return saved ? JSON.parse(saved) : [];
};

/**
 * Enregistre une recherche dans l'historique local
 */
export const saveRecentSearch = (query: string) => {
  if (!query || !query.trim()) return;
  const recent = getRecentSearches();
  const next = [query.trim(), ...recent.filter(q => q !== query.trim())].slice(0, 5);
  localStorage.setItem('piyes-recent-searches', JSON.stringify(next));
};

export const getSearchIndex = (t: (key: string, params?: any) => string): SearchResult[] => {
  return [
    // --- DASHBOARD SECTIONS ---
    { id: 'db-recent', title: t('dashboard.recent_history'), category: 'Dashboard', route: '/', anchor: 'recent-history', keywords: ['derniere tranzaksyon', 'istwa', 'mouvman', 'relevé', 'transactions'], iconName: 'History' },
    { id: 'db-contacts', title: t('dashboard.transfer_again'), category: 'Dashboard', route: '/', anchor: 'transfer-again', keywords: ['zanmi', 'contacts recents', 'vire anko', 're-vire'], iconName: 'Users' },

    // --- PIYES QUICK ACTIONS ---
    { id: 'q-transfer', title: t('actions.transfer'), category: 'piYès', route: '/transfer', keywords: ['vire', 'voye', 'kòb', 'kob', 'lajan', 'money', 'send', 'pay', 'payer', 'virement'], iconName: 'ArrowUpRight' },
    { id: 'q-intl', title: t('actions.international'), category: 'piYès', route: '/international-transfer', keywords: ['etrange', 'foreign', 'western', 'dola', 'canada', 'usa', 'france', 'chili', 'vire deyò', 'vire deyo'], iconName: 'Globe2' },
    { id: 'q-deposit', title: t('actions.deposit'), category: 'piYès', route: '/deposit', keywords: ['ajouter', 'depoze', 'add', 'cash in', 'kòb', 'kob', 'lajan', 'recharge', 'recharger'], iconName: 'Plus' },
    { id: 'q-receive', title: t('actions.receive'), category: 'piYès', route: '/request-payment', keywords: ['demander', 'resevwa', 'qr', 'collect', 'mande', 'recevoir', 'get paid', 'paie'], iconName: 'QrCode' },
    { id: 'q-withdraw', title: t('actions.withdraw'), category: 'piYès', route: '/withdraw', keywords: ['retirer', 'retire', 'cash out', 'atm', 'ajan', 'agent', 'lajan kach', 'kach'], iconName: 'ArrowDownLeft' },
    { id: 'q-cards', title: t('actions.cards'), category: 'piYès', route: '/cards', keywords: ['carte', 'vityèl', 'fizik', 'credit', 'debit', 'kat', 'virtual', 'mastercard', 'visa'], iconName: 'CreditCard' },
    { id: 'q-pix', title: t('actions.qr_proximity'), category: 'piYès', route: '/keys', keywords: ['clés', 'kle', 'qr', 'scan', 'proximité', 'code', 'kod'], iconName: 'LayoutGrid' },
    { id: 'q-tools', title: t('actions.tools'), category: 'piYès', route: '/tools', keywords: ['calculatrice', 'zouti', 'finance', 'kalkilatris', 'calculator', 'comptable'], iconName: 'Wrench' },
    { id: 'q-promos', title: t('actions.promotions'), category: 'piYès', route: '/promotions', keywords: ['bonus', 'cadeau', 'pwen', 'points', 'gagne', 'ganyen', 'gift', 'offre', 'of'], iconName: 'Gift' },

    // --- OTHER BANKS ---
    { id: 'buh-hist', title: 'BUH / ' + t('actions.history'), category: 'Banque BUH', route: '/bank-history/acc2', keywords: ['buh', 'releve', 'tranzaksyon', 'istwa', 'historique'], iconName: 'History' },
    { id: 'buh-dep', title: 'BUH / ' + t('actions.deposit'), category: 'Banque BUH', route: '/inter-bank-transfer?bank=acc2&mode=deposit', keywords: ['buh', 'depoze', 'vire', 'deposer', 'depot'], iconName: 'Plus' },
    
    { id: 'mc-hist', title: 'MonCash / ' + t('actions.history'), category: 'MonCash', route: '/bank-history/acc3', keywords: ['moncash', 'digicel', 'releve', 'istwa', 'historique'], iconName: 'History' },
    { id: 'mc-dep', title: 'MonCash / ' + t('actions.deposit'), category: 'MonCash', route: '/inter-bank-transfer?bank=acc3&mode=deposit', keywords: ['moncash', 'recharge', 'chaje', 'depot', 'depoze'], iconName: 'Plus' },

    // --- SETTINGS / PROFIL HUB SECTIONS ---
    { id: 'set-ident', title: t('settings.items.profile.label'), category: 'Compte', route: '/profile', anchor: 'profile-main', keywords: ['gerer le profil', 'jere pwofil', 'avatar', 'modifier photo', 'mwen'], iconName: 'User' },
    { id: 'hub-personal', title: t('profile_hub.sections.personal'), category: 'Hub Identitaire', route: '/profile', anchor: 'personal-info', keywords: ['nom', 'date de naissance', 'email', 'telephone', 'adresse', 'enfomasyon pèsonèl'], iconName: 'FileUser' },
    { id: 'hub-identity', title: t('profile_hub.sections.identity'), category: 'Hub Identitaire', route: '/profile', anchor: 'identity-docs', keywords: ['nationalite', 'id', 'nif', 'matricule fiscal', 'citoyennete', 'kyc'], iconName: 'ShieldCheck' },
    { id: 'hub-prefs', title: t('profile_hub.sections.prefs'), category: 'Hub Identitaire', route: '/profile', anchor: 'account-prefs', keywords: ['langue', 'fuseau horaire', 'preferences', 'timezone'], iconName: 'Globe' },
    { id: 'hub-security', title: t('profile_hub.sections.security'), category: 'Hub Identitaire', route: '/profile', anchor: 'security-hub', keywords: ['sessions', 'historique connexion', 'deconnexion partout', 'sekirite'], iconName: 'Shield' },

    // --- SECURITY PAGE SECTIONS ---
    { id: 'sec-mfa', title: t('security.mfa_section'), category: 'Sécurité', route: '/security', anchor: 'sec-mfa', keywords: ['authentification forte', 'double facteur', 'mfa', 'protection', 'verification'], iconName: 'Fingerprint' },
    { id: 'sec-pin', title: t('security.pin_label'), category: 'Sécurité', route: '/security', anchor: 'sec-pin', keywords: ['code pin', 'modifier pin', 'mot de passe', 'verrouillage', 'code secret'], iconName: 'Lock' },
    { id: 'sec-totp', title: t('security.totp_section'), category: 'Sécurité', route: '/security', anchor: 'sec-totp', keywords: ['google authenticator', 'authy', 'application', 'code 6 chiffres', 'totp'], iconName: 'Key' },

    // --- NOTIFICATIONS SETTINGS SECTIONS ---
    { id: 'notif-channels', title: t('notif_settings.channels'), category: 'Notifications', route: '/notifications/settings', anchor: 'notif-channels', keywords: ['canaux', 'push', 'email', 'sms', 'reception'], iconName: 'Rss' },
    { id: 'notif-categories', title: t('notif_settings.categories'), category: 'Notifications', route: '/notifications/settings', anchor: 'notif-categories', keywords: ['alertes', 'securite compte', 'offres', 'promotions', 'actualites'], iconName: 'Layers' },

    // --- GENERAL PREFERENCES (SETTINGS PAGE) ---
    { id: 'set-lang', title: t('settings.language'), category: 'Préférences', route: '/settings', anchor: 'set-lang', keywords: ['langue', 'lang', 'kreyol', 'francais', 'english', 'parler', 'pale'], iconName: 'Globe' },
    { id: 'set-theme', title: t('settings.theme'), category: 'Préférences', route: '/settings', anchor: 'set-theme', keywords: ['theme', 'sombre', 'noir', 'couleur', 'nuit', 'dark', 'light', 'apparence'], iconName: 'Palette' },
    { id: 'set-font-size', title: t('settings.font_size'), category: 'Préférences', route: '/settings', anchor: 'set-font-size', keywords: ['taille', 'police', 'texte', 'agrandir', 'reduire', 'lisibilite', 'font size', 'zoom', 'lecture', 'let', 'gwose'], iconName: 'Type' },
    { id: 'set-receipt', title: t('settings.items.verify_receipt.label'), category: 'Préférences', route: '/verification', anchor: 'set-verify', keywords: ['recu', 'resi', 'verifye', 'authentique', 'vrai', 'faux'], iconName: 'Search' },

    // --- SUPPORT & HELP ---
    { id: 'set-help', title: t('settings.items.help.label'), category: 'Support & Aide', route: '/help', anchor: 'set-help', keywords: ['centre d\'aide', 'sant ed', 'aide', 'faq', 'questions'], iconName: 'HelpCircle' },
    { id: 'set-support', title: t('settings.items.contact.label'), category: 'Support & Aide', route: '/support', anchor: 'set-support', keywords: ['contacter le support', 'asistans', 'sipò', 'agent', 'chat', 'contact'], iconName: 'Headphones' },

    // --- BOUTIQUE SECTIONS ---
    { id: 'btq-home', title: t('boutique.tabs.home'), category: 'Boutique', route: '/services', tab: 'home', keywords: ['marché', 'mache', 'boutik', 'accueil boutique'], iconName: 'ShoppingBag' },
    { id: 'btq-trending', title: t('boutique.sections.trending'), category: 'Boutique', route: '/services', tab: 'home', anchor: 'btq-trending', keywords: ['tendance', 'decouvrir', 'populaire', 'en vogue'], iconName: 'Sparkles' },
    { id: 'btq-latest', title: t('boutique.sections.latest'), category: 'Boutique', route: '/services', tab: 'home', anchor: 'btq-latest', keywords: ['dernières annonces', 'nouveautés', 'liste'], iconName: 'Package' },
    { id: 'btq-ads', title: t('boutique.tabs.my_ads'), category: 'Boutique', route: '/services', tab: 'my_ads', keywords: ['mes annonces', 'vendre', 'poste', 'jere anons'], iconName: 'Tag' },
    { id: 'btq-msg', title: t('boutique.tabs.messages'), category: 'Boutique', route: '/services', tab: 'messages', keywords: ['chat', 'vendeur', 'mesaj', 'pale ak moun'], iconName: 'MessageSquare' },
    { id: 'btq-notif', title: t('boutique.tabs.notifications'), category: 'Boutique', route: '/notifications', keywords: ['alertes boutique', 'notifikasyon'], iconName: 'Bell' },

    // --- LEGAL & APP INFO ---
    { id: 'set-about', title: t('settings.items.about.label'), category: 'Informations App', route: '/about', anchor: 'set-about', keywords: ['version', 'build', 'version 1.2.0', 'about'], iconName: 'Info' },
    { id: 'set-terms', title: t('settings.items.terms.label'), category: 'Informations App', route: '/terms', anchor: 'set-terms', keywords: ['conditions generales', 'termes', 'legal', 'terms'], iconName: 'FileText' },
    { id: 'set-logout', title: t('settings.logout'), category: 'Session', route: '/settings', anchor: 'set-logout', keywords: ['deconnexion', 'soti', 'kitte', 'logout', 'exit'], iconName: 'LogOut' }
  ];
};

export const searchInIndex = (query: string, index: SearchResult[]): SearchResult[] => {
  if (!query.trim()) return [];
  const q = normalizeText(query);
  
  return index.filter(item => {
    const titleMatch = normalizeText(item.title).includes(q);
    const categoryMatch = normalizeText(item.category).includes(q);
    const keywordMatch = item.keywords.some(k => normalizeText(k).includes(q));
    return titleMatch || categoryMatch || keywordMatch;
  }).slice(0, 10);
};
