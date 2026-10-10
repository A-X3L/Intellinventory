/**
 * @file AIInputBar.tsx
 * @description Barre de saisie textuelle, dictée vocale native et capture photo pour l'Assistant IA.
 */

import React, { RefObject } from 'react';
import { Send, Camera, Trash2, Mic, MicOff, Radio } from 'lucide-react';
import { AiProfileMode } from '../../../services/ai.service';
import { ProcessedImage } from '../../../utils/image-processor';

interface AIInputBarProps {
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  attachedImage: ProcessedImage | null;
  setAttachedImage: (img: ProcessedImage | null) => void;
  activeMode: AiProfileMode;
  isLoading: boolean;
  isProcessingImage: boolean;
  isListening: boolean;
  isSpeechSupported: boolean;
  speechError: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  onSendPrompt: () => void;
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleVoice: () => void;
}

export const AIInputBar: React.FC<AIInputBarProps> = ({
  inputPrompt,
  setInputPrompt,
  attachedImage,
  setAttachedImage,
  activeMode,
  isLoading,
  isProcessingImage,
  isListening,
  isSpeechSupported,
  speechError,
  inputRef,
  fileInputRef,
  cameraInputRef,
  onSendPrompt,
  onFileSelected,
  onToggleVoice,
}) => {
  return (
    <>
      {/* Prévisualisation de l'image attachée prête à l'envoi */}
      {attachedImage && (
        <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 flex-shrink-0 ai-no-print">
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
      <div className="bg-slate-900/95 px-4 py-3 border-t border-slate-700 flex flex-col gap-2 flex-shrink-0 ai-no-print">
        {/* Indicateur de dictée vocale en cours */}
        {isListening && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping flex-shrink-0" />
            <span className="font-medium">Microphone actif : Parlez distinctement pour dicter votre question à l'assistant...</span>
          </div>
        )}

        {speechError && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300">
            <span>{speechError}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Input fichier caché pour Photo / Schéma */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileSelected}
            className="hidden"
          />

          {/* Bouton Unique Photo / Schéma (Fusion ergonomique des boutons redondants) */}
          <button
            type="button"
            id="btn-chat-upload-image"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessingImage}
            className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 text-slate-300 hover:text-white rounded-xl border border-slate-700 flex items-center justify-center transition"
            title="Joindre ou prendre une photo de composant / schéma (max 1024px)"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Bouton Microphone Dictée Vocale Native */}
          <button
            type="button"
            id="btn-chat-voice-dictation"
            onClick={onToggleVoice}
            disabled={isLoading || isProcessingImage || !isSpeechSupported}
            className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse border-rose-500 shadow-md shadow-rose-600/30'
                : isSpeechSupported
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border-slate-700'
                : 'bg-slate-800/50 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
            }`}
            title={
              !isSpeechSupported
                ? 'Dictée vocale non prise en charge par ce navigateur'
                : isListening
                ? 'Écoute vocale en cours... Cliquez pour stopper'
                : 'Dicter vocalement la question (Web Speech API locale)'
            }
          >
            {isListening ? (
              <Radio className="w-4 h-4 animate-spin text-white" />
            ) : isSpeechSupported ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </button>

          {/* Champ texte */}
          <input
            ref={inputRef}
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSendPrompt();
            }}
            placeholder={
              attachedImage 
                ? "Ajoutez une question sur cette image ou appuyez sur Entrée pour l'analyser..."
                : isListening
                ? "Écoute en cours... parlez dans votre micro..."
                : activeMode === 'docbrown'
                  ? "Saisissez votre question ou 'tonnerre de zeus' pour l'assistant temporel..."
                  : activeMode === 'chirurgical'
                    ? "Question technique directe (ex: filtrage LC 100kHz, brochage, découplage)..."
                    : "Posez une question technique (ex: brochage 74HC595, AOP LM358, équivalence)..."
            }
            className={`flex-1 bg-slate-800 border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 ${
              activeMode === 'docbrown'
                ? 'border-cyan-500/50 focus:border-cyan-400 focus:ring-cyan-400'
                : activeMode === 'chirurgical'
                  ? 'border-slate-700 focus:border-amber-500 focus:ring-amber-500'
                  : 'border-slate-700 focus:border-purple-500 focus:ring-purple-500'
            }`}
          />

          {/* Bouton Envoyer */}
          <button
            type="button"
            id="btn-chat-send"
            onClick={onSendPrompt}
            disabled={isLoading || isProcessingImage || (!inputPrompt.trim() && !attachedImage)}
            className={`font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all shadow-md disabled:opacity-40 text-white ${
              activeMode === 'docbrown'
                ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/25 ring-1 ring-yellow-400/50'
                : activeMode === 'chirurgical'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                  : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/25'
            }`}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </div>
      </div>
    </>
  );
};
