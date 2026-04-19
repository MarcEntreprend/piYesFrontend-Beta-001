
import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import Modal from './Modal';
import { aiService } from '../services/aiService';
import { useTranslation } from '../App';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AiSupportChatProps {
  isOpen: boolean;
  onClose: () => void;
  context: string;
}

const AiSupportChat: React.FC<AiSupportChatProps> = ({ isOpen, onClose, context }) => {
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        text: `Bonjour ! Je suis l'assistant piYès. Comment puis-je vous aider au sujet de **${context}** ?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [isOpen, context, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = await aiService.getSupportResponse(input, context, language);

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: response,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMsg]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} type="bottom-sheet">
      <div className="flex flex-col h-[80vh] animate-in slide-in-from-bottom duration-500">
        {/* Header */}
        <div className="px-6 py-4 border-b theme-border flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 theme-primary-bg text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-black theme-text-main text-sm uppercase tracking-wider">Assistant piYès</h3>
              <p className="text-[10px] theme-text-secondary font-bold uppercase opacity-60">Support Intelligent</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-white dark:bg-black/20 shadow-inner">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col gap-1.5 max-w-[85%] ${m.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
              <div className={`p-4 rounded-[24px] border shadow-sm ${
                m.role === 'user' 
                ? 'theme-primary-bg text-white rounded-br-none border-transparent' 
                : 'theme-bubble-bg theme-text-main rounded-bl-none theme-border'
              }`}>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                    {m.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="font-black">{part}</strong> : part)}
                </p>
              </div>
              <span className="text-[8px] font-black theme-text-secondary uppercase opacity-50 px-2">{m.timestamp}</span>
            </div>
          ))}
          {isTyping && (
            <div className="flex flex-col gap-1.5 self-start items-start animate-pulse">
              <div className="p-4 rounded-[24px] rounded-bl-none theme-bubble-bg theme-border border shadow-sm">
                <Loader2 size={16} className="animate-spin theme-text-secondary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t theme-border shrink-0 bg-gray-50/30 dark:bg-white/5">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center gap-3"
          >
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 theme-bubble-bg py-4 pl-6 pr-14 rounded-[24px] outline-none theme-text-main text-sm focus:theme-card-bg border theme-border shadow-sm transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className={`absolute right-2 p-2.5 rounded-full transition-all ${input.trim() && !isTyping ? 'theme-primary-bg text-white shadow-lg active:scale-90' : 'theme-text-secondary opacity-20'}`}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default AiSupportChat;
