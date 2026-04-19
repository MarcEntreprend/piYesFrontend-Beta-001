// pages/ReceiptDetail.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
/* Use react-router core for hooks */
import { useNavigate, useParams, useLocation } from 'react-router';
import { ArrowLeft, Share2, ShieldCheck, Download, ExternalLink, FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { receiptService } from '../services/receiptService';
import { useTranslation } from '../App';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';

const ReceiptDetail: React.FC = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  /* Manual searchParams implementation */
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      const type = searchParams.get('type') || 'transfer';
      const role = searchParams.get('role') || 'payer';
      receiptService.getReceipt(id, type, role)
        .then(data => {
          setReceipt(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id, searchParams]);

  const handleShare = async () => {
    setExporting(true);
    try {
      // Générer l'image du reçu via HTML propre (sans oklch)
      const imgBlob = await generateReceiptImageBlob();
      
      if (navigator.share && imgBlob) {
        // Partage natif avec fichier image — demande PDF ou image au user
        const file = new File([imgBlob], `recu-piyes-${receipt.id}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Reçu piYès - ${receipt.id}`,
            text: `Reçu de transaction piYès: ${receipt.amount} G. ID: ${receipt.external_id}`,
            files: [file],
          });
        } else {
          // Fallback : partage texte + URL si le device ne supporte pas les fichiers
          await navigator.share({
            title: `Reçu piYès - ${receipt.id}`,
            text: `Reçu de transaction piYès: ${receipt.amount} G. ID: ${receipt.external_id}`,
            url: window.location.href,
          });
        }
      } else {
        // Fallback desktop : copier le lien
        navigator.clipboard.writeText(window.location.href);
        alert('Lien copié dans le presse-papier');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    } finally {
      setExporting(false);
    }
  };

  /**
   * Génère un blob PNG du reçu à partir d'un HTML statique propre,
   * sans couleurs oklch (incompatibles avec html2canvas).
   * Inspiré de l'approche Report.tsx qui génère un HTML puis ouvre dans un nouvel onglet.
   */
  const generateReceiptImageBlob = async (): Promise<Blob | null> => {
    const formattedDate = formatDate(receipt.date);
    const typeLabel = receipt.receipt_type;
    const statusLabel = getStatusLabel(receipt.status);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { font-family: Arial, sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #fff; padding: 0; width: 400px; }
          .receipt { background: #fff; border-radius: 24px; overflow: hidden; border: 1px solid #f0f0f0; }
          .body { padding: 32px; }
          .header { text-align: center; margin-bottom: 24px; }
          .brand { font-size: 22px; font-weight: 900; color: #830AD1; letter-spacing: -1px; }
          .type { font-size: 9px; font-weight: 900; color: #aaa; text-transform: uppercase; letter-spacing: 3px; margin-top: 2px; }
          .amount { font-size: 36px; font-weight: 900; color: #111; margin: 12px 0 2px; }
          .fees-note { font-size: 9px; color: #aaa; font-style: italic; }
          .status { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px; color: ${receipt.status === 'success' || receipt.status === 'completed' ? '#16a34a' : receipt.status === 'pending' ? '#d97706' : '#dc2626'}; }
          .date { font-size: 10px; color: #aaa; margin-top: 4px; }
          .divider { text-align: center; color: #eee; font-size: 10px; letter-spacing: 2px; margin: 16px 0; overflow: hidden; white-space: nowrap; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 8px; margin: 16px 0; }
          .field-label { font-size: 8px; font-weight: 900; color: #aaa; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2px; }
          .field-value { font-size: 11px; font-weight: 700; color: #111; }
          .party-label { font-size: 9px; font-weight: 900; color: #aaa; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
          .party-name { font-size: 13px; font-weight: 900; color: #111; }
          .party-detail { font-size: 9px; color: #777; margin-top: 2px; }
          .separator { height: 1px; background: #f5f5f5; margin: 12px 0; }
          .ext-id { font-size: 9px; font-family: monospace; color: #aaa; word-break: break-all; line-height: 1.5; }
          .footer { background: #f9f4ff; padding: 24px; text-align: center; }
          .footer-brand { font-size: 13px; font-weight: 900; color: #830AD1; }
          .footer-thanks { font-size: 9px; color: #777; margin-top: 2px; }
          .footer-contact { font-size: 9px; font-weight: 700; color: #555; margin-top: 4px; line-height: 1.8; }
          .footer-email { color: #830AD1; }
          .footer-note { font-size: 8px; color: #aaa; font-style: italic; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="body">
            <div class="header">
              <div class="brand">piYès</div>
              <div class="type">${typeLabel}</div>
              <div class="amount">${receipt.amount.toLocaleString('fr-HT')} G *</div>
              <div class="fees-note">* Aucun frais appliqué pour ce transfert</div>
              <div class="status">${statusLabel}</div>
              <div class="date">${formattedDate}</div>
            </div>
            <div class="divider">────────────────────────────────────</div>
            <div class="grid">
              <div>
                <div class="field-label">Code d'autorisation</div>
                <div class="field-value">${receipt.auth_code || 'N/A'}</div>
              </div>
              <div>
                <div class="field-label">ID de transaction</div>
                <div class="field-value">${receipt.external_id?.slice(0, 12) || 'N/A'}</div>
              </div>
              ${receipt.moncashTransactionId ? `
              <div>
                <div class="field-label">ID MonCash</div>
                <div class="field-value">${receipt.moncashTransactionId}</div>
              </div>` : ''}
            </div>
            <div class="divider">────────────────────────────────────</div>
            ${receipt.receiver ? `
            <div style="margin-bottom:12px">
              <div class="party-label">Bénéficiaire</div>
              <div class="party-name">${receipt.receiver.name}</div>
              <div class="party-detail">ID: ${receipt.receiver.idNumber || 'N/A'}</div>
              <div class="party-detail">Banque: ${receipt.receiver.bank || 'piYès'}</div>
              <div class="party-detail">compte: ${receipt.receiver.masked_account || '••••00-6'}</div>
            </div>` : ''}
            <div class="separator"></div>
            ${receipt.sender ? `
            <div style="margin-bottom:12px">
              <div class="party-label">Expéditeur</div>
              <div class="party-name">${receipt.sender.name}</div>
              <div class="party-detail">ID: ${receipt.sender.idNumber || 'N/A'}</div>
              <div class="party-detail">Banque: ${receipt.sender.bank || 'piYès'}</div>
              <div class="party-detail">compte: ${receipt.sender.masked_account || '••••00-6'}</div>
            </div>` : ''}
            ${receipt.description ? `
            <div class="separator"></div>
            <div>
              <div class="field-label">Note</div>
              <div class="field-value" style="font-size:11px">${receipt.description}</div>
            </div>` : ''}
            <div class="divider">────────────────────────────────────</div>
            <div>
              <div class="field-label">Identifiant Externe</div>
              <div class="ext-id">${receipt.external_id}</div>
            </div>
          </div>
          <div class="footer">
            <div class="footer-brand">piYès</div>
            <div class="footer-thanks">Merci d'avoir utilisé piYès !</div>
            <div class="footer-contact">
              Téléphone : +509 29 99 9999<br/>
              SMS / WhatsApp : +509 28 88 8888<br/>
              <span class="footer-email">paiements@piyes.ht</span>
            </div>
            <div class="footer-note">Service clientèle disponible en semaine, de 8h am à 4h pm</div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Ouvrir dans iframe caché pour capturer
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:400px;height:auto;border:none;visibility:hidden;';
      document.body.appendChild(iframe);
      
      iframe.contentDocument!.open();
      iframe.contentDocument!.write(html);
      iframe.contentDocument!.close();

      // Attendre le rendu
      await new Promise(r => setTimeout(r, 300));

      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(iframe.contentDocument!.body, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 400,
        // Pas de oklch ici — HTML statique avec couleurs hex uniquement
      });

      document.body.removeChild(iframe);

      return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png', 0.95));
    } catch (err) {
      console.error('Error generating receipt blob:', err);
      return null;
    }
  };

  const exportReceipt = async (format: 'pdf' | 'image') => {
    setExporting(true);
    setShowDownloadModal(false);

    try {
      if (format === 'image') {
        // Export PNG via blob HTML statique (sans oklch)
        const blob = await generateReceiptImageBlob();
        if (!blob) throw new Error('Failed to generate image');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `recu-piyes-${receipt.id}.png`;
        link.click();
        URL.revokeObjectURL(url);

      } else {
        // Export PDF : convertir le blob en base64 et l'injecter directement dans le HTML
        // Évite le problème des blob: URLs qui ne sont pas accessibles cross-window
        const blob = await generateReceiptImageBlob();
        if (!blob) throw new Error('Failed to generate image');

        // Convertir le blob en base64 pour pouvoir l'injecter dans la nouvelle fenêtre
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const pdfHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Reçu piYès</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { display:flex; justify-content:center; align-items:flex-start; padding:20px; background:#fff; }
    img { max-width:100%; height:auto; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
    @media print { body { padding:0; } img { box-shadow:none; border-radius:0; } }
  </style>
</head>
<body>
  <img src="${base64}" alt="Reçu piYès" />
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 600);
    };
  </script>
</body>
</html>`;
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(pdfHtml);
          win.document.close();
        }
      }
    } catch (err) {
      console.error('Error exporting receipt:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="theme-card-bg min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#830AD1]/30 border-t-[#830AD1] rounded-full animate-spin"></div>
    </div>
  );

  if (!receipt) return <div className="p-8 text-center theme-text-secondary">{t('common.error')}</div>;

  // Dynamic label for transaction type based on language keys
  const typeLabel = t(`receipt.types.${receipt.receipt_type}` as any) || receipt.receipt_type;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'Réussi !';
      case 'pending':
        return 'En attente...';
      case 'failed':
        return 'Échoué :(';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-amber-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="theme-card-bg min-h-screen pb-20">
     <PageHeader
      title={t('receipt.title')}
      onBack={() => navigate(-1)}
      rightElement={
        <button 
          onClick={handleShare} 
          className="p-2 theme-primary-text active:scale-90 transition-transform"
        >
          <Share2 size={24} />
        </button>
      }
      className="sticky top-0 theme-card-bg z-10 border-b theme-border hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
    />


      <div className="px-6 py-4">
        <div ref={receiptRef} className="bg-white text-black rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex flex-col">
          <div className="p-8 space-y-8 flex-1">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl font-black tracking-tighter text-[#830AD1]">piYès</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{typeLabel}</p>
              </div>
              
             <div className="space-y-1">
  <p className="text-4xl font-black text-black">
    {receipt.amount.toLocaleString('fr-HT')} G
    <span className="align-top text-sm">*</span>
  </p>
  <p className="text-[9px] text-gray-400 italic">
    * Aucun frais appliqué pour ce transfert
  </p>
</div>


              <div className="flex flex-col items-center gap-1">
                <p className={`text-sm font-black uppercase tracking-widest ${getStatusColor(receipt.status)}`}>
                  {getStatusLabel(receipt.status)}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">
                  {formatDate(receipt.date)}
                </p>
              </div>
            </div>

            <div className="text-center text-gray-200 font-light tracking-widest overflow-hidden whitespace-nowrap">
              --------------------------------------------------------------------------------
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Code d'autorisation</p>
                <p className="text-xs font-bold text-black">{receipt.auth_code || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ID de transaction</p>
                <p className="text-xs font-bold text-black">{receipt.external_id?.slice(0, 12) || 'N/A'}</p>
              </div>
              {receipt.moncashTransactionId && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ID MonCash</p>
                  <p className="text-xs font-bold text-black">{receipt.moncashTransactionId}</p>
                </div>
              )}
            </div>

            <div className="text-center text-gray-200 font-light tracking-widest overflow-hidden whitespace-nowrap">
              --------------------------------------------------------------------------------
            </div>

            {/* Parties */}
            <div className="space-y-6">
              {receipt.receiver && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bénéficiaire</p>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-black">{receipt.receiver.name}</p>
                    <div className="flex flex-col text-[10px] text-gray-500 font-medium">
                      <span>ID: {receipt.receiver.idNumber || 'N/A'}</span>
                      <span>Banque: {receipt.receiver.bank || 'piYès'}</span>
                      <p className="font-mono text-gray-400">compte : {receipt.receiver.masked_account || '••••00-6'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-50"></div>

              {receipt.sender && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expéditeur</p>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-black">{receipt.sender.name}</p>
                    <div className="flex flex-col text-[10px] text-gray-500 font-medium">
                      <span>ID: {receipt.sender.idNumber || 'N/A'}</span>
                      <span>Banque: {receipt.sender.bank || 'piYès'}</span>
                      <p className="font-mono text-gray-400">compte : {receipt.sender.masked_account || '••••00-6'}</p>
                    </div>
                  </div>
                </div>
              )}

              {receipt.description && (
                <>
                  <div className="h-px bg-gray-50"></div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Note</p>
                    <p className="text-xs font-bold text-black">{receipt.description}</p>
                  </div>
                </>
              )}
            </div>

            <div className="text-center text-gray-200 font-light tracking-widest overflow-hidden whitespace-nowrap">
              --------------------------------------------------------------------------------
            </div>

            {/* External ID */}
            <div className="space-y-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Identifiant Externe</p>
              <p className="text-[10px] font-mono text-gray-400 break-all leading-tight">{receipt.external_id}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-purple-50 p-8 text-center space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-black text-[#830AD1]">piYès</p>
              <p className="text-[10px] font-bold text-gray-500">Merci d’avoir utilisé piYès !</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Besoin d’aide ? Contactez-nous :</p>
              <div className="space-y-1 text-[10px] font-bold text-gray-600">
                <p>Téléphone : +509 29 99 9999</p>
                <p>SMS / WhatsApp : +509 28 88 8888</p>
                <p className="text-[#830AD1]">paiements@piyes.ht</p>
              </div>
            </div>

            <p className="text-[8px] text-gray-400 italic">
              Service clientèle disponible en semaine, de 8h am à 4h pm
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-4">
        <button 
          onClick={() => setShowDownloadModal(true)}
          disabled={exporting}
          className="w-full theme-bubble-bg theme-primary-text py-5 rounded-[20px] font-black flex items-center justify-center gap-3 active:scale-95 transition-all border theme-border uppercase tracking-widest text-xs"
        >
          {exporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          {t('receipt.download')}
        </button>
      </div>

      <Modal isOpen={showDownloadModal} onClose={() => setShowDownloadModal(false)}>
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold theme-text-main">Télécharger le reçu</h2>
            <button onClick={() => setShowDownloadModal(false)} className="p-2 theme-bubble-bg rounded-full theme-text-secondary">
              <X size={20} />
            </button>
          </div>
          <p className="theme-text-secondary text-sm">Choisissez le format de fichier souhaité pour votre reçu.</p>
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => exportReceipt('pdf')}
              className="w-full theme-bubble-bg p-5 rounded-2xl flex items-center gap-4 border theme-border active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0">
                <FileText size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold theme-text-main">Format PDF</p>
                <p className="text-xs theme-text-secondary">Idéal pour l'impression et l'archivage</p>
              </div>
            </button>
            <button 
              onClick={() => exportReceipt('image')}
              className="w-full theme-bubble-bg p-5 rounded-2xl flex items-center gap-4 border theme-border active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0">
                <ImageIcon size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold theme-text-main">Format Image (PNG)</p>
                <p className="text-xs theme-text-secondary">Idéal pour le partage rapide</p>
              </div>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReceiptDetail;
