// pages/ReceiptDetail.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { Share2, Download, FileText, Image as ImageIcon, X, CheckCircle } from 'lucide-react';
import { receiptService } from '../services/receiptService';
import { useTranslation } from '../App';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Button from "../components/Button";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { financeService } from '../services/financeService';
import { TransactionType } from '../shared/types';

const ReceiptDetail: React.FC = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    if (id) {
      const type = searchParams.get('type') || 'transfer';
      const role = searchParams.get('role') || 'payer';

      receiptService.getReceipt(id, type, role)
        .then(data => {
          if (!cancelled) {
            setReceipt(data);
            setLoading(false);
          }
        })
        .catch(err => {
          if (!cancelled) {
            console.error(err);
            setLoading(false);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [id, searchParams]);

  // --- Tous les hooks sont regroupés ici, avant tout return conditionnel ---


  // Note automatique basée sur le type de transaction
  const automaticNote = useMemo(() => {
    if (!receipt) return '';

    const txTypeRaw = receipt.receipt_type;
    const txTypeNormalized = typeof txTypeRaw === 'string' ? txTypeRaw.toUpperCase() : txTypeRaw;
    const description = receipt.description || '';

    // Sous-types P2P détectés via la description
    if (txTypeNormalized === 'TRANSFER' || txTypeNormalized === 'P2P') {
      if (description.includes('via clé') || description.includes('Transfert à')) return 'Transfert via clé';
      if (description.includes('Rappel')) return 'Rappel de transfert';
      if (description.includes('lien') || description.includes('Link')) return 'Paiement par lien';
      if (description.includes('QR')) return 'Paiement par QR Code';
    }

    switch (txTypeNormalized) {
      case 'MOBILE_RECHARGE':
      case 'RECHARGE':
        return 'Recharge mobile';
      case 'DEPOSIT':
        return 'Dépôt sur compte';
      case 'WITHDRAWAL':
      case 'WITHDRAW':
        return 'Retrait de fonds';
      case 'P2P_KEY':
        return 'Transfert via clé';
      case 'P2P_SCHEDULE':
        return 'Rappel de transfert';
      case 'P2P_LINK':
        return 'Paiement par lien';
      case 'P2P_QR':
        return 'Paiement par QR Code';
      case 'INTERNATIONAL':
        return 'Transfert international';
      case 'INTERBANK_IN': {
        const receiverBank = receipt.receiver?.bank || 'Autre institution';
        return `Transfert inter-bancaire : piYès → ${receiverBank}`;
      }
      case 'INTERBANK_OUT': {
        const senderBank = receipt.sender?.bank || 'Autre institution';
        return `Transfert inter-bancaire : ${senderBank} → piYès`;
      }
      default:
        // Fallback pour TRANSFER non reconnu
        if (txTypeNormalized === 'TRANSFER') {
          // Vérifier si c'est interbancaire
          const senderBank = receipt.sender?.bank?.toLowerCase() || '';
          const receiverBank = receipt.receiver?.bank?.toLowerCase() || '';
          if (senderBank.includes('piyès') && receiverBank && !receiverBank.includes('piyès')) {
            return `Transfert inter-bancaire : piYès → ${receipt.receiver?.bank || 'Autre institution'}`;
          }
          if (!senderBank.includes('piyès') && receiverBank.includes('piyès')) {
            return `Transfert inter-bancaire : ${receipt.sender?.bank || 'Autre institution'} → piYès`;
          }
          // P2P standard si aucun sous-type détecté
          return 'Transfert via clé';
        }
        return '';
    }
  }, [receipt]);

  const feeDisplayText = useMemo(() => {
    if (!receipt) return '✨ Aucun frais appliqué !';
    // Détermine le contexte des frais
    const txTypeRaw = receipt.receipt_type;
    const txTypeNormalized = typeof txTypeRaw === 'string' ? txTypeRaw.toUpperCase() : txTypeRaw;
    const isInternational = txTypeNormalized === 'INTERNATIONAL';
    let isInterbankOut = false;
    if (txTypeNormalized === 'TRANSFER') {
      const senderBank = receipt.sender?.bank?.toLowerCase() || '';
      const receiverBank = receipt.receiver?.bank?.toLowerCase() || '';
      isInterbankOut = senderBank.includes('piyès') && receiverBank && !receiverBank.includes('piyès');
    }

    const hasFees = isInternational || isInterbankOut;
    const totalPercent = isInternational ? 1 : (isInterbankOut ? 0.5 : 0);

    if (!hasFees) {
      const messages = [
        "🎉 Aucun frais appliqué ! Avec piYaès, l'argent circule librement.",
        "✨ Transfert gratuit — piYès ne prend rien sur cette opération.",
        "💜 Zéro frais. C'est ça, le transfert d'argent nouvelle génération.",
        "🚀 Aucun frais ! Continuez à profiter de piYès sans limite.",
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    if (isInterbankOut) {
      return `🔹 Seulement ${totalPercent}% de frais pour ce transfert interbancaire. Avec piYès, vous économisez !`;
    }
    return `🌍 Frais internationaux : seulement ${totalPercent}%. piYès vous offre le meilleur taux.`;
  }, [receipt]);

  // Fonctions utilitaires (pas des hooks, peuvent rester ici)
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

  // --- Fin des hooks et fonctions utilitaires ---

  if (loading) return (
    <div className="theme-card-bg min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#830AD1]/30 border-t-[#830AD1] rounded-full animate-spin"></div>
    </div>
  );

  if (!receipt) return <div className="p-8 text-center theme-text-secondary">{t('common.error')}</div>;

  const typeLabel = t(`receipt.types.${receipt.receipt_type}` as any) || receipt.receipt_type;

  // --- Reste du code original (handleShare, generateReceiptImageBlob, exportReceipt, etc.) ---
  // (Je n'ai pas modifié ces parties ; elles restent telles quelles)

  const handleShare = async () => {
    setExporting(true);
    try {
      // Générer l'image du reçu
      const imgBlob = await generateReceiptImageBlob();
      if (!imgBlob) throw new Error('Failed to generate image');

      const fileName = `recu-piyes-${receipt.external_id || receipt.id}.png`;

      if (Capacitor.isNativePlatform()) {
        // Mobile : utiliser Capacitor Share
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(imgBlob);
        });

        // Sauvegarder temporairement dans le cache
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        const fileInfo = await Filesystem.getUri({
          directory: Directory.Cache,
          path: fileName,
        });

        await Share.share({
          title: 'Reçu piYès',
          text: `Reçu de transaction piYès : ${receipt.amount} G. ID: ${receipt.external_id}`,
          url: fileInfo.uri,
          dialogTitle: 'Partager le reçu',
        });
      } else if (navigator.share && navigator.canShare) {
        // Desktop avec Web Share API
        const file = new File([imgBlob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Reçu piYès',
            text: `Reçu de transaction piYès : ${receipt.amount} G.`,
            files: [file],
          });
        } else {
          // Fallback : téléchargement
          const url = URL.createObjectURL(imgBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);
        }
      } else {
        // Fallback desktop : copier le lien
        navigator.clipboard.writeText(window.location.href);
        alert('Lien copié dans le presse-papier');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      // Fallback : copier le lien
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papier');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Génère un blob PNG du reçu à partir d'un HTML statique propre,
   * sans couleurs oklch (incompatibles avec html2canvas).
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
          .receipt { background: #fff; border-radius: 24px; overflow: hidden; border: 1px solid #e5e7eb; }
          .body { padding: 32px; }
          .header { text-align: center; margin-bottom: 24px; }
          .brand { font-size: 24px; font-weight: 900; color: #4318FF; letter-spacing: -1px; }
          .type { font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 3px; margin-top: 4px; }
          .amount-container { background: #f9fafb; border-radius: 16px; padding: 16px; margin: 16px 0; text-align: center; }
          .amount { font-size: 36px; font-weight: 900; color: #111; margin-bottom: 4px; }
          .fees-note { font-size: 9px; color: #9ca3af; font-style: italic; }
          .status { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px; color: ${receipt.status === 'success' || receipt.status === 'completed' ? '#16a34a' : receipt.status === 'pending' ? '#d97706' : '#dc2626'}; }
          .date { font-size: 10px; color: #9ca3af; font-weight: 600; margin-top: 4px; }
          .divider { border-top: 1px dashed #e5e7eb; margin: 24px 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 8px; }
          .field-label { font-size: 9px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .field-value { font-size: 12px; font-weight: 700; color: #111; }
          .party-card { background: #f9fafb; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
          .party-label { font-size: 9px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .party-name { font-size: 14px; font-weight: 900; color: #111; margin-bottom: 4px; }
          .party-detail { font-size: 10px; color: #6b7280; margin-top: 2px; font-weight: 500; }
          .note-section { background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 16px; margin-top: 16px; }
          .note-label { font-size: 10px; font-weight: 900; color: #ca8a04; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .note-value { font-size: 13px; font-weight: 700; color: #854d0e; line-height: 1.5; }
          .ext-id { font-size: 10px; font-family: monospace; color: #9ca3af; word-break: break-all; }
          .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px; text-align: center; }
          .footer-brand { font-size: 14px; font-weight: 900; color: #4318FF; margin-bottom: 4px; }
          .footer-thanks { font-size: 10px; font-weight: 700; color: #6b7280; }
          .footer-contact { font-size: 10px; font-weight: 600; color: #4b5563; margin-top: 12px; line-height: 1.8; }
          .footer-email { color: #4318FF; font-weight: 700; }
          .footer-note { font-size: 9px; color: #9ca3af; font-style: italic; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="body">
            <div class="header">
              <div class="brand">piYès</div>
              <div class="type">${typeLabel}</div>
              <div class="amount-container">
                <div class="amount">${receipt.amount.toLocaleString('fr-HT')} G *</div>
                <div class="fees-note">${feeDisplayText}</div>
              </div>
              <div class="status">${statusLabel}</div>
              <div class="date">${formattedDate}</div>
            </div>
            
            <div class="divider"></div>
            
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
            
            <div class="divider"></div>
            
            ${receipt.receiver ? `
            <div class="party-card">
              <div class="party-label">Bénéficiaire</div>
              <div class="party-name">${receipt.receiver.name}</div>
              <div class="party-detail">ID: ${receipt.receiver.idNumber || 'N/A'}</div>
              <div class="party-detail">Banque: ${receipt.receiver.bank || 'piYès'}</div>
              <div class="party-detail">Compte: ${receipt.receiver.masked_account || '••••00-6'}</div>
            </div>` : ''}
            
            ${receipt.sender ? `
            <div class="party-card">
              <div class="party-label">Expéditeur</div>
              <div class="party-name">${receipt.sender.name}</div>
              <div class="party-detail">ID: ${receipt.sender.idNumber || 'N/A'}</div>
              <div class="party-detail">Banque: ${receipt.sender.bank || 'piYès'}</div>
              <div class="party-detail">Compte: ${receipt.sender.masked_account || '••••00-6'}</div>
            </div>` : ''}
            
            ${receipt.description ? `
            <div class="note-section">
              <div class="note-label">Note</div>
              <div class="note-value">${receipt.description}</div>
            </div>` : ''}
            
            <div class="divider"></div>
            
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
      const imgBlob = await generateReceiptImageBlob();
      if (!imgBlob) throw new Error('Failed to generate image');

      const isNative = Capacitor.isNativePlatform();
      const fileExtension = format === 'pdf' ? 'pdf' : 'png';
      const fileName = `recu-piyes-${receipt.external_id || receipt.id}.${fileExtension}`;

      if (format === 'image') {
        // Export PNG
        if (isNative) {
          // Mobile : sauvegarder directement
          const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.readAsDataURL(imgBlob);
          });

          await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents,
          });

          alert(`Reçu sauvegardé : ${fileName}`);
        } else {
          // Desktop : téléchargement
          const url = URL.createObjectURL(imgBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);
        }
      } else {
        // Export PDF
        if (isNative) {
          // Mobile : générer PDF et sauvegarder directement (sans ouvrir de fenêtre)
          const { default: jsPDF } = await import('jspdf');

          // Convertir le blob en base64 pour l'image
          const base64Image = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(imgBlob);
          });

          // Créer un canvas temporaire pour obtenir les dimensions
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = base64Image;
          });

          const imgWidth = 210; // A4 width in mm
          const imgHeight = (img.height * imgWidth) / img.width;

          const pdf = new jsPDF({
            orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
            unit: 'mm',
            format: 'a4',
          });

          pdf.addImage(base64Image, 'PNG', 0, 0, imgWidth, imgHeight);

          const pdfBase64 = pdf.output('datauristring').split(',')[1];

          await Filesystem.writeFile({
            path: fileName,
            data: pdfBase64,
            directory: Directory.Documents,
          });

          alert(`Reçu sauvegardé : ${fileName}`);
        } else {
          // Desktop : ouvrir dans une nouvelle fenêtre pour impression
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(imgBlob);
          });

          const pdfHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Reçu piYès - ${receipt.external_id || receipt.id}</title>
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
      setTimeout(function() { window.print(); }, 300);
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
      }
    } catch (err) {
      console.error('Error exporting receipt:', err);
      alert('Erreur lors de l\'export du reçu');
    } finally {
      setExporting(false);
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
        className="sticky top-0 theme-card-bg z-10 border-b theme-border"
      />

      {/* Message de succès */}
      {exportSuccess && (
        <div className="mx-6 mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center gap-2 text-green-700 dark:text-green-400">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{exportSuccess}</span>
        </div>
      )}

      <div className="px-6 py-4">
        <div ref={receiptRef} className="bg-white text-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-200 flex flex-col">
          <div className="p-8 space-y-8 flex-1">
            {/* Header */}
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-black tracking-tighter text-[#4318FF]">piYès</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{typeLabel}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <p className="text-4xl font-black text-gray-900 mb-1">
                  {receipt.amount.toLocaleString('fr-HT')} G
                </p>
                <p className="text-[10px] text-gray-400 italic leading-relaxed">
                  {feeDisplayText}
                </p>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <p className={`text-sm font-black uppercase tracking-widest ${getStatusColor(receipt.status)}`}>
                  {getStatusLabel(receipt.status)}
                </p>
                <p className="text-xs text-gray-500 font-semibold">
                  {formatDate(receipt.date)}
                </p>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Transaction Details */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Code d'autorisation</p>
                <p className="text-sm font-bold text-gray-900">{receipt.auth_code || 'N/A'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID de transaction</p>
                <p className="text-sm font-bold text-gray-900">{receipt.external_id?.slice(0, 12) || 'N/A'}</p>
              </div>
              {receipt.moncashTransactionId && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID MonCash</p>
                  <p className="text-sm font-bold text-gray-900">{receipt.moncashTransactionId}</p>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* Parties */}
            <div className="space-y-4">
              {receipt.receiver && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bénéficiaire</p>
                  <div>
                    <p className="text-base font-black text-gray-900 mb-1">{receipt.receiver.name}</p>
                    <div className="flex flex-col text-xs text-gray-500 font-medium space-y-0.5">
                      <span>ID: {receipt.receiver.idNumber || 'N/A'}</span>
                      <span>Banque: {receipt.receiver.bank || 'piYès'}</span>
                      <span className="font-mono text-gray-400">Compte: {receipt.receiver.masked_account || '••••00-6'}</span>
                    </div>
                  </div>
                </div>
              )}

              {receipt.sender && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expéditeur</p>
                  <div>
                    <p className="text-base font-black text-gray-900 mb-1">{receipt.sender.name}</p>
                    <div className="flex flex-col text-xs text-gray-500 font-medium space-y-0.5">
                      <span>ID: {receipt.sender.idNumber || 'N/A'}</span>
                      <span>Banque: {receipt.sender.bank || 'piYès'}</span>
                      <span className="font-mono text-gray-400">Compte: {receipt.sender.masked_account || '••••00-6'}</span>
                    </div>
                  </div>
                </div>
              )}

              {(automaticNote || receipt.description) && (
                <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200 mt-6">
                  {automaticNote && (
                    <>
                      <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-2">Note</p>
                      <p className="text-sm font-bold text-yellow-900 leading-relaxed">{automaticNote}</p>
                    </>
                  )}
                  {receipt.description && (
                    <p className="text-xs font-medium italic text-yellow-800 leading-relaxed mt-2">
                      {receipt.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            {/* External ID */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identifiant Externe</p>
              <p className="text-[11px] font-mono text-gray-400 break-all leading-relaxed">{receipt.external_id}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-8 text-center space-y-4">
            <div className="space-y-1">
              <p className="text-base font-black text-[#4318FF]">piYès</p>
              <p className="text-[11px] font-bold text-gray-500">Merci d'avoir utilisé piYès !</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Besoin d'aide ? Contactez-nous :</p>
              <div className="space-y-1 text-xs font-bold text-gray-600">
                <p>Téléphone : +509 29 99 9999</p>
                <p>SMS / WhatsApp : +509 28 88 8888</p>
                <p className="text-[#4318FF]">paiements@piyes.ht</p>
              </div>
            </div>
            <p className="text-[9px] text-gray-400 italic">
              Service clientèle disponible en semaine, de 8h am à 4h pm
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-4">
        <Button
          variant="utility"
          fullWidth
          onClick={() => setShowDownloadModal(true)}
          disabled={exporting}
          isLoading={exporting}
          leftIcon={!exporting ? <Download size={18} /> : undefined}
          className="py-5 rounded-[20px] uppercase tracking-widest text-xs"
        >
          {t('receipt.download')}
        </Button>
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