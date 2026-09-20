/**
 * @file AIModal.tsx
 * @description Fenêtre de dialogue interactive avec l'Assistant IA d'ingénierie électronique
 * Communication sécurisée via Backend-for-Frontend sans clé dans le navigateur
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
  AlertCircle
} from 'lucide-react';
import { ElectronicComponent } from '../../core/domain/types';
import { AiService } from '../../services/ai.service';
import { SecuritySanitizer } from '../../infrastructure/security/sanitizer';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Bonjour ! Je suis votre assistant d'ingénierie électronique. J'ai accès en temps réel aux **${inventory.length} références** de votre stock d'atelier.
      
Vous pouvez me demander comment concevoir un circuit, trouver un équivalent, calculer des valeurs de composants passifs ou générer des idées de prototypes.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendPrompt = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    setInputPrompt('');
    setErrorMsg(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const reply = await AiService.askQuestion(prompt, inventory);
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: reply,
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
        text: "Historique réinitialisé. Posez une question sur votre inventaire ou vos schémas de montage.",
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
        {/* Header */}
        <div className="bg-slate-900/90 px-5 py-3.5 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Assistant IA d'Ingénierie
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Gemini 3.1 Flash Lite
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Clé isolée côté serveur • Contexte de stock injecté
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-1">
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
                <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-70">
                  <span className="font-semibold">{msg.sender === 'user' ? 'Vous' : 'Gemini Assistant'}</span>
                  <span>{msg.timestamp}</span>
                </div>

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

          {/* Indicateur de chargement */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-300 flex items-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>Analyse du stock et génération de la réponse technique...</span>
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

        {/* Input Bar */}
        <div className="bg-slate-900/90 px-4 py-3.5 border-t border-slate-700 flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendPrompt();
            }}
            placeholder="Posez une question technique sur vos composants (ex: brochage 74HC595, AOP LM358)..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />

          <button
            type="button"
            onClick={() => handleSendPrompt()}
            disabled={isLoading || !inputPrompt.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all shadow-md shadow-purple-600/25"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
