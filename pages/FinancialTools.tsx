// pages/FinancialTools.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  PieChart, 
  RefreshCw, 
  FileText, 
  Banknote, 
  ArrowRight,
  X,
  Delete,
  Grid,
  ChevronRight,
  Zap,
  Divide,
  Minus,
  Plus,
  Equal,
  Clock,
  Trash2
} from 'lucide-react';
import Modal from '../components/Modal';
import { useTranslation } from '../App';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';

const FinancialTools: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);

  // Define tools array
  const tools = [
    {
      id: 'analysis',
      title: t('tools.items.analysis.title'),
      description: t('tools.items.analysis.desc'),
      icon: <PieChart size={24} />,
      route: '/report',
      badge: t('tools.items.analysis.badge')
    },
    {
      id: 'converter',
      title: t('tools.items.converter.title'),
      description: t('tools.items.converter.desc'),
      icon: <RefreshCw size={24} />,
      route: '/advanced'
    },
    {
      id: 'statements',
      title: t('tools.items.statements.title'),
      description: t('tools.items.statements.desc'),
      icon: <FileText size={24} />,
      route: '/report'
    },
    {
      id: 'credit',
      title: t('tools.items.credit.title'),
      description: t('tools.items.credit.desc'),
      icon: <Banknote size={24} />,
      route: '/help',
      badge: t('tools.items.credit.badge')
    }
  ];

  // Calculator states
  const [formula, setFormula] = useState('');
  const [result, setResult] = useState('0');
  const [isEvaluated, setIsEvaluated] = useState(false);

  // History state
  const [history, setHistory] = useState<{ formula: string; result: string }[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);

  // Restaurer l'état si on revient depuis /request-payment
  useEffect(() => {
    const savedFormula = sessionStorage.getItem('calc_formula');
    const savedResult = sessionStorage.getItem('calc_result');
    if (savedFormula && savedResult) {
      setFormula(savedFormula);
      setResult(savedResult);
      setIsEvaluated(true);
      sessionStorage.removeItem('calc_formula');
      sessionStorage.removeItem('calc_result');
    }
    // Charger l'historique existant
    const saved = sessionStorage.getItem('calc_history');
    const parsed = saved ? JSON.parse(saved) : [];
    setHasHistory(parsed.length > 0);
  }, []);

  // Calcul live à chaque changement de formula
  useEffect(() => {
    if (!formula) { setResult('0'); return; }
    try {
      const sanitized = formula.replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '/100');
      // eslint-disable-next-line no-eval
      const res = eval(sanitized);
      if (typeof res === 'number' && isFinite(res)) setResult(res.toString());
    } catch (e) {}
  }, [formula]);

  const handleInput = (val: string) => {
    if (isEvaluated) {
      if (!isNaN(Number(val)) || val === '(' || val === '.') {
        setFormula(val);
      } else {
        setFormula(result + val);
      }
      setIsEvaluated(false);
    } else {
      setFormula(prev => prev + val);
    }
  };

  const handlePlusMinus = () => {
    if (isEvaluated) {
        setFormula(result.startsWith('-') ? result.substring(1) : '-' + result);
        setIsEvaluated(false);
        return;
    }
    if (formula === '' || formula === '0') {
        setFormula('-');
    } else if (formula.endsWith('(-')) {
        setFormula(formula.slice(0, -2));
    } else {
        setFormula(formula + '*-1');
    }
  };

  const handleParenthesis = () => {
    const openCount = (formula.match(/\(/g) || []).length;
    const closeCount = (formula.match(/\)/g) || []).length;
    if (openCount > closeCount && !isNaN(Number(formula.slice(-1)))) {
      handleInput(')');
    } else {
      handleInput('(');
    }
  };

  const handleClear = () => {
    setFormula('');
    setResult('0');
    setIsEvaluated(false);
  };

  const handleBackspace = () => {
    if (isEvaluated) {
        setIsEvaluated(false);
        return;
    }
    setFormula(prev => prev.slice(0, -1));
  };

  const onEquals = () => {
    if (!formula) return;
    try {
      const sanitized = formula.replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '/100');
      // eslint-disable-next-line no-eval
      const finalRes = eval(sanitized);
      setResult(finalRes.toString());

      // Sauvegarder dans l'historique (3 dernières opérations)
      setHistory(prev => {
        const newEntry = { formula, result: finalRes.toString() };
        const updated = [newEntry, ...prev].slice(0, 3);
        sessionStorage.setItem('calc_history', JSON.stringify(updated));
        setHasHistory(true);
        return updated;
      });

      setIsEvaluated(true);
    } catch (e) {
      setResult(t('tools.calculator.error'));
    }
  };

  const CalcButton = ({ label, onClick, className = "", variant = "number" }: any) => {
    let baseStyle = "h-16 rounded-full font-medium text-2xl flex items-center justify-center transition-all active:scale-90 select-none shadow-sm";
    
    if (variant === "number") {
      baseStyle += " theme-card-bg theme-text-main";
    } else if (variant === "operator") {
      baseStyle += " theme-bubble-bg theme-primary-text";
    } else if (variant === "action") {
      baseStyle += " theme-bubble-bg theme-text-secondary";
    } else if (variant === "clear") {
      baseStyle += " bg-red-50 text-red-500";
    } else if (variant === "primary") {
      baseStyle += " theme-primary-bg text-white shadow-xl";
    }

    return (
      <button onClick={onClick} className={`${baseStyle} ${className}`}>
        {label}
      </button>
    );
  };

  return (
    <div className="theme-card-bg min-h-screen flex flex-col pb-6">
      <PageHeader 
  title={t('tools.calculator.title')}
  onBack={() => navigate(-1)}
  rightElement={
    <button 
      onClick={() => setIsToolsModalOpen(true)}
      className="flex items-center gap-2 px-4 py-2 theme-bubble-bg rounded-full theme-primary-text font-bold text-[10px] uppercase tracking-wider active:scale-95 transition-all border theme-border"
    >
      <Grid size={14} /> {t('tools.calculator.others')}
    </button>
  }
  className="sticky top-0 theme-card-bg z-20 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
/>


      <div className="flex-1 flex flex-col animate-in fade-in duration-500">
        <div className="flex flex flex-col justify-end py-2 px-8 text-right space-y-4">
          <div className="min-h-[3rem] flex items-center justify-end overflow-hidden">
            <p className={`transition-all duration-300 break-all font-light tracking-wide ${isEvaluated ? 'text-lg theme-text-secondary' : 'text-5xl theme-text-main'}`}>
              {formula || '0'}
            </p>
          </div>
          
          <div className="flex flex-col items-end">
            <p className={`transition-all duration-300 font-medium ${isEvaluated ? 'text-6xl theme-primary-text' : 'text-3xl theme-text-secondary opacity-50'}`}>
              {parseFloat(result).toLocaleString('fr-HT', { maximumFractionDigits: 4 })}
            </p>
          </div>
        </div>

        <div className="px-8 pb-4 flex items-center justify-between border-b theme-border">
            <div className="flex items-center gap-6">
              <Clock
                size={20}
                onClick={() => {
                  // Charger l'historique depuis sessionStorage avant d'ouvrir le modal
                  const saved = sessionStorage.getItem('calc_history');
                  const parsed = saved ? JSON.parse(saved) : [];
                  setHistory(parsed);
                  setHasHistory(parsed.length > 0);
                  setShowHistoryModal(true);
                }}
                className={`transition-colors ${
                  hasHistory
                    ? 'theme-text-secondary opacity-60 hover:theme-primary-text cursor-pointer'
                    : 'theme-text-secondary opacity-20 cursor-default pointer-events-none'
                }`}
              />
            </div>
            <button onClick={handleBackspace} className="p-2 theme-text-secondary hover:text-red-500 transition-colors active:scale-90">
                <Delete size={22} />
            </button>
        </div>

        <div className="grid grid-cols-4 gap-4 p-8 pt-6">
          <CalcButton label={<span className="text-red-500">C</span>} variant="number" onClick={handleClear} />
          <CalcButton label="( )" variant="operator" onClick={handleParenthesis} />
          <CalcButton label="%" variant="operator" onClick={() => handleInput('%')} />
          <CalcButton label={<Divide size={24} />} variant="operator" onClick={() => handleInput('÷')} />

          <CalcButton label="7" onClick={() => handleInput('7')} />
          <CalcButton label="8" onClick={() => handleInput('8')} />
          <CalcButton label="9" onClick={() => handleInput('9')} />
          <CalcButton label={<X size={24} />} variant="operator" onClick={() => handleInput('×')} />

          <CalcButton label="4" onClick={() => handleInput('4')} />
          <CalcButton label="5" onClick={() => handleInput('5')} />
          <CalcButton label="6" onClick={() => handleInput('6')} />
          <CalcButton label={<Minus size={24} />} variant="operator" onClick={() => handleInput('-')} />

          <CalcButton label="1" onClick={() => handleInput('1')} />
          <CalcButton label="2" onClick={() => handleInput('2')} />
          <CalcButton label="3" onClick={() => handleInput('3')} />
          <CalcButton label={<Plus size={24} />} variant="operator" onClick={() => handleInput('+')} />

          <CalcButton label="+/-" onClick={handlePlusMinus} />
          <CalcButton label="0" onClick={() => handleInput('0')} />
          <CalcButton label="." onClick={() => handleInput('.')} />
          <CalcButton label={<Equal size={28} />} variant="primary" onClick={onEquals} />
        </div>

        <div className="px-8 pb-4">
          <Button
            fullWidth
            disabled={parseFloat(result) <= 0}
            onClick={() => {
              // Sauvegarder l'état avant de naviguer pour pouvoir restaurer au retour
              sessionStorage.setItem('calc_formula', formula);
              sessionStorage.setItem('calc_result', result);
              navigate(`/request-payment?amount=${result}`);
            }}
            rightIcon={<ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />}
          >
            {t('tools.calculator.collect')}
          </Button>
        </div>
      </div>

      <Modal isOpen={isToolsModalOpen} onClose={() => setIsToolsModalOpen(false)}>
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold theme-text-main">{t('tools.calculator.modal_title')}</h2>
              <p className="text-xs theme-text-secondary mt-1">{t('tools.calculator.modal_sub')}</p>
            </div>
            <button onClick={() => setIsToolsModalOpen(false)} className="p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {tools.map((tool) => (
              <button 
                key={tool.id}
                onClick={() => { setIsToolsModalOpen(false); navigate(tool.route); }}
                className="flex items-center justify-between p-5 theme-card-bg border theme-border rounded-[32px] hover:theme-bubble-bg transition-all text-left active:scale-[0.98] group shadow-sm"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 theme-bubble-bg rounded-2xl flex items-center justify-center theme-primary-text group-hover:scale-110 transition-transform border theme-border">
                    {tool.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold theme-text-main text-sm">{tool.title}</h4>
                      {tool.badge && (
                        <span className="text-[8px] font-bold theme-bubble-bg theme-text-secondary px-2 py-0.5 rounded-full uppercase tracking-tighter border theme-border">{tool.badge}</span>
                      )}
                    </div>
                    <p className="text-[10px] theme-text-secondary leading-relaxed max-w-[180px]">{tool.description}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="theme-text-secondary opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </Modal>

{/* Modal historique des 3 dernières opérations */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-[60] animate-in fade-in duration-300">
          <div className="w-full max-w-md mx-auto theme-card-bg rounded-t-[32px] p-6 space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold theme-text-main">
                {t('tools.calculator.history_title') || 'Historique (3 dernières)'}
              </h3>
              <div className="flex items-center gap-2">
                {/* Bouton supprimer tout l'historique */}
                <button
                  onClick={() => {
                    sessionStorage.removeItem('calc_history');
                    setHistory([]);
                    setHasHistory(false);
                    setShowHistoryModal(false);
                  }}
                  className="p-2 theme-text-secondary hover:text-red-500 transition-colors active:scale-90"
                >
                  {/* Trash icon via lucide — déjà importé si tu l'ajoutes */}
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 theme-text-secondary active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {history.length > 0 ? (
                history.map((entry, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // Restaurer l'opération sélectionnée
                      setFormula(entry.formula);
                      setResult(entry.result);
                      setIsEvaluated(true);
                      setShowHistoryModal(false);
                    }}
                    className="w-full text-left p-4 theme-bubble-bg rounded-2xl border theme-border active:scale-[0.98] transition-all"
                  >
                    <p className="text-sm theme-text-secondary">{entry.formula}</p>
                    <p className="text-xl font-bold theme-primary-text">
                      = {parseFloat(entry.result).toLocaleString('fr-HT', { maximumFractionDigits: 4 })}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm theme-text-secondary text-center py-4">Aucun historique.</p>
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full theme-primary-bg text-white py-4 rounded-full font-bold active:scale-95 transition-all"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinancialTools;