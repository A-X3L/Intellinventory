/**
 * @file AIModal.tsx
 * @description Assistant IA d'atelier d'électronique avec double profil (Pédagogue / Chirurgical)
 * et pipeline de vision multimodal avec redimensionnement automatique côté client (max 1024px).
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Bot, 
  User, 
  Send, 
  Lightbulb, 
  ShieldCheck, 
  RotateCcw,
  Loader2,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  BookOpen,
  Crosshair,
  Trash2,
  Maximize2
} from 'lucide-react';
import { ElectronicComponent } from '../../core/domain/types';
import { AiService, AiProfileMode } from '../../services/ai.service';
import { SecuritySanitizer } from '../../infrastructure/security/sanitizer';
import { processAndCompressImage, ProcessedImage } from '../../utils/image-processor';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  mode?: AiProfileMode;
  imageUrl?: string;
}

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
  // Sélection du profil de System Instructions (Point 7)
  const [activeMode, setActiveMode] = useState<AiProfileMode>('pedagogue');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Bonjour ! Je suis votre assistant d'ingénierie électronique. J'ai accès en temps réel aux **${inventory.length} références** de votre stock d'atelier.
      
Vous pouvez basculer entre le mode **Pédagogue** (compagnon de labo, conseils de montage, alternatives) et le mode **Chirurgical** (power-user, sécurité stricte, découplage 100nF, sans bavardage).
Vous pouvez également joindre ou capturer une photo de composant, schéma ou breadboard pour une analyse multimodale directe.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'pedagogue'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pipeline de vision & image attachée (Point 8)
  const [attachedImage, setAttachedImage] = useState<ProcessedImage | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [previewEnlargedImage, setPreviewEnlargedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isProcessingImage]);

  if (!isOpen) return null;

  /**
   * Traitement d'un fichier image (Upload ou Caméra)
   * Redimensionne impérativement l'image à max 1024px avant tout envoi.
   */
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset de l'input pour permettre de sélectionner à nouveau le même fichier
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

    // Bloque si aucun texte ni image
    if ((!prompt && !currentImage) || isLoading || isProcessingImage) return;

    const actualPrompt = prompt || "Analyse cette image dans le contexte de mon atelier d'électronique et de mes composants.";

    setInputPrompt('');
    setAttachedImage(null);
    setErrorMsg(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: actualPrompt,
      imageUrl: currentImage?.dataUrl,
      mode: activeMode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const reply = await AiService.askQuestion({
        prompt: actualPrompt,
        inventory,
        mode: activeMode,
        image: currentImage?.dataUrl
      });

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: reply,
        mode: activeMode,
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
        text: `Historique réinitialisé. Mode actif : **${activeMode === 'pedagogue' ? 'Pédagogue' : 'Chirurgical'}**. Posez une question technique ou envoyez une photo.`,
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
              activeMode === 'pedagogue'
                ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                : 'bg-amber-600/20 text-amber-400 border-amber-500/30'
            }`}>
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Assistant IA d'Atelier
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Gemini Flash Lite
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Backend sécurisé • Inventaire ({inventory.length} réf.) injecté
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Sélecteur de profil System Instructions (Point 7) */}
            <div 
              id="ai-mode-selector"
              className="bg-slate-950 p-1 rounded-xl border border-slate-700 flex items-center gap-1"
              title="Basculer entre le profil Pédagogue et le profil Chirurgical"
            >
              <button
                type="button"
                id="btn-mode-pedagogue"
                onClick={() => setActiveMode('pedagogue')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
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
                onClick={() => setActiveMode('chirurgical')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeMode === 'chirurgical'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Chirurgical</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
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

        {/* Bannière d'information sur le mode actif */}
        <div className={`px-4 py-1.5 border-b text-[11px] flex items-center justify-between transition-colors ${
          activeMode === 'pedagogue'
            ? 'bg-purple-950/40 border-purple-900/60 text-purple-300'
            : 'bg-amber-950/40 border-amber-900/60 text-amber-300'
        }`}>
          <div className="flex items-center gap-1.5">
            {activeMode === 'pedagogue' ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span>
                  <strong>Mode Pédagogue actif :</strong> Compagnon de labo expérimenté, montages ingénieux, composants de substitution et conseils pratiques de soudure.
                </span>
              </>
            ) : (
              <>
                <Crosshair className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Mode Chirurgical actif :</strong> Électronicien chevronné, sécurité &amp; découplage 100nF, nomenclature stricte, réponse directe et sans bavardage.
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none flex-shrink-0">
          <button
            type="button"
            onClick={handleGenerateProjects}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 whitespace-nowrap transition-colors disabled:opacity-50"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>3 Idées de projets avec mon stock</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendPrompt("Quels composants puis-je utiliser pour commuter un relais ou une charge 12V ?")}
            disabled={isLoading}
            className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
          >
            Commuter une charge 12V ?
          </button>

          <button
            type="button"
            onClick={() => handleSendPrompt("Quels régulateurs de tension ai-je pour sortir du 3.3V ou 5V ?")}
            disabled={isLoading}
            className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
          >
            Régulateurs 3.3V et 5V disponibles ?
          </button>
        </div>

        {/* Message Thread */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-grow text-xs sm:text-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-1 ${
                  msg.mode === 'chirurgical'
                    ? 'bg-amber-600/20 text-amber-400 border-amber-500/30'
                    : 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                }`}>
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-700/80 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* En-tête du message */}
                <div className="flex items-center justify-between gap-4 mb-2 text-[10px] opacity-75 border-b border-white/10 pb-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>{msg.sender === 'user' ? 'Vous' : 'Gemini Assistant'}</span>
                    {msg.mode && msg.sender === 'ai' && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                        msg.mode === 'chirurgical' 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      }`}>
                        {msg.mode === 'chirurgical' ? 'Chirurgical' : 'Pédagogue'}
                      </span>
                    )}
                  </div>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Vignette d'image jointe par l'utilisateur (Point 8) */}
                {msg.imageUrl && (
                  <div className="mb-2.5">
                    <button
                      type="button"
                      onClick={() => setPreviewEnlargedImage(msg.imageUrl || null)}
                      className="group relative block rounded-xl overflow-hidden border border-emerald-400/40 shadow-sm max-w-[220px]"
                      title="Cliquer pour agrandir la photo analysée"
                    >
                      <img 
                        src={msg.imageUrl} 
                        alt="Capture jointe au message" 
                        className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1">
                        <Maximize2 className="w-4 h-4" />
                        <span>Agrandir</span>
                      </div>
                    </button>
                    <span className="text-[10px] text-emerald-200/80 block mt-1">Photo soumise à l'analyse Gemini</span>
                  </div>
                )}

                {msg.sender === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                ) : (
                  <div 
                    className="space-y-1.5"
                    dangerouslySetInnerHTML={{ __html: SecuritySanitizer.formatAiMarkdown(msg.text) }}
                  />
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Indicateur de compression image en cours */}
          {isProcessingImage && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-slate-300 flex items-center gap-2 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Optimisation de l'image (redimensionnement max 1024px &amp; compression)...</span>
              </div>
            </div>
          )}

          {/* Indicateur d'inférence IA en cours */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                activeMode === 'chirurgical'
                  ? 'bg-amber-600/20 text-amber-400 border-amber-500/30'
                  : 'bg-purple-600/20 text-purple-400 border-purple-500/30'
              }`}>
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-300 flex items-center gap-2 text-xs">
                <Loader2 className={`w-4 h-4 animate-spin ${
                  activeMode === 'chirurgical' ? 'text-amber-400' : 'text-purple-400'
                }`} />
                <span>
                  {activeMode === 'chirurgical'
                    ? 'Analyse chirurgicale, vérification des découplages et du stock...'
                    : 'Analyse du stock d\'atelier et élaboration des conseils de prototypage...'}
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prévisualisation de l'image attachée prête à l'envoi (Point 8) */}
        {attachedImage && (
          <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative rounded-lg overflow-hidden border border-slate-700 w-12 h-12 flex-shrink-0 bg-slate-900">
                <img 
                  src={attachedImage.dataUrl} 
                  alt="Aperçu avant envoi" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>Photo prête pour l'analyse multimodale</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.2 rounded font-mono">
                    {attachedImage.width}&times;{attachedImage.height}px (max 1024px)
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">
                  {attachedImage.originalWidth !== attachedImage.width ? (
                    <span>Redimensionnée automatiquement depuis {attachedImage.originalWidth}&times;{attachedImage.originalHeight}px pour économiser la bande passante.</span>
                  ) : (
                    <span>Taille optimale conservée.</span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Supprimer cette image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Barre de saisie & actions multimodales */}
        <div className="bg-slate-900/95 px-4 py-3 border-t border-slate-700 flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Inputs cachés pour Photo / Caméra */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelected}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelected}
              className="hidden"
            />

            {/* Bouton Import Fichier Photo */}
            <button
              type="button"
              id="btn-chat-upload-image"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isProcessingImage}
              className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 text-slate-300 hover:text-white rounded-xl border border-slate-700 flex items-center justify-center transition"
              title="Joindre une photo ou un schéma (redimensionnement automatique max 1024px)"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Bouton Capture Caméra Directe */}
            <button
              type="button"
              id="btn-chat-capture-camera"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoading || isProcessingImage}
              className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 text-slate-300 hover:text-white rounded-xl border border-slate-700 flex items-center justify-center transition"
              title="Prendre une photo avec la caméra du laboratoire"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Champ texte */}
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendPrompt();
              }}
              placeholder={
                attachedImage 
                  ? "Ajoutez une question sur cette image ou appuyez sur Entrée pour l'analyser..."
                  : activeMode === 'chirurgical'
                    ? "Question technique directe (ex: filtrage LC 100kHz, brochage, découplage)..."
                    : "Posez une question technique (ex: brochage 74HC595, AOP LM358, équivalence)..."
              }
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />

            {/* Bouton Envoyer */}
            <button
              type="button"
              id="btn-chat-send"
              onClick={() => handleSendPrompt()}
              disabled={isLoading || isProcessingImage || (!inputPrompt.trim() && !attachedImage)}
              className={`font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all shadow-md disabled:opacity-40 text-white ${
                activeMode === 'chirurgical'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                  : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/25'
              }`}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Envoyer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modale d'agrandissement d'image */}
      {previewEnlargedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4"
          onClick={() => setPreviewEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={previewEnlargedImage} 
              alt="Agrandissement" 
              className="max-w-full max-h-[85vh] rounded-xl object-contain border border-slate-700 shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewEnlargedImage(null)}
              className="absolute -top-3 -right-3 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full border border-slate-600 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
