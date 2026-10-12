/**
 * @file AIModal.tsx
 * @description Conteneur d'orchestration de l'Assistant IA d'atelier d'électronique.
 * Intègre la synthèse vocale native (TTS), la dictée vocale native (Micro),
 * le statut d'Easter Egg masqué de Doc Brown, et la correction des assets d'icônes.
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
  Zap,
  Volume2,
  VolumeX
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
  const [appIcon, setAppIconState] = useState<string>('/assets/elec.svg');
  const [temporalNotification, setTemporalNotificationState] = useState<string | null>(null);

  // Easter Egg : Doc Brown reste masqué par défaut tant qu'il n'est pas débloqué
  const [isDocUnlocked, setIsDocUnlocked] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('intellinventory_doc_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  // Synthèse vocale native (TTS)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);

  // Reconnaissance vocale native (Microphone)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSpeechSupported = typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const setActiveProfile = (profile: AiProfileMode) => {
    if (profile === activeMode) return;
    setActiveMode(profile);

    const modeNotices: Record<AiProfileMode, { title: string; text: string }> = {
      pedagogue: {
        title: "Mode Pédagogue Activé",
        text: "Basculement en **Mode Pédagogue** : Conseils didactiques, vulgarisation technique pas-à-pas, explication détaillée des circuits et dimensionnement adapté aux débutants et makers."
      },
      chirurgical: {
        title: "Mode Chirurgical Activé",
        text: "Basculement en **Mode Chirurgical** : Réponses ultra-concises, directes aux broches. **Règle absolue de sécurité :** Découplage 100nF systématique au plus court des broches VCC/GND, valeurs normalisées E12/E24 et limitations thermiques sans détour."
      },
      docbrown: {
        title: "Profil Doc Emmett Brown Activé",
        text: "Nom de Zeus ! Basculement sur l'inventeur d'élite. Condensateur de flux alimenté à 1,21 Gigowatts. Préparez-vous à défier l'espace-temps !"
      }
    };

    const notice = modeNotices[profile];
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: `⚡ **${notice.title}**\n\n${notice.text}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: profile
      }
    ]);
  };

  const setAppIcon = (iconPath: string) => {
    setAppIconState(iconPath);
    if (typeof document === 'undefined') return;
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.type = iconPath.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon';
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
      
Vous pouvez basculer entre le mode **Pédagogue** (compagnon de labo) et le mode **Chirurgical** (power-user, sécurité 100nF)${isDocUnlocked ? ' ou le profil **Doc Brown** (inventeur d\'élite)' : ''}.
Vous pouvez également joindre une photo de composant ou utiliser le micro pour une analyse directe.`,
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

  // Gestion de la fermeture et du cycle de vie TTS / Audio
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('ai-modal-open');
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      document.body.classList.remove('ai-modal-open');
      document.body.classList.remove('ai-printing');
      // Arrêt de toute synthèse vocale et écoute en cours
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      setSpeakingMessageId(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
    }
    return () => {
      document.body.classList.remove('ai-modal-open');
      document.body.classList.remove('ai-printing');
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isProcessingImage]);

  // Nettoyage Markdown pour prononciation TTS naturelle et agréable
  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/```[\s\S]*?```/g, ' [bloc de code omis] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#~>]/g, '')
      .replace(/[-*+]\s+/g, '')
      .replace(/\n+/g, '. ')
      .trim();
  };

  // Déclencheur / Arrêt de la synthèse vocale native
  const handleToggleSpeakMessage = (id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setErrorMsg("La synthèse vocale n'est pas prise en charge par ce navigateur.");
      return;
    }

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleaned = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.05;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = (e) => {
      console.warn('[TTS] Notification synthèse vocale :', e);
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Déclencheur / Arrêt de la reconnaissance vocale native (Microphone)
  const handleToggleVoice = () => {
    if (!isSpeechSupported) {
      setSpeechError("Reconnaissance vocale non prise en charge par ce navigateur.");
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript.trim();
          if (transcript) {
            setInputPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('[Microphone Assistant] Erreur :', event.error);
        if (event.error !== 'no-speech') {
          if (event.error === 'not-allowed') {
            setSpeechError("Accès au microphone refusé par le navigateur.");
          } else {
            setSpeechError(`Erreur microphone : ${event.error}`);
          }
          setTimeout(() => setSpeechError(null), 4000);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[Microphone Assistant] Erreur démarrage :', err);
      setIsListening(false);
      setSpeechError("Impossible d'accéder au microphone.");
      setTimeout(() => setSpeechError(null), 4000);
    }
  };

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

    // Logique d'interception du déclencheur Easter Egg et déverrouillage de Doc Brown
    let effectiveMode = activeMode;
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes("tonnerre de zeus") || lowerPrompt.includes("nom de zeus")) {
      effectiveMode = "docbrown";
      setIsDocUnlocked(true);
      try {
        localStorage.setItem('intellinventory_doc_unlocked', 'true');
      } catch {}
      setActiveProfile("docbrown");
      setAppIcon("/assets/elec.svg");
      triggerTemporalNotification("Great Scott ! Flux temporel activé à 1,21 gigowatts. Profil Doc Brown débloqué !");
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

      // Lecture vocale automatique si activée
      if (autoSpeak && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        handleToggleSpeakMessage(aiMessage.id, reply);
      }
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

      if (autoSpeak && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        handleToggleSpeakMessage(aiMessage.id, reply);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la génération de projets.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: `Historique réinitialisé. Profil actif : **${activeMode === 'docbrown' ? 'Doc Emmett Brown' : activeMode === 'chirurgical' ? 'Chirurgical' : 'Pédagogue'}**. Posez une question technique, envoyez une photo ou dictez au micro.`,
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
                    : activeMode === 'chirurgical'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30 font-bold'
                }`}>
                  {activeMode === 'docbrown'
                    ? 'Doc Brown (Élite)'
                    : activeMode === 'chirurgical'
                      ? 'Mode Chirurgical'
                      : 'Mode Pédagogue'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {activeMode === 'chirurgical'
                  ? `Sécurité 100nF • Nomenclature stricte • Inventaire (${inventory.length} réf.)`
                  : activeMode === 'docbrown'
                    ? `Flux temporel 1.21 GW • Inventaire (${inventory.length} réf.)`
                    : `Didactique d'atelier • Inventaire (${inventory.length} réf.)`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Sélecteur de profil System Instructions (Doc Brown masqué tant que non débloqué) */}
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

              {/* Affichage conditionnel de Doc Brown comme véritable Easter Egg */}
              {isDocUnlocked && (
                <button
                  type="button"
                  id="btn-mode-docbrown"
                  onClick={() => setActiveProfile('docbrown')}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all animate-in zoom-in-95 ${
                    activeMode === 'docbrown'
                      ? 'bg-cyan-600 text-white shadow-sm font-bold ring-1 ring-yellow-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Profil d'Élite Suprême : Doc Emmett Brown (Gemini 3.5 Flash Lite)"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Doc Brown</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 ai-no-print">
              {/* Toggle de synthèse vocale automatique */}
              <button
                type="button"
                id="btn-toggle-auto-speak"
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                  autoSpeak 
                    ? 'text-cyan-300 bg-cyan-950/70 border border-cyan-500/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={autoSpeak ? "Désactiver la lecture vocale automatique" : "Activer la lecture vocale automatique des réponses (TTS)"}
              >
                {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{autoSpeak ? 'Voix ON' : 'Voix'}</span>
              </button>

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

        {/* Sous-composant 2: Fil de messages, rendu Markdown, aperçu grand format, TTS & impression */}
        <AIMessageList
          messages={messages}
          activeMode={activeMode}
          inventoryLength={inventory.length}
          isLoading={isLoading}
          isProcessingImage={isProcessingImage}
          errorMsg={errorMsg}
          speakingMessageId={speakingMessageId}
          onToggleSpeakMessage={handleToggleSpeakMessage}
          messagesEndRef={messagesEndRef}
        />

        {/* Sous-composant 3: Barre de saisie, dictée vocale native & actions multimodales */}
        <AIInputBar
          inputPrompt={inputPrompt}
          setInputPrompt={setInputPrompt}
          attachedImage={attachedImage}
          setAttachedImage={setAttachedImage}
          activeMode={activeMode}
          isLoading={isLoading}
          isProcessingImage={isProcessingImage}
          isListening={isListening}
          isSpeechSupported={isSpeechSupported}
          speechError={speechError}
          inputRef={inputRef}
          fileInputRef={fileInputRef}
          cameraInputRef={cameraInputRef}
          onSendPrompt={() => handleSendPrompt()}
          onFileSelected={handleFileSelected}
          onToggleVoice={handleToggleVoice}
        />
      </div>
    </div>
  );
};
