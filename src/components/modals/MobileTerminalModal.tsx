/**
 * @file MobileTerminalModal.tsx
 * @description Modale de connexion rapide au Terminal Mobile d'atelier par QR Code.
 * Utilise dynamiquement l'adresse IP réseau locale (LAN/Wi-Fi) au lieu de localhost
 * pour éviter les erreurs ERR_CONNECTION_REFUSED sur smartphones et tablettes.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Wifi, 
  Camera, 
  ShieldCheck,
  Edit2
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
  const [detectedLanIp, setDetectedLanIp] = useState<string>('');
  const [customHost, setCustomHost] = useState<string>('');
  const [isEditingHost, setIsEditingHost] = useState<boolean>(false);

  // Détection de l'adresse IP locale du serveur via l'API BFF
  useEffect(() => {
    if (isOpen) {
      fetch('/api/network/info')
        .then((res) => res.json())
        .then((data) => {
          if (data?.primaryIp && data.primaryIp !== '127.0.0.1') {
            setDetectedLanIp(data.primaryIp);
            if (!customHost) {
              setCustomHost(data.primaryIp);
            }
          }
        })
        .catch(() => {
          // Ignore si indisponible
        });
    }
  }, [isOpen]);

  // Calcul dynamique de l'URL cible accessible depuis un smartphone connecté au Wi-Fi
  const captureUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/capture';

    const currentHostname = window.location.hostname;
    const currentPort = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol;

    // Si on a spécifié une IP personnalisée ou détectée
    if (customHost && customHost.trim() !== '') {
      return `${protocol}//${customHost.trim()}${currentPort}/capture`;
    }

    // Si l'application tourne sur localhost ou 127.0.0.1, et qu'une IP LAN a été détectée
    if ((currentHostname === 'localhost' || currentHostname === '127.0.0.1' || currentHostname === '0.0.0.0') && detectedLanIp) {
      return `${protocol}//${detectedLanIp}${currentPort}/capture`;
    }

    // Sinon, on utilise le hostname actuel du navigateur
    return `${protocol}//${currentHostname}${currentPort}/capture`;
  }, [customHost, detectedLanIp]);

  // Génération du QR Code vectoriel SVG avec contraste maximal et quiet zone ISO stricte (margin=4)
  const qrSvg = useMemo(() => {
    try {
      return QrCodeGenerator.generateSvg(captureUrl, 240, 4);
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
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
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {/* Cadre d'affichage du QR Code avec fond blanc pur, quiet zone et contraste maximal */}
          <div className="relative p-4 bg-white rounded-2xl shadow-2xl border-4 border-slate-700 flex items-center justify-center">
            {qrSvg ? (
              <div 
                className="w-56 h-56 flex items-center justify-center bg-white"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-900 text-xs bg-white">
                <QrCode className="w-12 h-12 text-slate-600 mb-2" />
                <span>QR Code en cours de calcul...</span>
              </div>
            )}
            <div className="absolute -bottom-3 px-3 py-0.5 bg-slate-950 text-amber-300 border border-amber-500/50 rounded-full text-[10px] font-mono font-bold tracking-wide shadow-md">
              SCANNER AVEC SMARTPHONE
            </div>
          </div>

          {/* Configuration / Ajustement de l'IP réseau si nécessaire */}
          <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                Adresse réseau Wi-Fi :
              </span>
              <button
                type="button"
                onClick={() => setIsEditingHost(!isEditingHost)}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingHost ? 'Verrouiller' : 'Changer l\'IP'}</span>
              </button>
            </div>

            {isEditingHost ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customHost}
                  onChange={(e) => setCustomHost(e.target.value)}
                  placeholder="ex: 192.168.1.50"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setIsEditingHost(false)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg font-mono text-slate-300 text-[11px]">
                <span className="truncate">{captureUrl}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 ml-2">
                  LAN Wi-Fi
                </span>
              </div>
            )}
          </div>

          {/* Instructions de connexion rapide */}
          <div className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-left space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-start gap-2 text-slate-300">
              <Camera className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>1. Flashez le QR Code :</strong> Ouvrez l'appareil photo du smartphone (compatible capteurs Xiaomi/Redmi/iOS/Android).
              </span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <Wifi className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>2. Réseau local :</strong> Votre smartphone doit être relié au même réseau Wi-Fi local que l'atelier.
              </span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>3. Transmission en direct :</strong> Les captures sont reçues sans passer par un serveur cloud public.
              </span>
            </div>
          </div>

          {/* Bouton Copier et Lien de test direct */}
          <div className="w-full flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">URL copiée</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier le lien</span>
                </>
              )}
            </button>

            <a
              href="/capture"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              title="Tester le terminal dans un onglet local"
            >
              <span>Tester en local</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
