// pages/ContactDetail.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import {
  ArrowLeft, UserCheck, CheckCircle, Star, Send, ArrowDownLeft,
  Share2, Briefcase, MapPin, Smartphone, Clock, Trash2, CalendarClock,
  UserPlus as UserPlusIcon, UserMinus, X, Edit2, Save, Loader2, AlertCircle
} from 'lucide-react';
import Button from '../components/Button';
import { api } from '../services/apiService';
import { Contact, getInitials, Friendship, FriendshipStatus, User } from '../shared/types';
import { getRecipientType, RecipientType } from '../shared/recipientUtils';
import { useTranslation, useToast } from '../App';

interface ContactDetailProps {
  user?: User | null;
}

const ContactDetail: React.FC<ContactDetailProps> = ({ user }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { contactId } = useParams<{ contactId: string }>();
  const { search } = useLocation();
  const highlightFriendshipFromUrl = new URLSearchParams(search).get('highlight') === 'friendship';

  const [contact, setContact] = useState<Contact | null>(null);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightFriendship, setHighlightFriendship] = useState(highlightFriendshipFromUrl);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', tag: '', phone: '', email: '', randomKey: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [contacts, syncData] = await Promise.all([
          api.getContactsFresh(), // Toujours forcer refresh pour avoir le contact fraîchement créé
          api.syncFresh(),
        ]);
        const found = contacts.find(c => c.id === contactId || c.contactUserId === contactId);
        setContact(found || null);
        setFriendships(syncData.friendships || []);
        if (found) {
          setEditForm({
            name: found.name || '',
            tag: found.tag || '',
            phone: found.phone || '',
            email: found.email || '',
            randomKey: found.randomKey || '',
          });
        }
      } catch (e) {
        console.error('ContactDetail load error:', e);
      }
      setLoading(false);
    };
    load();
  }, [contactId]);

  useEffect(() => {
    if (highlightFriendshipFromUrl) {
      setHighlightFriendship(true);
      setTimeout(() => setHighlightFriendship(false), 2500);
    }
  }, [highlightFriendshipFromUrl]);

  const getPriorityKey = (c: Contact) => {
    if (c.tag) {
      const type = getRecipientType(c.tag);
      if (type === RecipientType.TAG) {
        return `@${c.tag.replace(/^@/, '')}`;
      }
      return c.tag;
    }
    if (c.phone) return `+${c.phone.replace(/^\+/, '')}`;
    if (c.email) return c.email;
    if (c.randomKey) return c.randomKey;
    return c.name;
  };

  const getFriendshipStatus = (contactUserId?: string): FriendshipStatus | 'none' => {
    if (!contactUserId) return 'none';
    const f = friendships.find(f => f.requesterId === contactUserId || f.receiverId === contactUserId);
    if (!f) return 'none';
    return f.status;
  };

  const isRequester = (contactUserId: string) => {
    const f = friendships.find(f => f.requesterId === contactUserId || f.receiverId === contactUserId);
    if (!f || !user) return false;
    return f.requesterId === user.id;
  };

  const isMutualFriend = contact?.contactUserId
    ? getFriendshipStatus(contact.contactUserId) === 'friends'
    : false;

  // Un contact est "user piYès" s'il a un contactUserId lié ou est vérifié
  const isUserContact = !!contact?.contactUserId || !!contact?.isVerified;

  const handleFriendAction = async () => {
    if (!contact?.contactUserId) return;
    const status = getFriendshipStatus(contact.contactUserId);

    if (status === 'friends') {
      const { hasActiveSchedule } = await api.checkActiveScheduleBetween(contact.contactUserId);
      if (hasActiveSchedule) {
        alert('Impossible de modifier la relation amicale : un rappel de paiement actif existe entre vous.');
        return;
      }
    }

    try {
      if (status === 'none') {
        const f = await api.requestFriendship(contact.contactUserId);
        if (f && f.id) {
          setFriendships(prev => [...prev.filter(x => x.id !== f.id), f]);
        } else {
          const syncData = await api.sync();
          setFriendships(syncData.friendships || []);
        }
      } else if (status === 'pending') {
        if (!isRequester(contact.contactUserId)) {
          const f = await api.acceptFriendship(contact.contactUserId);
          setFriendships(prev => prev.map(item => item.id === f.id ? f : item));
        } else {
          await api.cancelFriendship(contact.contactUserId);
          setFriendships(prev => prev.filter(f =>
            !(f.requesterId === user?.id && f.receiverId === contact.contactUserId) &&
            !(f.requesterId === contact.contactUserId && f.receiverId === user?.id)
          ));
        }
      } else if (status === 'friends') {
        if (confirm('Voulez-vous retirer ce contact de vos amis ?')) {
          await api.cancelFriendship(contact.contactUserId);
          setFriendships(prev => prev.filter(f =>
            !(f.requesterId === user?.id && f.receiverId === contact.contactUserId) &&
            !(f.requesterId === contact.contactUserId && f.receiverId === user?.id)
          ));
        }
      }
      setContact(c => c ? { ...c } : c);
    } catch (e: any) {
      const syncData = await api.sync();
      setFriendships(syncData.friendships || []);
    }
  };

  const handleSaveEdit = async () => {
    if (!contact || !editForm.name.trim()) return;
    setSaving(true);
    try {
      const updated = await api.editContact(contact.id, {
        name: editForm.name.trim(),
        tag: editForm.tag.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        email: editForm.email.trim() || undefined,
        randomKey: editForm.randomKey.trim() || undefined,
      });
      // Mettre à jour l'état local avec les nouvelles données
      const merged = { ...contact, ...updated };
      setContact(merged);
      setIsEditing(false);
      showToast('Contact mis à jour', 'success');
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de la mise à jour', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!contact) return;
    if (contact.contactUserId) {
      const { hasActiveSchedule } = await api.checkActiveScheduleBetween(contact.contactUserId);
      if (hasActiveSchedule) {
        alert('Impossible de supprimer ce contact : un rappel de paiement actif existe entre vous.');
        setShowDeleteConfirm(false);
        return;
      }
    }
    await api.deleteContact(contact.id);
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="theme-card-bg min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="theme-card-bg min-h-screen flex flex-col items-center justify-center gap-4 p-12">
        <p className="theme-text-secondary">Contact introuvable.</p>
        <button onClick={() => navigate(-1)} className="theme-primary-text font-bold">Retour</button>
      </div>
    );
  }

  const status = getFriendshipStatus(contact.contactUserId);

  return (
    <div className="theme-card-bg min-h-screen flex flex-col pb-32">
      {/* Header coloré */}
      <div className="theme-primary-bg p-8 pt-14 pb-16 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-6 p-2 bg-white/20 text-white rounded-full backdrop-blur-md active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        {/* Edit / Save button */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-12 right-6 p-2 bg-white/20 text-white rounded-full backdrop-blur-md active:scale-90 transition-transform"
          >
            <Edit2 size={18} />
          </button>
        ) : (
          <button
            onClick={handleSaveEdit}
            disabled={saving}
            className="absolute top-12 right-6 p-2 bg-white/20 text-white rounded-full backdrop-blur-md active:scale-90 transition-transform"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          </button>
        )}

        <div className="flex flex-col items-center gap-4 text-white">
          <div className="w-24 h-24 bg-white/20 rounded-[40px] border-4 border-white/30 flex items-center justify-center text-3xl font-black shadow-xl backdrop-blur-sm overflow-hidden">
            {contact.avatarUrl
              ? <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : getInitials(contact.name)}
          </div>
          <div className="text-center w-full px-8">
            {isEditing ? (
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                className="text-2xl font-bold bg-transparent text-white border-b border-white/50 outline-none text-center w-full"
                placeholder="Nom du contact"
              />
            ) : (
              <h3 className="text-2xl font-bold">{contact.name}</h3>
            )}
            <p className="text-xs font-bold opacity-70">{contact.tag || contact.phone || contact.email}</p>
          </div>
        </div>
      </div>

      {/* Corps */}
      <div className="flex-1 p-6 -mt-8 theme-card-bg rounded-t-[48px] space-y-5">

        {/* Avertissement non-user */}
        {!isUserContact && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/30">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-xs font-bold text-red-500 leading-relaxed">
              Ce contact n'est pas encore un utilisateur piYès. Les actions de paiement sont désactivées jusqu'à son inscription.
            </p>
          </div>
        )}

        {/* Champs info */}
        <div className="space-y-3">
          {/* Relation */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text shrink-0">
              <UserCheck size={18} />
            </div>
            <div className="flex-1 border-b theme-border pb-3">
              <p className="text-[9px] theme-text-secondary uppercase font-bold tracking-widest">Relation</p>
              <p className="text-sm font-bold theme-text-main">
                {!isUserContact ? 'Contact hors-réseau piYès' :
                  status === 'friends' ? 'Ami (Contact mutuel)' : 'Contact piYès'}
              </p>
            </div>
          </div>

          {/* Amitié — seulement si user piYès */}
          {isUserContact && contact.contactUserId && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text shrink-0">
                {status === 'friends' ? <UserCheck size={18} /> : <UserPlusIcon size={18} />}
              </div>
              <div className={`flex-1 border-b theme-border pb-3 rounded-xl px-1.5 transition-all duration-700 ${highlightFriendship ? 'bg-[var(--primary-color)]/10 ring-2 ring-[var(--primary-color)]' : ''}`}>
                <p className="text-[9px] theme-text-secondary uppercase font-bold tracking-widest">Amis piYès</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold theme-text-main">
                    {status === 'friends' ? 'Vous êtes amis' :
                      status === 'pending' ? (isRequester(contact.contactUserId) ? 'Demande envoyée' : 'Demande reçue') :
                        'Pas encore amis'}
                  </p>
                  <Button
                    onClick={handleFriendAction}
                    variant={status === 'friends' ? 'danger' : status === 'pending' ? 'secondary' : 'primary'}
                    size="sm"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      status === 'friends' ? 'bg-red-500/10 text-red-500 border-none' :
                        status === 'pending' ? 'bg-orange-500/10 text-orange-500 border-none' :
                          ''
                    }`}
                  >
                    {status === 'friends' ? <><UserMinus size={12} /> Retirer</> :
                      status === 'pending' ? (isRequester(contact.contactUserId)
                        ? <><X size={12} /> Annuler</>
                        : <><CheckCircle size={12} /> Accepter</>)
                        : <><UserPlusIcon size={12} /> Ajouter</>}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tag */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text shrink-0">
              <Edit2 size={18} />
            </div>
            <div className="flex-1 border-b theme-border pb-3">
              <p className="text-[9px] theme-text-secondary uppercase font-bold tracking-widest">Tag</p>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-0 bottom-0.5 text-sm theme-text-secondary">@</span>
                  <input type="text" value={editForm.tag.replace(/^@/, '')}
                    onChange={e => setEditForm(p => ({ ...p, tag: e.target.value }))}
                    className="w-full pl-4 bg-transparent theme-text-main text-sm font-bold outline-none border-b border-[var(--primary-color)] pb-0.5"
                    placeholder="tag"
                  />
                </div>
              ) : (
                <p className="text-sm font-bold theme-text-main">{contact.tag || '—'}</p>
              )}
            </div>
          </div>

          {/* Téléphone */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text shrink-0">
              <Smartphone size={18} />
            </div>
            <div className="flex-1 border-b theme-border pb-3">
              <p className="text-[9px] theme-text-secondary uppercase font-bold tracking-widest">Téléphone</p>
              {isEditing ? (
                <input type="tel" value={editForm.phone}
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-transparent theme-text-main text-sm font-bold outline-none border-b border-[var(--primary-color)] pb-0.5"
                  placeholder="+509..."
                />
              ) : (
                <p className="text-sm font-bold theme-text-main">{contact.phone || '—'}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text shrink-0">
              <Edit2 size={18} />
            </div>
            <div className="flex-1 border-b theme-border pb-3">
              <p className="text-[9px] theme-text-secondary uppercase font-bold tracking-widest">Email</p>
              {isEditing ? (
                <input type="email" value={editForm.email}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-transparent theme-text-main text-sm font-bold outline-none border-b border-[var(--primary-color)] pb-0.5"
                  placeholder="email@exemple.com"
                />
              ) : (
                <p className="text-sm font-bold theme-text-main">{contact.email || '—'}</p>
              )}
            </div>
          </div>

          {/* Dernière interaction */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text shrink-0">
              <Clock size={18} />
            </div>
            <div className="flex-1 border-b theme-border pb-3">
              <p className="text-[9px] theme-text-secondary uppercase font-bold tracking-widest">Dernière interaction</p>
              <p className="text-sm font-bold theme-text-main">
                {contact.lastTransactionDate
                  ? new Date(contact.lastTransactionDate).toLocaleDateString('fr-HT', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Aucune'}
              </p>
            </div>
          </div>
        </div>

        {/* 3 boutons d'action — masqués en mode edit */}
        {!isEditing && (
          <>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {/* Envoyer */}
              <Button
                disabled={!isUserContact}
                onClick={() => navigate(`/transfer?recipient=${encodeURIComponent(getPriorityKey(contact))}`)}
                variant={isUserContact ? 'primary' : 'secondary'}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 h-auto ${
                  !isUserContact && 'opacity-40 pointer-events-none grayscale border-dashed'
                }`}
              >
                <Send size={20} />
                <span className="text-[10px] font-bold">Envoyer</span>
              </Button>

              {/* Demander */}
              <Button
                disabled={!isUserContact || !isMutualFriend}
                onClick={() => navigate(`/request-payment?name=${encodeURIComponent(contact.name)}&recipient=${encodeURIComponent(getPriorityKey(contact))}`)}
                variant="utility"
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 h-auto ${
                  (!isUserContact || !isMutualFriend) && 'opacity-40 pointer-events-none grayscale border-dashed'
                }`}
              >
                <ArrowDownLeft size={20} />
                <span className="text-[10px] font-bold">Demander</span>
              </Button>

              {/* Rappel */}
              <Button
                disabled={!isUserContact || !isMutualFriend}
                onClick={() => navigate(`/scheduler/create?payerUserId=${contact.contactUserId}&payerName=${encodeURIComponent(contact.name)}`)}
                variant="utility"
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 h-auto ${
                  (!isUserContact || !isMutualFriend) && 'opacity-40 pointer-events-none grayscale border-dashed'
                }`}
              >
                <CalendarClock size={20} />
                <span className="text-[10px] font-bold">Rappel</span>
              </Button>
            </div>

            {/* Hints sous les boutons */}
            {!isUserContact ? (
              <p className="text-[10px] text-red-400 text-center font-bold -mt-1">
                Actions disponibles après inscription sur piYès
              </p>
            ) : !isMutualFriend ? (
              <p className="text-[10px] theme-text-secondary text-center -mt-1">
                Demander et Rappel nécessitent une amitié mutuelle piYès
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              {/* Interactions */}
              <Button
                disabled={!isUserContact}
                onClick={() => isUserContact && navigate(`/transfer-interactions?contactId=${contact.id}`)}
                variant="utility"
                fullWidth
                className={`py-3 rounded-xl font-bold text-xs transition-all ${
                  !isUserContact && 'opacity-40 pointer-events-none'
                }`}
              >
                Mes interactions avec {contact.name.split(' ')[0]}
              </Button>

              {/* Supprimer */}
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="text"
                fullWidth
                className="flex items-center justify-center gap-2 text-red-500 font-bold py-2 text-xs opacity-40 hover:opacity-100"
                leftIcon={<Trash2 size={14} />}
              >
                Supprimer le contact
              </Button>
            </div>
          </>
        )}

        {/* Actions mode edit */}
        {isEditing && (
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setIsEditing(false)}
              variant="secondary"
              fullWidth
              className="py-3.5 rounded-2xl font-bold text-sm"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveEdit}
              isLoading={saving}
              disabled={!editForm.name.trim()}
              variant="primary"
              fullWidth
              className="py-3.5 rounded-2xl font-bold text-sm shadow-lg"
              leftIcon={!saving && <Save size={16} />}
            >
              Sauvegarder
            </Button>
          </div>
        )}
      </div>

      {/* Modal suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm theme-card-bg rounded-[32px] p-8 space-y-6 text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black theme-text-main">Supprimer le contact ?</h3>
              <p className="text-xs theme-text-secondary">
                Êtes-vous sûr de vouloir supprimer <strong>{contact.name}</strong> de vos contacts ?
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleDelete}
                variant="danger"
                fullWidth
                className="py-3.5 rounded-2xl font-black text-sm"
              >
                Oui, supprimer
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="utility"
                fullWidth
                className="py-3 rounded-2xl font-bold text-sm"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetail;