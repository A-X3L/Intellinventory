/**
 * @file MobileTerminalModal.tsx
 * @description Modale de connexion rapide au Terminal Mobile d'atelier par QR Code.
 * Remplace l'ouverture automatique d'un nouvel onglet et permet une connexion instantanée depuis smartphone.
 */

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Smartphone, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Wifi, 
  Camera, 
  ShieldCheck 
} from 'lucide-react';
import { QrCodeGenerator } from '../../utils/qr-generator';

interface MobileTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileTerminalModal: React.FC<MobileTerminalModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  // URL cible du terminal mobile (/capture)
  const captureUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/capture';
    return `${window.location.origin}/capture`;
  }, []);

  // Génération du QR Code vectoriel en SVG natif
  const qrSvg = useMemo(() => {
    try {
      return QrCodeGenerator.generateSvg(captureUrl, 220, 2);
    } catch (err) {
      console.error('Erreur génération QR code :', err);
      return null;
    }
  }, [captureUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(captureUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
      >
        {/* En-tête */}
        <div className="bg-slate-950/80 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Terminal Mobile d'Atelier
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  /capture
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Connexion instantanée par QR Code sans installation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          {/* Cadre d'affichage du QR Code */}
          <div className="relative p-3.5 bg-white rounded-2xl shadow-xl border-4 border-slate-800 flex items-center justify-center">
            {qrSvg ? (
              <div 
                className="w-52 h-52 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div className="w-52 h-52 flex flex-col items-center justify-center text-slate-900 text-xs">
                <QrCode className="w-12 h-12 text-slate-600 mb-2" />
                <span>QR Code indisponible</span>
              </div>
            )}
            <div className="absolute -bottom-2.5 px-3 py-0.5 bg-slate-950 text-amber-400 border border-amber-500/40 rounded-full text-[10px] font-mono font-bold tracking-wide">
              SCANNER AVEC SMARTPHONE
            </div>
          </div>

          {/* Instructions d'utilisation */}
          <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-left space-y-2 text-xs">
            <div className="flex items-start gap-2.5 text-slate-300">
              <Camera className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>1. Flashez le QR Code :</strong> Ouvrez l'application photo de votre smartphone ou tablette et pointez vers l'écran.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>2. Même réseau Wi-Fi :</strong> Assurez-vous que votre téléphone est connecté au réseau local de l'atelier.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>3. Transmission directe :</strong> Les clichés et enregistrements vocaux sont transmis en direct à cet établi.
              </span>
            </div>
          </div>

          {/* Lien direct et bouton copier */}
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
              <span className="text-slate-400 truncate flex-1 font-mono text-left select-all">
                {captureUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium flex items-center gap-1.5 transition text-[11px]"
                title="Copier l'adresse URL"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>

            {/* Accès de secours pour test direct */}
            <div className="flex justify-between items-center text-[11px] text-slate-400 px-1 pt-1">
              <span>Besoin de tester directement sur ce navigateur ?</span>
              <a
                href="/capture"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Ouvrir dans un onglet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
