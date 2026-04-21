import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  Camera,
  Send,
  Check,
  CreditCard,
  ShieldCheck,
  X,
  ShoppingBag,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";
import { useTranslation } from "../App";
import { messagingService } from "../services/messagingService";
import { Conversation, Message } from "../shared/types";

const ChatDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (id) {
      messagingService.getConversationById(id).then((data) => {
        if (data) {
          setChat(data);
          setTimeout(scrollToBottom, 100);
        }
        setLoading(false);
      });
    }
  }, [id]);

  const handleSend = async () => {
    if (!msg.trim() || !chat) return;
    const currentMsg = msg;
    setMsg(""); // Optimistic clear

    const sentMsg = await messagingService.sendMessage(
      chat.id,
      currentMsg,
      "u1",
    ); // u1 is current user
    setChat((prev) =>
      prev ? { ...prev, messages: [...prev.messages, sentMsg] } : null,
    );
    setTimeout(scrollToBottom, 50);
  };

  if (loading)
    return (
      <div className="fixed inset-0 theme-card-bg z-120 flex items-center justify-center">
        <Loader2 className="animate-spin theme-primary-text" size={40} />
      </div>
    );

  if (!chat)
    return (
      <div className="p-8 text-center theme-text-secondary">
        Conversation introuvable.
      </div>
    );

  return (
    <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md theme-card-bg z-120 flex flex-col animate-in slide-in-from-right duration-400">
      <header className="px-6 pt-12 pb-4 theme-card-bg border-b theme-border flex items-center gap-4 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 theme-text-secondary active:scale-90 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 theme-border overflow-hidden theme-bubble-bg shadow-sm">
              <img
                src={chat.counterparty.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h4 className="font-black theme-text-main text-sm">
                {chat.counterparty.name}
              </h4>
              {chat.counterparty.isVerified && (
                <ShieldCheck size={14} className="text-blue-500" />
              )}
            </div>
            <p className="text-[9px] theme-text-secondary font-black uppercase tracking-tight">
              Connecté
            </p>
          </div>
        </div>
        <button className="p-2 theme-text-secondary hover:theme-bubble-bg rounded-full">
          <Phone size={20} />
        </button>
        <button className="p-2 theme-text-secondary hover:theme-bubble-bg rounded-full">
          <MoreVertical size={20} />
        </button>
      </header>

      <div
        onClick={() => navigate(`/ad/${chat.adId}`)}
        className="px-6 py-3 theme-bubble-bg border-b theme-border flex items-center gap-3 active:opacity-70 transition-all cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden border theme-border shrink-0 shadow-sm">
          <img
            src={chat.adImage}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black theme-text-main truncate group-hover:theme-primary-text transition-colors">
            {chat.adTitle}
          </p>
          <p className="text-[11px] theme-primary-text font-black uppercase tracking-widest">
            {chat.adPrice.toLocaleString("fr-HT")} G.
          </p>
        </div>
        <ChevronRight size={14} className="theme-text-secondary opacity-30" />
      </div>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar flex flex-col">
        <div className="text-center py-2">
          <span className="text-[9px] font-black theme-text-secondary theme-bubble-bg px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border theme-border">
            {chat.role === "seller"
              ? `Vente : @${chat.counterparty.name.split(" ")[0]}`
              : `Achat : ${chat.adTitle}`}
          </span>
        </div>

        <div className="p-5 theme-bubble-bg rounded-4xl border theme-border flex gap-4 items-start mb-4 shadow-inner">
          <Info size={18} className="theme-primary-text shrink-0 mt-0.5" />
          <p className="text-[10px] theme-primary-text font-medium leading-relaxed italic">
            {chat.role === "seller"
              ? `Vous discutez avec ${chat.counterparty.name} à propos de votre annonce : ${chat.adTitle}.`
              : `Posez vos questions sur l'article de ${chat.counterparty.name}. Utilisez le paiement piYès pour plus de sécurité.`}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {chat.messages.map((m, i) => {
            const isMe = m.senderId === "u1";
            return (
              <div
                key={m.id}
                className={`flex flex-col gap-1.5 max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
              >
                <div
                  className={`p-4 rounded-[28px] border shadow-sm ${
                    isMe
                      ? "theme-primary-bg text-white rounded-br-none border-transparent"
                      : "theme-bubble-bg theme-text-main rounded-bl-none theme-border"
                  }`}
                >
                  <p className="text-sm font-medium leading-relaxed">
                    {m.text}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2">
                  <span className="text-[8px] font-black theme-text-secondary uppercase opacity-50">
                    {m.timestamp}
                  </span>
                  {isMe && (
                    <Check
                      size={10}
                      className="text-green-500"
                      strokeWidth={3}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-6 theme-card-bg border-t theme-border flex flex-col gap-4 animate-in slide-in-from-bottom shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3">
          <button className="p-4 theme-bubble-bg theme-primary-text rounded-2xl active:scale-90 transition-all border theme-border shadow-sm">
            <Camera size={22} />
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex-1 relative"
          >
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder={`Répondre à ${chat.counterparty.name.split(" ")[0]}...`}
              className="w-full theme-bubble-bg py-4 pl-6 pr-14 rounded-3xl outline-none theme-text-main text-sm focus:theme-card-bg focus:shadow-md transition-all border theme-border"
            />
            <button
              type="submit"
              disabled={!msg.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all ${msg.trim() ? "theme-primary-bg text-white shadow-lg active:scale-90" : "theme-text-secondary opacity-20"}`}
            >
              <Send size={18} />
            </button>
          </form>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              navigate(
                `/transfer?name=${encodeURIComponent(chat.role === "seller" ? chat.counterparty.name : chat.adTitle)}&amount=${chat.adPrice}`,
              )
            }
            className="flex-1 flex items-center justify-center gap-2 theme-bubble-bg theme-primary-text py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all border theme-border shadow-sm"
          >
            <CreditCard size={16} />{" "}
            {chat.role === "seller"
              ? "Proposer une remise"
              : "Payer avec piYès"}
          </button>
          <button className="p-3.5 theme-bubble-bg theme-text-secondary rounded-2xl border theme-border active:scale-95 shadow-sm">
            <ShoppingBag size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatDetail;
