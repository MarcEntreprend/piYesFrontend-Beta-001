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
import { displayMoney, displayPercent } from '../shared/money';
import { AutoScaleText } from '../components/AutoScaleText';
import { api } from '@/services/apiService';

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

  // États pour les soldes avant/après
  const [balanceBefore, setBalanceBefore] = useState<number | null>(null);
  const [balanceAfter, setBalanceAfter] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (id) {
      const type = searchParams.get('type') || 'transfer';
      const role = searchParams.get('role') || 'payer';

      receiptService.getReceipt(id, type, role)
        .then(data => {
          if (!cancelled) {
            setReceipt(data);
            // Calculer les soldes après chargement
            if (data.date && data.amount) {
              const receiptRole = searchParams.get('role') || 'payer';
              calculateBalances(data.date, data.amount, receiptRole);
            }
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

  // Note automatique basée sur le type de transaction (titre)
  const automaticNote = useMemo(() => {
    if (!receipt) return '';

    const txTypeRaw = receipt.receipt_type;
    const txTypeNormalized = typeof txTypeRaw === 'string' ? txTypeRaw.toUpperCase() : txTypeRaw;
    const description = receipt.description || '';

    // Helper pour remplacer - et > par →
    const formatTitle = (title: string) => title.replace(/[-]/g, '→').replace(/[>]/g, '→');

    // --- P2P sous-types (priorité : rappel > lien > QR > clé) ---
    if (txTypeNormalized === 'TRANSFER' || txTypeNormalized === 'P2P') {
      if (description.includes('Rappel')) return formatTitle('Rappel de transfert');
      if (description.includes('lien') || description.includes('Link')) return formatTitle('Paiement par lien');
      // Détection améliorée du QR code (insensible à la casse)
      if (description.toLowerCase().includes('qr')) return formatTitle('Paiement par QR Code');
      return formatTitle('Transfert via clé');
    }

    switch (txTypeNormalized) {
      case 'MOBILE_RECHARGE':
      case 'RECHARGE':
        return formatTitle('Recharge mobile');
      case 'DEPOSIT':
        return formatTitle('Dépôt sur compte');
      case 'WITHDRAWAL':
      case 'WITHDRAW':
        return formatTitle('Retrait de fonds');
      case 'INTERNATIONAL': {
        const country = receipt.receiver?.country || receipt.country;
        if (country) return formatTitle(`Transfert international : Haïti → ${country}`);
        return formatTitle('Transfert international');
      }
      case 'INTERBANK_IN': {
        const senderBank = receipt.sender?.bank || 'Autre institution';
        return formatTitle(`Transfert interbancaire : ${senderBank} → piYès`);
      }
      case 'INTERBANK_OUT': {
        const receiverBank = receipt.receiver?.bank || 'Autre institution';
        return formatTitle(`Transfert interbancaire : piYès → ${receiverBank}`);
      }
      default:
        // Fallback pour TRANSFER non reconnu → détection interbancaire par comparaison des banques
        if (txTypeNormalized === 'TRANSFER') {
          const senderBank = receipt.sender?.bank?.toLowerCase() || '';
          const receiverBank = receipt.receiver?.bank?.toLowerCase() || '';
          if (senderBank.includes('piyès') && receiverBank && !receiverBank.includes('piyès')) {
            return formatTitle(`Transfert interbancaire : piYès → ${receipt.receiver?.bank || 'Autre institution'}`);
          }
          if (!senderBank.includes('piyès') && receiverBank.includes('piyès')) {
            return formatTitle(`Transfert interbancaire : ${receipt.sender?.bank || 'Autre institution'} → piYès`);
          }
          return formatTitle('Transfert via clé');
        }
        return '';
    }
  }, [receipt]);

  // Description enrichie pour les cas système (recharge, dépôt) – sinon commentaire utilisateur
  const enhancedDescription = useMemo(() => {
    if (!receipt) return '';

    const txTypeRaw = receipt.receipt_type;
    const txTypeNormalized = typeof txTypeRaw === 'string' ? txTypeRaw.toUpperCase() : txTypeRaw;

    // Recharge mobile : afficher le numéro (description backend)
    if (txTypeNormalized === 'MOBILE_RECHARGE' || txTypeNormalized === 'RECHARGE') {
      if (receipt.description) return receipt.description;
      return 'Numéro mobile';
    }

    // Dépôt : afficher le nom de l'agent (via receipt.receiver.name)
    if (txTypeNormalized === 'DEPOSIT') {
      if (receipt.receiver?.name) return `Agence ${receipt.receiver.name}`;
      if (receipt.description) return receipt.description;
      return '';
    }

    // Retrait : pas de description
    if (txTypeNormalized === 'WITHDRAWAL' || txTypeNormalized === 'WITHDRAW') {
      return '';
    }

    // Pour tous les autres, utiliser le commentaire utilisateur s'il existe ET qu'il n'est pas générique
    const defaultDesc = receipt.description || '';
    // Ignorer les descriptions génériques comme "Transfer to XXX" ou "Paiement pour ..." (redondantes)
    const isGenericDesc = /^Transfer to |^Paiement pour /i.test(defaultDesc);
    if (!isGenericDesc) return defaultDesc;
    return '';
  }, [receipt]);

  const feeDisplayText = useMemo(() => {
    if (!receipt) return '✨ Aucun frais appliqué !';
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
      return `🔹 Seulement ${displayPercent(totalPercent)} de frais pour ce transfert interbancaire. Avec piYès, vous économisez !`;
    }
    return `🌍 Frais internationaux : seulement ${displayPercent(totalPercent)}. piYès vous offre le meilleur taux.`;
  }, [receipt]);

  //calculateBalances
  const calculateBalances = async (receiptDate: string, receiptAmount: number, receiptRole: string) => {
    setLoadingBalance(true);
    try {
      const balanceBeforeAmount = await api.getBalanceBefore(receiptDate);
      setBalanceBefore(balanceBeforeAmount);
      const impact = receiptRole === "RECEIVER" ? receiptAmount : -receiptAmount;
      setBalanceAfter(balanceBeforeAmount + impact);
    } catch (error) {
      console.error("Failed to calculate balances:", error);
    } finally {
      setLoadingBalance(false);
    }
  };


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

  const handleShare = async () => {
    setExporting(true);
    try {
      const imgBlob = await generateReceiptImageBlob();
      if (!imgBlob) throw new Error('Failed to generate image');

      const fileName = `recu-piyes-${receipt.external_id || receipt.id}.png`;

      if (Capacitor.isNativePlatform()) {
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
        const file = new File([imgBlob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Reçu piYès',
            text: `Reçu de transaction piYès : ${receipt.amount} G.`,
            files: [file],
          });
        } else {
          const url = URL.createObjectURL(imgBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Lien copié dans le presse-papier');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papier');
    } finally {
      setExporting(false);
    }
  };

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
                <div class="amount">${displayMoney(receipt.amount * 100)} G *</div>
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
            
            ${(automaticNote || enhancedDescription) ? `
            <div class="note-section">
              <div class="note-label">Note</div>
              <div class="note-value">${automaticNote || ''}${automaticNote && enhancedDescription ? '<br/>' : ''}${enhancedDescription || ''}</div>
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
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:400px;height:auto;border:none;visibility:hidden;';
      document.body.appendChild(iframe);

      iframe.contentDocument!.open();
      iframe.contentDocument!.write(html);
      iframe.contentDocument!.close();

      await new Promise(r => setTimeout(r, 300));

      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(iframe.contentDocument!.body, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 400,
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
        if (isNative) {
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
          const url = URL.createObjectURL(imgBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);
        }
      } else {
        if (isNative) {
          const { default: jsPDF } = await import('jspdf');

          const base64Image = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(imgBlob);
          });

          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = base64Image;
          });

          const imgWidth = 210;
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

  if (loading) return (
    <div className="theme-card-bg min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#830AD1]/30 border-t-[#830AD1] rounded-full animate-spin"></div>
    </div>
  );

  if (!receipt) return <div className="p-8 text-center theme-text-secondary">{t('common.error')}</div>;

  const typeLabel = t(`receipt.types.${receipt.receipt_type}` as any) || receipt.receipt_type;

  console.log("[RECEIPT DEBUG] description brute =", receipt.description);

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

      {exportSuccess && (
        <div className="mx-6 mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center gap-2 text-green-700 dark:text-green-400">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{exportSuccess}</span>
        </div>
      )}

      <div className="px-6 py-4">
        {/* Section Évolution du solde - Au-dessus du reçu */}
        {!loadingBalance && balanceBefore !== null && balanceAfter !== null && (
          <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-3">
              Évolution du solde
            </p>
            <div className="flex justify-between items-center text-sm">
              <div className="text-center flex-1">
                <p className="text-gray-400 text-[9px] uppercase">Avant</p>
                <p className="font-black text-gray-800">{displayMoney(balanceBefore * 100)} G</p>
              </div>
              <div className="text-gray-300 text-xs">→</div>
              <div className="text-center flex-1">
                <p className="text-gray-400 text-[9px] uppercase">Après</p>
                <p className="font-black text-gray-900">{displayMoney(balanceAfter * 100)} G</p>
              </div>
            </div>
          </div>
        )}

        {/* Reçu existant */}
        <div ref={receiptRef} className="bg-white text-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-200 flex flex-col">
          <div className="p-8 space-y-8 flex-1">
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-black tracking-tighter text-[#4318FF]">piYès</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{typeLabel}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <AutoScaleText
                  maxFontSize={36}
                  minFontSize={16}
                  className="font-black text-gray-900 mb-1"
                  as="p"
                >
                  {receipt.amount.toLocaleString('fr-HT')} G
                </AutoScaleText>
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

              {(automaticNote || enhancedDescription) && (
                <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200 mt-6">
                  {automaticNote && (
                    <>
                      <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-2">Note</p>
                      <p className="text-sm font-bold text-yellow-900 leading-relaxed">{automaticNote}</p>
                    </>
                  )}
                  {enhancedDescription && (
                    <p className="text-xs font-medium italic text-yellow-800 leading-relaxed mt-2">
                      {enhancedDescription}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-300"></div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identifiant Externe</p>
              <p className="text-[11px] font-mono text-gray-400 break-all leading-relaxed">{receipt.external_id}</p>
            </div>
          </div>

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