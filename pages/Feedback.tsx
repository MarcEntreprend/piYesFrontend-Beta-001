import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Send, MessageCircle } from "lucide-react";
import PageHeader from "../components/PageHeader";

const Feedback: React.FC = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return alert("Veuillez donner une note !");
    setSent(true);
    setTimeout(() => {
      navigate(-1);
    }, 2000);
  };

  if (sent)
    return (
      <div className="theme-card-bg min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
          <Send size={40} />
        </div>
        <h2 className="text-2xl font-bold theme-text-main">
          Merci pour votre avis !
        </h2>
        <p className="theme-text-secondary text-sm">
          Votre retour nous aide à construire le futur de piYès.
        </p>
      </div>
    );

  return (
    <div className="theme-card-bg min-h-screen flex flex-col animate-in slide-in-from-right duration-500">
      <PageHeader
        title="Votre Avis"
        onBack={() => navigate(-1)}
        className="sticky top-0 theme-card-bg z-10 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />

      <div className="p-8 space-y-12 flex-1 flex flex-col">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 theme-bubble-bg rounded-2xl flex items-center justify-center theme-primary-text mx-auto mb-4">
            <MessageCircle size={32} />
          </div>
          <h2 className="text-xl font-bold theme-text-main">
            Aidez-nous à nous améliorer
          </h2>
          <p className="theme-text-secondary text-sm">
            Comment évalueriez-vous votre expérience avec piYès ?
          </p>
        </div>

        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              onClick={() => setRating(i)}
              className={`p-2 transition-all active:scale-75 ${rating >= i ? "text-amber-400" : "text-gray-200 dark:text-gray-700"}`}
            >
              <Star
                size={40}
                fill={rating >= i ? "currentColor" : "none"}
                strokeWidth={2.5}
              />
            </button>
          ))}
        </div>

        <div className="space-y-4 flex-1">
          <label className="text-xs font-bold theme-text-secondary uppercase tracking-widest">
            Commentaires (Optionnel)
          </label>
          <textarea
            placeholder="Racontez-nous ce que vous aimez ou ce que nous pourrions améliorer..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full h-40 bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl outline-none theme-text-main border theme-border focus:border-(--primary-color) transition-all resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full theme-primary-bg text-white py-4 rounded-full font-bold shadow-lg active:scale-95 transition-all"
        >
          Envoyer l'avis
        </button>
      </div>
    </div>
  );
};

export default Feedback;
