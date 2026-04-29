// pages/Contacts.tsx

import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { http } from "../services/httpClient";
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  X,
  CheckCircle,
  Send,
  ArrowDownLeft,
  Share2,
  Phone,
  Mail,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Shield,
  Star,
  Briefcase,
  MapPin,
  RefreshCw,
  UserPlus as UserPlusIcon,
  UserMinus,
  Clock,
  Smartphone,
  AlertCircle,
} from "lucide-react";
import { api } from "../services/apiService";
import {
  Contact,
  getInitials,
  Friendship,
  FriendshipStatus,
  User,
} from "../shared/types";
import { useTranslation } from "../App";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ContactItem, ContactSection } from "@/components/ContactComponents";
import { ContactSearch } from "@/components/ContactSearch";
import PageHeader from "../components/PageHeader";
import { formatPhoneDisplay } from "../shared/phoneFormatter";
import {
  getMatchedNativeContacts,
  getCachedNativeContacts,
  clearNativeContactsCache,
  NativeContact
} from "../services/nativeContactsService";
import { Capacitor } from '@capacitor/core';
import { cacheService } from "../services/cacheService";

interface ContactsProps {
  user?: User | null;
}

const Contacts: React.FC<ContactsProps> = ({ user }) => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [quickActionContact, setQuickActionContact] = useState<Contact | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Contact | null>(
    null,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [highlightFriendship, setHighlightFriendship] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleImportFromPhone = async () => {
    // Show the native contacts modal
    setShowNativeContactsModal(true);
    // If no contacts loaded yet, trigger a fetch
    if (nativeAppContacts.length === 0) {
      setLoadingNative(true);
      try {
        const contacts = await getMatchedNativeContacts((msg) => {
          console.log('[ImportFromPhone]', msg);
        }, true);  // forceRefresh = true
        setNativeAppContacts(contacts);
      } catch (e) {
        console.error('handleImportFromPhone error:', e);
      }
      setLoadingNative(false);
    }
  };

  // Add Contact state
  const [newName, setNewName] = useState("");
  const [newInfo, setNewInfo] = useState("");

  const [newContactIsUser, setNewContactIsUser] = useState<boolean | null>(
    null,
  ); // null=pas encore vérifié, true=user trouvé, false=pas user
  const [checkingNewContact, setCheckingNewContact] = useState(false);

  const [nativeAppContacts, setNativeAppContacts] = useState<NativeContact[]>([]);
  const [loadingNative, setLoadingNative] = useState(false);
  const [showNativeContactsModal, setShowNativeContactsModal] = useState(false);

  //  state pour le modal de confirmation avertissement lors de sauvegarde de contact non-user
  const [showNonUserModal, setShowNonUserModal] = useState(false);
  const [pendingContactSave, setPendingContactSave] = useState<{
    name: string;
    info: string;
  } | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const getPriorityKey = (contact: Contact | Partial<Contact>) => {
    if (contact.tag) return `@${contact.tag.replace(/^@/, "")}`;
    if (contact.email) return contact.email;
    if (contact.phone) return `+${contact.phone.replace(/^\+/, "")}`;
    if (contact.randomKey) return contact.randomKey;
    return contact.name || "";
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    if (!contacts.length) return;
    const params = new URLSearchParams(location.search);
    const openContactId = params.get("openContact");
    if (openContactId) {
      // Naviguer vers la page contact avec surbrillance amitié
      navigate(`/contact-detail/${openContactId}?highlight=friendship`);
    }
  }, [contacts, location.search]);

  const fetchData = async (background: boolean = false) => {
    // Récupérer le cache (asynchrone mais rapide)
    const cachedContacts = await api.getContacts();
    const hasCache = cachedContacts.length > 0;

    if (!background && !hasCache) {
      setLoading(true);
    }

    // 1. Afficher le cache immédiatement
    if (hasCache) {
      setContacts(cachedContacts);
      const cachedSync = cacheService.get("sync");
      if (cachedSync?.friendships) {
        setFriendships(cachedSync.friendships);
      }
    }

    // 2. Rafraîchir en arrière-plan ou premier chargement
    try {
      const [contactsData, syncData] = await Promise.all([
        api.getContactsFresh(),
        api.syncFresh(),
      ]);
      setContacts(contactsData);
      setFriendships(syncData.friendships || []);
      if (!background || !hasCache) {
        setLoading(false);
      }
    } catch (error) {
      console.error(t("contacts.errors.fetch_failed"), error);
      setLoading(false);
    }

    // 3. Contacts natifs
    const cachedNative = getCachedNativeContacts();
    if (cachedNative && cachedNative.length > 0) {
      setNativeAppContacts(cachedNative);
    }
    if (!background) {
      setLoadingNative(true);
      try {
        const nativeContacts = await getMatchedNativeContacts();
        setNativeAppContacts(nativeContacts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingNative(false);
      }
    } else {
      getMatchedNativeContacts().then(setNativeAppContacts).catch(console.error);
    }
  };

  const handleAddContact = async (force = false) => {
    if (!newName.trim()) return;

    // Si info fournie et pas encore vérifié → vérifier d'abord
    if (newInfo.trim() && newContactIsUser === null && !force) {
      setCheckingNewContact(true);
      try {
        await api.resolveRecipient(newInfo.trim());
        setNewContactIsUser(true);
        // User trouvé → save directement
      } catch (e: any) {
        const isUserBlocked = e?.status === 403;
        setNewContactIsUser(isUserBlocked ? true : false);
        setCheckingNewContact(false);
        if (!isUserBlocked) {
          // Pas un user → montrer le modal d'avertissement
          setPendingContactSave({ name: newName.trim(), info: newInfo.trim() });
          setShowNonUserModal(true);
          return;
        }
      }
      setCheckingNewContact(false);
    }

    // Si le contact n'est pas un user et pas encore confirmé → montrer le modal
    if (newContactIsUser === false && !force) {
      setPendingContactSave({ name: newName.trim(), info: newInfo.trim() });
      setShowNonUserModal(true);
      return;
    }

    // Procéder à la sauvegarde
    setLoading(true);
    try {
      const response = await http.post<any[]>("/contacts/sync", {
        contacts: [{ name: newName.trim(), info: newInfo.trim() }],
      });
      if (response && response[0]) {
        const newContact = response[0];
        setContacts((prev) => [newContact, ...prev]);
        setShowAddModal(false);
        setShowNonUserModal(false);
        setNewName("");
        setNewInfo("");
        setNewContactIsUser(null);
        setPendingContactSave(null);
        setTimeout(() => navigate(`/contact-detail/${newContact.id}`), 150);
      } else {
        alert(t("contacts.add_error"));
      }
    } catch (e: any) {
      console.error("Add contact error:", e);
      alert(e?.message || t("common.error"));
    }
    setLoading(false);
  };

  // Vérifier si la clé entrée correspond à un user existant (pour feedback rouge/vert)
  const handleCheckNewInfo = async () => {
    if (!newInfo.trim()) {
      setNewContactIsUser(null);
      return;
    }
    setCheckingNewContact(true);
    try {
      await api.resolveRecipient(newInfo.trim());
      setNewContactIsUser(true);
    } catch (e: any) {
      // 404 = pas un user, 403 = user existe mais bloqué (quand même un user)
      setNewContactIsUser(e?.status === 403 ? true : false);
    }
    setCheckingNewContact(false);
  };

  const handleDeleteContact = async (id: string) => {
    const contact = contacts.find((c) => c.id === id);
    if (contact?.contactUserId) {
      const { hasActiveSchedule } = await api.checkActiveScheduleBetween(
        contact.contactUserId,
      );
      if (hasActiveSchedule) {
        alert(t("contacts.detail.active_schedule_error"));
        setShowDeleteConfirm(null);
        return;
      }
    }
    setLoading(true);
    await api.deleteContact(id);

    setContacts(contacts.filter((c) => c.id !== id));
    setShowDeleteConfirm(null);
    setSelectedContact(null);
    setLoading(false);
  };

  const handleToggleFavorite = async (contact: Contact) => {
    const newValue = !contact.isFavorite;
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contact.id ? { ...c, isFavorite: newValue } : c,
      ),
    );
    try {
      await api.updateContact(contact.id, { isFavorite: newValue });
    } catch (e) {
      // Rollback si échec
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contact.id ? { ...c, isFavorite: contact.isFavorite } : c,
        ),
      );
      console.error("Failed to update favorite:", e);
    }
  };

  const handleSyncContacts = async () => {
    setIsSyncing(true);
    try {
      // Sync piYès contacts from backend
      const [contactsData, syncData] = await Promise.all([
        api.getContactsFresh(),
        api.syncFresh(),
      ]);
      setContacts(contactsData);
      setFriendships(syncData.friendships || []);
    } catch (e) {
      console.error('[handleSyncContacts] piYès sync error:', e);
      alert(t("common.error"));
      setIsSyncing(false);
      return;
    }

    // Synchronisation des contacts natifss
    try {
      clearNativeContactsCache();
      setLoadingNative(true);
      const nativeContacts = await getMatchedNativeContacts((msg) => {
        showToast(msg, 'info');
      }, true);  // forceRefresh = true
      setNativeAppContacts(nativeContacts);
    } catch (e) {
      // Should never reach here since getMatchedNativeContacts catches internally
      console.error('[handleSyncContacts] native contacts error:', e);
    } finally {
      setLoadingNative(false);
    }

    setIsSyncing(false);
    alert(t("contacts.sync_success"));
  };

  const handleSelectUser = (user: Partial<Contact>) => {
    const existingContact = contacts.find(
      (c) =>
        (user.id && (c.id === user.id || c.contactUserId === user.id)) ||
        (user.tag && c.tag === user.tag) ||
        (user.phone && c.phone === user.phone) ||
        (user.email && c.email === user.email),
    );

    if (existingContact) {
      setQuickActionContact(existingContact);
    } else {
      const priorityKey = getPriorityKey(user);
      navigate(`/transfer?recipient=${encodeURIComponent(priorityKey)}`);
    }
  };

  // Friendship Logic
  const getFriendshipStatus = (
    contactUserId?: string,
  ): FriendshipStatus | "none" => {
    if (!contactUserId) return "none";
    const f = friendships.find(
      (f) => f.requesterId === contactUserId || f.receiverId === contactUserId,
    );
    if (!f) return "none";
    return f.status;
  };

  const isRequester = (contactUserId: string) => {
    const f = friendships.find(
      (f) => f.requesterId === contactUserId || f.receiverId === contactUserId,
    );
    if (!f || !user) return false;
    return f.requesterId === user.id;
  };

  const handleFriendAction = async (contact: Contact) => {
    if (!contact.contactUserId) return;
    const status = getFriendshipStatus(contact.contactUserId);

    if (status === "friends") {
      const { hasActiveSchedule } = await api.checkActiveScheduleBetween(
        contact.contactUserId,
      );
      if (hasActiveSchedule) {
        alert(t("contacts.detail.active_schedule_friend_error"));
        return;
      }
    }

    try {
      if (status === "none") {
        // Envoi demande d'ami → ajouter localement en pending
        const f = await api.requestFriendship(contact.contactUserId);
        if (f && f.id) {
          setFriendships((prev) => [...prev.filter((x) => x.id !== f.id), f]);
        } else {
          // Réponse sans objet friendship (déjà envoyé, resent) → forcer un re-fetch
          const syncData = await api.sync();
          setFriendships(syncData.friendships || []);
        }
      } else if (status === "pending") {
        if (!isRequester(contact.contactUserId)) {
          // Accepter la demande
          const f = await api.acceptFriendship(contact.contactUserId);
          setFriendships((prev) =>
            prev.map((item) => (item.id === f.id ? f : item)),
          );
        } else {
          // Annuler sa propre demande
          await api.cancelFriendship(contact.contactUserId);
          setFriendships((prev) =>
            prev.filter(
              (f) =>
                !(
                  f.requesterId === user?.id &&
                  f.receiverId === contact.contactUserId
                ) &&
                !(
                  f.requesterId === contact.contactUserId &&
                  f.receiverId === user?.id
                ),
            ),
          );
        }
      } else if (status === "friends") {
        if (confirm(t("contacts.detail.remove_friend_confirm"))) {
          await api.cancelFriendship(contact.contactUserId);
          setFriendships((prev) =>
            prev.filter(
              (f) =>
                !(
                  f.requesterId === user?.id &&
                  f.receiverId === contact.contactUserId
                ) &&
                !(
                  f.requesterId === contact.contactUserId &&
                  f.receiverId === user?.id
                ),
            ),
          );
        }
      }
      // Forcer la mise à jour du selectedContact pour re-render du bouton
      if (selectedContact?.id === contact.id) {
        setSelectedContact({ ...contact });
      }
    } catch (e: any) {
      // Si l'API retourne "already_friends" ou "resent", re-fetch proprement
      const syncData = await api.sync();
      setFriendships(syncData.friendships || []);
    }
  };

  const favorites = useMemo(
    () => contacts.filter((c) => c.isFavorite),
    [contacts],
  );
  const recentContacts = useMemo(() => {
    return [...contacts]
      .filter((c) => c.lastTransactionDate)
      .sort(
        (a, b) =>
          new Date(b.lastTransactionDate!).getTime() -
          new Date(a.lastTransactionDate!).getTime(),
      )
      .slice(0, 10);
  }, [contacts]);
  const sortedAll = useMemo(
    () => [...contacts].sort((a, b) => a.name.localeCompare(b.name)),
    [contacts],
  );

  // Fusion des contacts piYès (manuels + récents) et des contacts natifs (piYès uniquement)
  const combinedAllContacts = useMemo(() => {
    // 1. Construire une Map des contacts piYès existants (par contactUserId et par phone)
    const piyesContactByUserId = new Map<string, Contact>();
    const piyesContactByPhone = new Map<string, Contact>();

    contacts.forEach(contact => {
      if (contact.contactUserId) {
        piyesContactByUserId.set(contact.contactUserId, contact);
      }
      if (contact.phone) {
        const normalizedPhone = contact.phone.replace(/[\s\-\(\)]/g, '').replace(/^\+?509?/, '');
        if (normalizedPhone.length === 8) {
          piyesContactByPhone.set(normalizedPhone, contact);
        }
      }
    });

    // 2. Convertir les contacts natifs en structure Contact (si pas déjà présents)
    const nativeAsContacts: Contact[] = [];

    for (const nc of nativeAppContacts) {
      // Vérifier si déjà dans piYès contacts
      let existing = nc.appUserId ? piyesContactByUserId.get(nc.appUserId) : null;
      if (!existing && nc.matchedPhone) {
        existing = piyesContactByPhone.get(nc.matchedPhone);
      }

      if (existing) {
        // Si le contact existe déjà, on enrichit avec le nom du répertoire (sans doublon)
        if (!existing.repertoireName) {
          existing.repertoireName = nc.name;
        }
        // On ne l'ajoute pas deux fois
        nativeAsContacts.push(existing);
      } else {
        // Créer un nouveau Contact pour ce natif (non encore dans la table)
        nativeAsContacts.push({
          id: `native_${nc.id}`,
          name: nc.appUserName || nc.name,
          repertoireName: nc.name,  // nom du répertoire
          tag: nc.appUserTag,
          avatarUrl: nc.appUserAvatar,
          contactUserId: nc.appUserId,
          phone: nc.matchedPhone ? `+509${nc.matchedPhone}` : '',
          isVerified: false,
          isFavorite: false,
          userId: '',
          app: 'native',
        });
      }
    }

    // 3. Fusionner tous les contacts piYès et les contacts natifs dédupliqués
    const all = [...contacts];
    for (const nc of nativeAsContacts) {
      const exists = all.some(c => c.id === nc.id);
      if (!exists) {
        all.push(nc);
      }
    }

    // 4. Trier par nom d'affichage : priorité au repertoireName, sinon name
    return all.sort((a, b) => {
      const nameA = a.repertoireName || a.name;
      const nameB = b.repertoireName || b.name;
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  }, [contacts, nativeAppContacts]);

  const scrollContainerRef = useRef<HTMLDivElement>(null); // pour restaurer la position de scroll


  // Restauration immédiate au montage (avant le paint)
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem('contacts_scroll_position');
    if (saved && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = parseInt(saved, 10);
      // Optionnel : nettoyer pour éviter de re-sauvegarder par erreur
      // sessionStorage.removeItem('contacts_scroll_position');
    }
  }, []); // ne dépend de rien, s'exécute une fois au montage
  // Sauvegarde du scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      sessionStorage.setItem('contacts_scroll_position', String(container.scrollTop));
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  // Restauration du scroll une fois que tout est chargé
  useEffect(() => {
    if (loading || combinedAllContacts.length === 0) return;
    const savedScroll = sessionStorage.getItem('contacts_scroll_position');
    if (savedScroll && scrollContainerRef.current) {
      // Attendre que le DOM soit stabilisé
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = parseInt(savedScroll, 10);
        }
      }, 150);
    }
  }, [loading, combinedAllContacts]);



  // Open SMS invite for a native contact not yet on piYès
  const handleInviteViaSms = (nativeContact: NativeContact) => {
    const phone = nativeContact.phoneNumbers[0]
      ? `+509${nativeContact.phoneNumbers[0]}`
      : '';
    const message = encodeURIComponent(
      `Salut ! Je t'invite à rejoindre piYès, l'app de paiement mobile haïtienne. Télécharge-la ici : https://piyes.ht`
    );
    // Opens native SMS app with prefilled number and message
    window.open(`sms:${phone}?body=${message}`, '_self');
  };

  return (
    <div className="theme-card-bg min-h-screen pb-32 flex flex-col">
      <PageHeader
        title={t("contacts.title")}
        onBack={() => navigate(-1)}
        rightElement={
          <div className="flex gap-2">
            <button
              onClick={() => alert(t("contacts.invite_msg"))}
              className="theme-bubble-bg theme-primary-text px-4 py-2 rounded-full text-xs font-bold active:scale-95 transition-all flex items-center gap-2"
            >
              <Share2 size={16} /> {t("common.invite")}
            </button>
            <button
              onClick={() => navigate("/privacy-settings")}
              className="theme-bubble-bg theme-text-main p-2 rounded-full active:scale-90 transition-transform border theme-border"
            >
              <Shield size={24} />
            </button>
          </div>
        }
        className="sticky top-0 theme-card-bg z-30 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />

      {/* Contenu scrollable */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
        {/* Search Bar */}
        <div className="pt-6">
          <div className="px-6 flex gap-2 mb-4">
            <div className="flex-1">
              <ContactSearch
                contacts={contacts}
                onSelect={handleSelectUser}
                placeholder={t("contacts.search_placeholder")}
                query={searchQuery}
                setQuery={setSearchQuery}
                currentUser={user}
              />
            </div>
            <button
              onClick={handleImportFromPhone}
              className="p-3 theme-bubble-bg rounded-2xl theme-text-main border theme-border active:scale-95 transition-transform flex items-center justify-center"
              title={t("contacts.import_phone")}
            >
              <Smartphone size={24} />
            </button>
          </div>

          <div className="px-6 flex gap-3 mb-6">
            <button
              onClick={handleSyncContacts}
              disabled={isSyncing}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-4 theme-bubble-bg theme-text-secondary rounded-2xl text-xs font-bold active:scale-95 transition-all border theme-border"
            >
              <RefreshCw
                size={14}
                className={isSyncing ? "animate-spin" : ""}
              />
              {isSyncing ? t("contacts.syncing") : t("contacts.sync")}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="theme-primary-bg text-white px-6 py-4 rounded-2xl active:scale-90 transition-transform shadow-lg flex items-center gap-2 font-bold text-xs"
            >
              <UserPlus size={18} /> {t("contacts.new")}
            </button>
          </div>
        </div>

        <div className="animate-in fade-in duration-500">
          {/* Favoris Section */}
          <ContactSection
            title={t("contacts.favorites_title")}
            contacts={favorites}
            type="favoris"
            onContactClick={(c) => setQuickActionContact(c)}
            onToggleFavorite={handleToggleFavorite}
          />

          {/* Récents Section */}
          <ContactSection
            title={t("contacts.recent_title") || "Récents"}
            contacts={recentContacts}
            type="recents"
            onContactClick={(c) => setQuickActionContact(c)}
            onToggleFavorite={handleToggleFavorite}
          />

          {/* Tous les contacts */}
          <ContactSection
            title={t("contacts.all_title") || "Tous les contacts"}
            contacts={combinedAllContacts}
            type="all"
            // 
            onContactClick={async (c) => {
              // Sauvegarder la position avant de partir
              if (scrollContainerRef.current) {
                sessionStorage.setItem('contacts_scroll_position', String(scrollContainerRef.current.scrollTop));
              }

              // Détecter si c'est un contact natif non enregistré
              const isUnsavedNative = c.repertoireName && !c.contactUserId && c.id?.startsWith('native_');

              if (isUnsavedNative) {
                try {
                  // 1. Construire la clé (tag ou numéro)
                  const key = c.phone ? `+509${c.phone.replace(/^\+?509/, '')}` : c.tag || '';

                  // 2. Appeler /contacts/sync pour créer le contact dans la BDD
                  const response = await http.post<any[]>('/contacts/sync', {
                    contacts: [{
                      name: c.repertoireName,
                      info: key,
                    }],
                  });

                  // 3. Si succès, ajouter le nouveau contact à l'état local
                  if (response && response[0]) {
                    setContacts(prev => [response[0], ...prev]);
                    // 4. Naviguer vers ContactDetail avec le vrai ID
                    navigate(`/contact-detail/${response[0].id}`);
                  }
                } catch (e) {
                  console.error('Erreur ajout contact natif:', e);
                  alert('Erreur lors de l\'ajout du contact');
                }
              } else {
                // Contact normal (déjà en BDD)
                navigate(`/contact-detail/${c.id}`);
              }
            }}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>

        {/* QUICK ACTIONS MODAL */}
        <Modal
          isOpen={!!quickActionContact}
          onClose={() => setQuickActionContact(null)}
        >
          {quickActionContact && (
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 theme-bubble-bg rounded-2xl flex items-center justify-center font-bold theme-primary-text text-xl border theme-border shadow-sm overflow-hidden">
                  {quickActionContact.avatarUrl ? (
                    <img
                      src={quickActionContact.avatarUrl}
                      alt={quickActionContact.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    getInitials(quickActionContact.name)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold theme-text-main">
                    {quickActionContact.name}
                  </h3>
                  <p className="text-xs theme-text-secondary tracking-wider">
                    {quickActionContact.tag ||
                      formatPhoneDisplay(quickActionContact.phone) ||
                      quickActionContact.email}
                  </p>
                </div>
                <button
                  onClick={() => setQuickActionContact(null)}
                  className="ml-auto p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setQuickActionContact(null);
                    navigate(
                      `/transfer?recipient=${encodeURIComponent(getPriorityKey(quickActionContact))}`,
                    );
                  }}
                  className="flex flex-col items-center gap-3 p-6 theme-bubble-bg rounded-4xl border theme-border active:scale-95 transition-all group"
                >
                  <div className="w-12 h-12 theme-primary-bg text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Send size={24} />
                  </div>
                  <span className="text-xs font-bold theme-text-main">
                    {t("contacts.detail.send")}
                  </span>
                </button>

                <button
                  disabled={
                    getFriendshipStatus(quickActionContact.contactUserId) !==
                    "friends"
                  }
                  onClick={() => {
                    setQuickActionContact(null);
                    navigate(
                      `/request-payment?name=${encodeURIComponent(quickActionContact.name)}`,
                    );
                  }}
                  className={`flex flex-col items-center gap-3 p-6 theme-bubble-bg rounded-4xl border theme-border active:scale-95 transition-all group ${getFriendshipStatus(quickActionContact.contactUserId) !== "friends" ? "opacity-40 grayscale pointer-events-none" : ""}`}
                >
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <ArrowDownLeft size={24} />
                  </div>
                  <span className="text-xs font-bold theme-text-main">
                    {t("contacts.detail.request")}
                  </span>
                </button>
              </div>

              <Button
                variant="utility"
                fullWidth
                onClick={() => {
                  setQuickActionContact(null);
                  navigate(`/contact-detail/${quickActionContact.id}`);
                }}
              >
                {t("contacts.view_full_profile")}
              </Button>
            </div>
          )}
        </Modal>

        {/* CONTACT DETAIL MODAL */}
        <Modal
          isOpen={!!selectedContact}
          onClose={() => setSelectedContact(null)}
          type="centered"
        >
          {selectedContact && (
            <div className="w-full max-w-sm flex flex-col">
              {/* Top Header Card */}
              <div className="theme-primary-bg p-8 pt-12 pb-16 relative">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full backdrop-blur-md active:scale-90 transition-transform"
                >
                  <X size={20} />
                </button>
                <div className="flex flex-col items-center gap-4 text-white">
                  <div className="w-24 h-24 bg-white/20 rounded-[40px] border-4 border-white/30 flex items-center justify-center text-3xl font-black shadow-xl backdrop-blur-sm overflow-hidden">
                    {selectedContact.avatarUrl ? (
                      <img
                        src={selectedContact.avatarUrl}
                        alt={selectedContact.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      getInitials(selectedContact.name)
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">{selectedContact.repertoireName || selectedContact.name}</h3>
                    <p className="text-xs font-bold opacity-70 tracking-wider">
                      {selectedContact.tag ||
                        formatPhoneDisplay(selectedContact.phone) ||
                        selectedContact.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body Info */}
              <div className="flex-1 p-8 -mt-8 theme-card-bg rounded-t-[48px] space-y-6">
                <div className="space-y-4">
                  {/* Nom sur piYès (si différent du nom affiché) */}
                  {selectedContact.repertoireName && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text shrink-0">
                        <UserCheck size={18} />
                      </div>
                      <div className="flex-1 border-b theme-border pb-3">
                        <p className="text-[9px] theme-text-secondary uppercase font-bold tracking-widest">
                          Nom sur piYès
                        </p>
                        <p className="text-sm font-bold theme-text-main">
                          {selectedContact.name}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text">
                      <UserCheck size={20} />
                    </div>
                    <div className="flex-1 border-b theme-border pb-4">
                      <p className="text-[10px] theme-text-secondary uppercase font-bold tracking-widest">
                        {t("contacts.detail.relation")}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold theme-text-main flex items-center gap-2">
                          {selectedContact.type === "company"
                            ? t("contacts.detail.certified_company")
                            : getFriendshipStatus(
                              selectedContact.contactUserId,
                            ) === "friends"
                              ? t("contacts.detail.mutual_contact")
                              : t("contacts.detail.simple_contact")}
                          {selectedContact.isVerified && (
                            <CheckCircle size={14} className="text-blue-500" />
                          )}
                        </p>
                        <button
                          onClick={() => handleToggleFavorite(selectedContact)}
                          className={`p-2 rounded-full transition-all ${selectedContact.isFavorite ? "bg-yellow-500/10 text-yellow-500" : "theme-bubble-bg theme-text-secondary"}`}
                        >
                          <Star
                            size={20}
                            className={
                              selectedContact.isFavorite
                                ? "fill-yellow-500"
                                : ""
                            }
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Friendship Action Button */}
                  {selectedContact.contactUserId && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text">
                        {getFriendshipStatus(selectedContact.contactUserId) ===
                          "friends" ? (
                          <UserCheck size={20} />
                        ) : (
                          <UserPlusIcon size={20} />
                        )}
                      </div>
                      <div
                        className={`flex-1 border-b theme-border pb-4 rounded-xl px-2 transition-all duration-700 ${highlightFriendship ? "bg-(--primary-color)/10 ring-2 ring-(--primary-color)" : ""}`}
                      >
                        <p className="text-[10px] theme-text-secondary uppercase font-bold tracking-widest">
                          {t("contacts.detail.piyes_friends")}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold theme-text-main">
                            {getFriendshipStatus(
                              selectedContact.contactUserId,
                            ) === "friends"
                              ? t("contacts.detail.you_are_friends")
                              : getFriendshipStatus(
                                selectedContact.contactUserId,
                              ) === "pending"
                                ? isRequester(selectedContact.contactUserId)
                                  ? t("contacts.detail.request_sent")
                                  : t("contacts.detail.request_received")
                                : t("contacts.detail.not_friends")}
                          </p>
                          <button
                            onClick={() => handleFriendAction(selectedContact)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${getFriendshipStatus(
                              selectedContact.contactUserId,
                            ) === "friends"
                              ? "bg-red-500/10 text-red-500"
                              : getFriendshipStatus(
                                selectedContact.contactUserId,
                              ) === "pending"
                                ? "bg-orange-500/10 text-orange-500"
                                : "theme-primary-bg text-white"
                              }`}
                          >
                            {getFriendshipStatus(
                              selectedContact.contactUserId,
                            ) === "friends" ? (
                              <>
                                <UserMinus size={14} />{" "}
                                {t("contacts.detail.remove")}
                              </>
                            ) : getFriendshipStatus(
                              selectedContact.contactUserId,
                            ) === "pending" ? (
                              isRequester(selectedContact.contactUserId) ? (
                                <>
                                  <X size={14} /> {t("contacts.detail.cancel")}
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={14} />{" "}
                                  {t("contacts.detail.accept")}
                                </>
                              )
                            ) : (
                              <>
                                <UserPlusIcon size={14} />{" "}
                                {t("contacts.detail.add")}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedContact.type === "company" && (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text">
                          <Briefcase size={20} />
                        </div>
                        <div className="flex-1 border-b theme-border pb-4">
                          <p className="text-[10px] theme-text-secondary uppercase font-bold tracking-widest">
                            {t("contacts.detail.activity")}
                          </p>
                          <p className="text-sm font-bold theme-text-main">
                            {selectedContact.activityType ||
                              t("contacts.detail.commerce")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text">
                          <MapPin size={20} />
                        </div>
                        <div className="flex-1 border-b theme-border pb-4">
                          <p className="text-[10px] theme-text-secondary uppercase font-bold tracking-widest">
                            {t("contacts.detail.address")}
                          </p>
                          <p className="text-sm font-bold theme-text-main">
                            {selectedContact.address ||
                              t("contacts.detail.haiti")}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text">
                      <Smartphone size={20} />
                    </div>
                    <div className="flex-1 border-b theme-border pb-4">
                      <p className="text-[10px] theme-text-secondary uppercase font-bold tracking-widest">
                        {t("contacts.detail.mobile")}
                      </p>
                      <p className="text-sm font-bold theme-text-main tracking-wider">
                        {selectedContact.phone
                          ? formatPhoneDisplay(selectedContact.phone)
                          : t("contacts.detail.not_specified")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text">
                      <Clock size={20} />
                    </div>
                    <div className="flex-1 border-b theme-border pb-4">
                      <p className="text-[10px] theme-text-secondary uppercase font-bold tracking-widest">
                        {t("contacts.detail.last_interaction")}
                      </p>
                      <p className="text-sm font-bold theme-text-main">
                        {selectedContact.lastTransactionDate
                          ? new Date(
                            selectedContact.lastTransactionDate,
                          ).toLocaleDateString()
                          : t("contacts.detail.none")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    fullWidth
                    onClick={() => {
                      navigate(
                        `/transfer?recipient=${encodeURIComponent(getPriorityKey(selectedContact))}`,
                      );
                      setSelectedContact(null);
                    }}
                  >
                    {t("contacts.detail.send")}
                  </Button>
                  <button
                    className="p-4 theme-bubble-bg theme-primary-text rounded-2xl border theme-border active:scale-90 transition-transform"
                    onClick={() => {
                      if (confirm(t("contacts.detail.share_confirm")))
                        alert(t("contacts.detail.shared_success"));
                    }}
                  >
                    <Share2 size={24} />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() =>
                      navigate(
                        `/transfer-interactions?contactId=${selectedContact.id}`,
                      )
                    }
                    className="w-full theme-bubble-bg theme-text-main py-3 rounded-xl font-bold text-xs active:scale-95 transition-all"
                  >
                    {t("contacts.detail.my_interactions_with", {
                      name: selectedContact.name.split(" ")[0],
                    })}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(selectedContact)}
                    className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-2 text-xs active:scale-95 transition-all opacity-40 hover:opacity-100"
                  >
                    <Trash2 size={14} /> {t("contacts.detail.delete_contact")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* DELETE CONFIRMATION MODAL */}
        <Modal
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          type="centered"
        >
          {showDeleteConfirm && (
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold theme-text-main">
                  {t("contacts.detail.delete_confirm_title")}
                </h3>
                <p className="text-sm theme-text-secondary">
                  {t("contacts.detail.delete_confirm_desc", {
                    name: showDeleteConfirm.name,
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => handleDeleteContact(showDeleteConfirm.id)}
                >
                  {t("contacts.detail.delete_yes")}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  {t("contacts.detail.delete_no")}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Add Contact Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <UserPlus className="theme-primary-text" size={24} />
                <h2 className="text-2xl font-bold theme-text-main">
                  {t("contacts.add_title")}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewContactIsUser(null);
                }}
                className="p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-widest px-1">
                  {t("contacts.name_label")}
                </label>
                <input
                  type="text"
                  placeholder={t("common.example") + " Jean Dupont"}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full theme-bubble-bg p-5 rounded-3xl outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold theme-text-secondary uppercase tracking-widest px-1">
                  {t("contacts.add_info_label")}
                </label>
                <input
                  type="text"
                  placeholder="@tag, email, +509..."
                  value={newInfo}
                  onChange={(e) => {
                    setNewInfo(e.target.value);
                    setNewContactIsUser(null);
                  }}
                  onBlur={handleCheckNewInfo}
                  className={`w-full theme-bubble-bg p-5 rounded-3xl outline-none theme-text-main border transition-all ${newContactIsUser === true
                    ? "border-green-400"
                    : newContactIsUser === false
                      ? "border-red-400"
                      : "theme-border"
                    } focus:border-(--primary-color)`}
                />
                {/* Feedback utilisateur */}
                {checkingNewContact && (
                  <p className="text-[10px] theme-text-secondary px-1 flex items-center gap-1">
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                    {t("contacts.checking")}
                  </p>
                )}
                {!checkingNewContact && newContactIsUser === true && (
                  <p className="text-[10px] text-green-600 font-bold px-1">
                    ✓ {t("contacts.user_found")}
                  </p>
                )}
                {!checkingNewContact &&
                  newContactIsUser === false &&
                  newInfo.trim() && (
                    <p className="text-[10px] text-red-500 font-bold px-1">
                      ⚠ {t("contacts.user_not_found_warning")}
                    </p>
                  )}
              </div>

              <Button
                fullWidth
                disabled={loading || !newName}
                onClick={() => handleAddContact()}
              >
                {loading ? t("common.loading") : t("contacts.btn_create")}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal confirmation contact non-user */}
        <Modal
          isOpen={showNonUserModal}
          onClose={() => setShowNonUserModal(false)}
          type="centered"
        >
          {pendingContactSave && (
            <div className="p-8 space-y-6 text-center">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black theme-text-main">
                  {t("contacts.non_user_confirm_title")}
                </h3>
                <p className="text-sm theme-text-secondary leading-relaxed">
                  {t("contacts.non_user_confirm_desc")}
                </p>
              </div>
              {/* Recap des infos */}
              <div className="theme-bubble-bg rounded-2xl p-4 text-left space-y-2 border theme-border">
                <p className="text-xs font-bold theme-text-secondary uppercase tracking-widest">
                  {t("contacts.entered_info")}
                </p>
                <p className="text-sm font-bold theme-text-main">
                  {pendingContactSave.name}
                </p>
                {pendingContactSave.info && (
                  <p className="text-xs text-red-500 font-bold">
                    {pendingContactSave.info}
                  </p>
                )}
                <p className="text-[10px] text-amber-500 font-bold">
                  ⚠ {t("contacts.key_not_found_db")}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  fullWidth
                  isLoading={loading}
                  onClick={() => handleAddContact(true)}
                >
                  {t("contacts.save_anyway")}
                </Button>
                <Button
                  variant="text"
                  fullWidth
                  onClick={() => {
                    setShowNonUserModal(false);
                    setPendingContactSave(null);
                  }}
                >
                  {t("contacts.cancel_check")}
                </Button>
              </div>
            </div>
          )}
        </Modal>
        {/* Native Phone Contacts Modal */}
        <Modal
          isOpen={showNativeContactsModal}
          onClose={() => setShowNativeContactsModal(false)}
        >
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="theme-primary-text" size={22} />
                <h2 className="text-xl font-bold theme-text-main">
                  Contacts sur piYès
                </h2>
              </div>
              <button
                onClick={() => setShowNativeContactsModal(false)}
                className="p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {loadingNative ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="w-8 h-8 border-4 border-(--primary-color) border-t-transparent rounded-full animate-spin" />
                <p className="text-sm theme-text-secondary">Lecture du répertoire...</p>
              </div>
            ) : nativeAppContacts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Smartphone size={40} className="text-gray-300" />
                <p className="text-sm theme-text-secondary">
                  Aucun contact de votre répertoire n'est encore sur piYès.
                </p>
                <button
                  onClick={async () => {
                    clearNativeContactsCache();
                    setLoadingNative(true);
                    const contacts = await getMatchedNativeContacts((msg) => showToast(msg, 'info'));
                    setNativeAppContacts(contacts);
                    setLoadingNative(false);
                  }}
                  className="theme-primary-bg text-white px-6 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <div className="space-y-1 max-h-[60vh] overflow-y-auto no-scrollbar">
                {nativeAppContacts.map((nc) => {
                  const existingContact = contacts.find(
                    c => c.contactUserId === nc.appUserId
                  );
                  return (
                    <div
                      key={nc.id}
                      onClick={async () => {
                        setShowNativeContactsModal(false);
                        if (existingContact) {
                          // Already saved — go to detail directly
                          navigate(`/contact-detail/${existingContact.id}`);
                        } else {
                          // Not saved yet — sync to DB then navigate to detail
                          try {
                            const key = nc.appUserTag
                              ? nc.appUserTag
                              : `+509${nc.matchedPhone}`;
                            const response = await http.post<any[]>('/contacts/sync', {
                              contacts: [{
                                name: nc.appUserName || nc.name,
                                info: key,
                              }],
                            });
                            if (response && response[0]) {
                              setContacts(prev => {
                                const exists = prev.find(c => c.id === response[0].id);
                                return exists ? prev : [response[0], ...prev];
                              });
                              navigate(`/contact-detail/${response[0].id}`);
                            } else {
                              throw new Error('Sync failed');
                            }
                          } catch (e) {
                            console.error('[NativeContact Modal] sync error:', e);
                            // Fallback: invite via SMS
                            const phone = nc.phoneNumbers[0]
                              ? `+509${nc.phoneNumbers[0]}`
                              : '';
                            const message = encodeURIComponent(
                              `Salut ! Je t'invite à rejoindre piYès, l'app de paiement mobile haïtienne. Télécharge-la ici : https://piyes.ht`
                            );
                            window.open(`sms:${phone}?body=${message}`, '_self');
                          }
                        }
                      }}
                      className="flex items-center gap-4 p-4 active:bg-gray-50 dark:active:bg-white/5 rounded-2xl transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 theme-bubble-bg rounded-2xl flex items-center justify-center font-bold theme-primary-text border theme-border overflow-hidden shrink-0">
                        {nc.appUserAvatar ? (
                          <img
                            src={nc.appUserAvatar}
                            alt={nc.appUserName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          getInitials(nc.appUserName || nc.name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold theme-text-main truncate">
                            {nc.appUserName || nc.name}
                          </p>
                          <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            piYès
                          </span>
                        </div>
                        <p className="text-[10px] theme-text-secondary">
                          {nc.matchedPhone && formatPhoneDisplay(`+509${nc.matchedPhone}`)}
                        </p>
                      </div>
                      <ChevronRight size={16} className="theme-text-secondary shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Contacts;
function showToast(msg: string, arg1: string) {
  throw new Error("Function not implemented.");
}

