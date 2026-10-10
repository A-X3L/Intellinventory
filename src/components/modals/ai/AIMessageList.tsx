/**
 * @file AIMessageList.tsx
 * @description Encapsule le fil des messages de la conversation IA, le formatage Markdown,
 * les statuts de traitement image/IA, la modale d'agrandissement d'image et le bloc d'impression.
 */

import React, { useState, RefObject } from 'react';
import { 
  Bot, 
  User, 
  Loader2, 
  AlertCircle, 
  Image as ImageIcon, 
  Maximize2, 
  X,
  Zap
} from 'lucide-react';
import { AiProfileMode } from '../../../services/ai.service';
import { SecuritySanitizer } from '../../../infrastructure/security/sanitizer';

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  mode?: AiProfileMode;
  imageUrl?: string;
}

interface AIMessageListProps {
  messages: Message[];
  activeMode: AiProfileMode;
  inventoryLength: number;
  isLoading: boolean;
  isProcessingImage: boolean;
  errorMsg: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export const AIMessageList: React.FC<AIMessageListProps> = ({
  messages,
  activeMode,
  inventoryLength,
  isLoading,
  isProcessingImage,
  errorMsg,
  messagesEndRef,
}) => {
  const [previewEnlargedImage, setPreviewEnlargedImage] = useState<string | null>(null);

  const getModeLabel = (mode?: AiProfileMode) => {
    if (mode === 'docbrown') return 'Doc Brown (Élite)';
    if (mode === 'chirurgical') return 'Chirurgical';
    return 'Pédagogue';
  };

  return (
    <>
      <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-grow text-xs sm:text-sm ai-chat-thread">
        {/* En-tête imprimé dédié au protocole d'atelier (visible uniquement à l'impression - Point 4) */}
        <div className="hidden print:block mb-4 pb-3 border-b-2 border-black text-black">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-base font-bold uppercase tracking-wider text-black">
                Protocole Technique d'Atelier • Assistant IA
              </h1>
              <p className="text-xs text-black">
                Profil actif : <strong className="text-black">{getModeLabel(activeMode)}</strong> • Inventaire lié : {inventoryLength} références
              </p>
            </div>
            <div className="text-right text-xs text-black font-mono">
              <p>Édité le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="font-semibold">{messages.length} échange(s)</p>
            </div>
          </div>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ai-message-card ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-1 print:hidden ${
                msg.mode === 'docbrown'
                  ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/40 ring-1 ring-yellow-400/50'
                  : msg.mode === 'chirurgical'
                    ? 'bg-amber-600/20 text-amber-400 border-amber-500/30'
                    : 'bg-purple-600/20 text-purple-400 border-purple-500/30'
              }`}>
                {msg.mode === 'docbrown' ? <Zap className="w-4 h-4 text-yellow-400" /> : <Bot className="w-4 h-4" />}
              </div>
            )}

            <div
              className={`max-w-[85%] print:max-w-full rounded-2xl p-4 shadow-sm leading-relaxed ai-message-bubble ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : msg.mode === 'docbrown'
                    ? 'bg-slate-900 border border-cyan-500/40 text-slate-100 rounded-tl-none shadow-cyan-900/20 shadow-md'
                    : 'bg-slate-900 border border-slate-700/80 text-slate-200 rounded-tl-none'
              }`}
            >
              {/* En-tête du message */}
              <div className="flex items-center justify-between gap-4 mb-2 text-[10px] opacity-75 border-b border-white/10 pb-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span>{msg.sender === 'user' ? 'Vous' : msg.mode === 'docbrown' ? 'Doc Emmett Brown' : 'Gemini Assistant'}</span>
                  {msg.mode && msg.sender === 'ai' && (
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                      msg.mode === 'docbrown'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                        : msg.mode === 'chirurgical' 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    }`}>
                      {getModeLabel(msg.mode)}
                    </span>
                  )}
                </div>
                <span>{msg.timestamp}</span>
              </div>

              {/* Vignette d'image jointe par l'utilisateur */}
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
          <div className="flex gap-3 justify-start items-center ai-no-print">
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
          <div className="flex gap-3 justify-start items-center ai-no-print">
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${
              activeMode === 'docbrown'
                ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/40'
                : activeMode === 'chirurgical'
                  ? 'bg-amber-600/20 text-amber-400 border-amber-500/30'
                  : 'bg-purple-600/20 text-purple-400 border-purple-500/30'
            }`}>
              {activeMode === 'docbrown' ? <Zap className="w-4 h-4 text-yellow-400 animate-pulse" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-300 flex items-center gap-2 text-xs">
              <Loader2 className={`w-4 h-4 animate-spin ${
                activeMode === 'docbrown' ? 'text-cyan-400' : activeMode === 'chirurgical' ? 'text-amber-400' : 'text-purple-400'
              }`} />
              <span>
                {activeMode === 'docbrown'
                  ? 'Calculs de flux temporel à 1,21 gigowatts avec Gemini 3.5 Flash Lite...'
                  : activeMode === 'chirurgical'
                    ? 'Analyse chirurgicale, vérification des découplages et du stock...'
                    : 'Analyse du stock d\'atelier et élaboration des conseils de prototypage...'}
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2 ai-no-print">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
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
    </>
  );
};
