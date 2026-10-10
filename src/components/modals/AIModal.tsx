/**
 * @file AIModal.tsx
 * @description Conteneur d'orchestration de l'Assistant IA d'atelier d'électronique.
 * Intègre le double profil (Pédagogue / Chirurgical) et orchestre les sous-composants modulaires :
 * - AISuggestions : Puces de questions rapides adaptées au stock
 * - AIMessageList : Fil des échanges, rendu Markdown, aperçu d'image grand format & impression
 * - AIInputBar : Saisie de message, pièces jointes photo et capture vidéo/caméra
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Bot, 
  ShieldCheck, 
  RotateCcw,
  BookOpen,
  Crosshair,
  Printer,
  Zap
} from 'lucide-react';
import { ElectronicComponent } from '../../core/domain/types';
import { AiService, AiProfileMode } from '../../services/ai.service';
import { processAndCompressImage, ProcessedImage } from '../../utils/image-processor';

import { AISuggestions } from './ai/AISuggestions';
import { AIMessageList, Message } from './ai/AIMessageList';
import { AIInputBar } from './ai/AIInputBar';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: ElectronicComponent[];
}

export const AIModal: React.FC<AIModalProps> = ({
  isOpen,
  onClose,
  inventory
}) => {
  // Mode de profil (Pédagogue vs Chirurgical vs Doc Brown)
  const [activeMode, setActiveMode] = useState<AiProfileMode>('pedagogue');
  const [appIcon, setAppIconState] = useState<string>('/assets/elec.ico');
  const [temporalNotification, setTemporalNotificationState] = useState<string | null>(null);

  const setActiveProfile = (profile: AiProfileMode) => {
    setActiveMode(profile);
  };

  const setAppIcon = (iconPath: string) => {
    setAppIconState(iconPath);
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = iconPath;
  };

  const triggerTemporalNotification = (message: string) => {
    setTemporalNotificationState(message);
    setTimeout(() => {
      setTemporalNotificationState(null);
    }, 10000);
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Bonjour ! Je suis votre assistant d'ingénierie électronique. J'ai accès en temps réel aux **${inventory.length} références** de votre stock d'atelier.
      
Vous pouvez basculer entre le mode **Pédagogue** (compagnon de labo), le mode **Chirurgical** (power-user, sécurité 100nF) et le profil **Doc Brown** (inventeur excentrique & d'élite).
Vous pouvez également joindre ou capturer une photo de composant pour une analyse multimodale directe.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'pedagogue'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pipeline de vision & image attachée
  const [attachedImage, setAttachedImage] = useState<ProcessedImage | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('ai-modal-open');
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      document.body.classList.remove('ai-modal-open');
      document.body.classList.remove('ai-printing');
    }
    return () => {
      document.body.classList.remove('ai-modal-open');
      document.body.classList.remove('ai-printing');
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isProcessingImage]);

  // Impression directe du protocole technique / historique
  const handlePrintProtocol = () => {
    document.body.classList.add('ai-printing');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('ai-printing');
    }, 1000);
  };

  if (!isOpen) return null;

  /**
   * Traitement d'un fichier image (Upload ou Caméra)
   * Redimensionne l'image à max 1024px avant tout envoi.
   */
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setIsProcessingImage(true);
    setErrorMsg(null);

    try {
      const processed = await processAndCompressImage(file);
      setAttachedImage(processed);
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible de traiter l'image sélectionnée.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSendPrompt = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    const currentImage = attachedImage;

    if ((!prompt && !currentImage) || isLoading || isProcessingImage) return;

    // Logique d'interception du déclencheur Easter Egg et bascule visuelle / comportementale
    let effectiveMode = activeMode;
    if (prompt.toLowerCase().includes("tonnerre de zeus")) {
      effectiveMode = "docbrown";
      setActiveProfile("docbrown");
      setAppIcon("/assets/elec.ico");
      triggerTemporalNotification("Great Scott ! Flux temporel activé à 1,21 gigowatts.");
    }

    const actualPrompt = prompt || "Analyse cette image dans le contexte de mon atelier d'électronique et de mes composants.";

    setInputPrompt('');
    setAttachedImage(null);
    setErrorMsg(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: actualPrompt,
      imageUrl: currentImage?.dataUrl,
      mode: effectiveMode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const reply = await AiService.askQuestion({
        prompt: actualPrompt,
        inventory,
        mode: effectiveMode,
        image: currentImage?.dataUrl
      });

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: reply,
        mode: effectiveMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la communication avec le serveur IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateProjects = async () => {
    if (isLoading) return;
    setErrorMsg(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: "Propose-moi 3 idées de projets pratiques réalisables avec les composants actuellement en stock dans mon atelier.",
      mode: activeMode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const reply = await AiService.generateIdeas(inventory);
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: reply,
        mode: activeMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la génération de projets.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: `Historique réinitialisé. Profil actif : **${activeMode === 'docbrown' ? 'Doc Emmett Brown' : activeMode === 'chirurgical' ? 'Chirurgical' : 'Pédagogue'}**. Posez une question technique ou envoyez une photo.`,
        mode: activeMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* En-tête de la modale */}
        <div className="bg-slate-900/90 px-5 py-3 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border transition-colors ${
              activeMode === 'docbrown'
                ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/40 ring-2 ring-yellow-400/50'
                : activeMode === 'pedagogue'
                  ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                  : 'bg-amber-600/20 text-amber-400 border-amber-500/30'
            }`}>
              {activeMode === 'docbrown' ? (
                <img src={appIcon} alt="Robot Électrifié" className="w-5 h-5 object-contain" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Assistant IA d'Atelier
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border font-mono ${
                  activeMode === 'docbrown'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {activeMode === 'docbrown' ? 'Gemini 3.5 Flash Lite (Élite)' : 'Gemini Flash Lite'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Backend sécurisé • Recherche Web • Inventaire ({inventory.length} réf.)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Sélecteur de profil System Instructions */}
            <div 
              id="ai-mode-selector"
              className="bg-slate-950 p-1 rounded-xl border border-slate-700 flex items-center gap-1"
              title="Sélectionner le profil d'assistant d'atelier"
            >
              <button
                type="button"
                id="btn-mode-pedagogue"
                onClick={() => setActiveProfile('pedagogue')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeMode === 'pedagogue'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Pédagogue</span>
              </button>

              <button
                type="button"
                id="btn-mode-chirurgical"
                onClick={() => setActiveProfile('chirurgical')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeMode === 'chirurgical'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Chirurgical</span>
              </button>

              <button
                type="button"
                id="btn-mode-docbrown"
                onClick={() => setActiveProfile('docbrown')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeMode === 'docbrown'
                    ? 'bg-cyan-600 text-white shadow-sm font-bold ring-1 ring-yellow-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Profil d'Élite Suprême : Doc Emmett Brown (Gemini 3.5 Flash Lite)"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>Doc Brown</span>
              </button>
            </div>

            <div className="flex items-center gap-1 ai-no-print">
              <button
                type="button"
                id="btn-print-ai-chat"
                onClick={handlePrintProtocol}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1 transition"
                title="Imprimer le protocole technique (historique de conversation)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
              <button
                type="button"
                onClick={clearHistory}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1 transition"
                title="Effacer l'historique"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Effacer</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bannière de notification temporelle (Easter Egg) */}
        {temporalNotification && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-300 flex items-center justify-between gap-2 animate-pulse ai-no-print">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400 animate-bounce" />
              <span>{temporalNotification}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-800 font-mono">1,21 Gigowatts</span>
          </div>
        )}

        {/* Bannière de mode épurée */}
        <div className={`px-4 py-1.5 border-b text-[11px] flex items-center justify-between transition-colors ai-no-print ${
          activeMode === 'docbrown'
            ? 'bg-cyan-950/40 border-cyan-800/50 text-cyan-200'
            : activeMode === 'pedagogue'
              ? 'bg-purple-950/30 border-purple-900/40 text-purple-300'
              : 'bg-amber-950/30 border-amber-900/40 text-amber-300'
        }`}>
          <div className="flex items-center gap-1.5">
            {activeMode === 'docbrown' ? (
              <>
                <Zap className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 animate-pulse" />
                <span>[Profil Suprême] Professeur Emmett Brown • Continuum spatio-temporel &amp; Découplage 100nF obligatoire !</span>
              </>
            ) : activeMode === 'pedagogue' ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span>Conseils de prototypage, montages et composants de substitution.</span>
              </>
            ) : (
              <>
                <Crosshair className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Réponses directes, nomenclature exacte et sécurité (découplage 100nF).</span>
              </>
            )}
          </div>
        </div>

        {/* Sous-composant 1: Puces de suggestions dynamiques */}
        <AISuggestions
          inventory={inventory}
          isLoading={isLoading}
          onSelectPrompt={handleSendPrompt}
          onGenerateProjects={handleGenerateProjects}
        />

        {/* Sous-composant 2: Fil de messages, rendu Markdown, aperçu grand format & impression */}
        <AIMessageList
          messages={messages}
          activeMode={activeMode}
          inventoryLength={inventory.length}
          isLoading={isLoading}
          isProcessingImage={isProcessingImage}
          errorMsg={errorMsg}
          messagesEndRef={messagesEndRef}
        />

        {/* Sous-composant 3: Barre de saisie & actions multimodales */}
        <AIInputBar
          inputPrompt={inputPrompt}
          setInputPrompt={setInputPrompt}
          attachedImage={attachedImage}
          setAttachedImage={setAttachedImage}
          activeMode={activeMode}
          isLoading={isLoading}
          isProcessingImage={isProcessingImage}
          inputRef={inputRef}
          fileInputRef={fileInputRef}
          cameraInputRef={cameraInputRef}
          onSendPrompt={() => handleSendPrompt()}
          onFileSelected={handleFileSelected}
        />
      </div>
    </div>
  );
};
