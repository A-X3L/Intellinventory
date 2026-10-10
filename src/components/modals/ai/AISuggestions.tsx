/**
 * @file AISuggestions.tsx
 * @description Composant d'affichage et de rotation des puces de suggestions dynamiques
 * d'ingénierie selon le stock de l'atelier.
 */

import React, { useState, useMemo } from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { ElectronicComponent } from '../../../core/domain/types';

interface AISuggestionsProps {
  inventory: ElectronicComponent[];
  isLoading: boolean;
  onSelectPrompt: (prompt: string) => void;
  onGenerateProjects: () => void;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  inventory,
  isLoading,
  onSelectPrompt,
  onGenerateProjects,
}) => {
  const [suggestionSeed, setSuggestionSeed] = useState(0);

  const dynamicSuggestions = useMemo(() => {
    if (!inventory || inventory.length === 0) {
      return [
        { label: "Idées de projets avec le stock", prompt: "Quels projets puis-je réaliser avec l'ensemble des composants disponibles dans mon stock ?" },
        { label: "Composants basse consommation", prompt: "Quels sont les composants les plus adaptés à une alimentation sur pile ou batterie dans mon stock ?" },
        { label: "Protection contre les surtensions", prompt: "Quelles solutions ou composants ai-je pour protéger mes circuits contre les inversions de polarité et surtensions ?" }
      ];
    }

    const pool: { label: string; prompt: string }[] = [];

    // Détection de composants clés dans le stock réel
    const lm358 = inventory.find(c => c.ref.toUpperCase().includes('LM358') || c.ref.toUpperCase().includes('358'));
    const ne555 = inventory.find(c => c.ref.toUpperCase().includes('555') || c.family.toUpperCase().includes('555'));
    const regulators = inventory.filter(c => c.family.toLowerCase().includes('régulateur') || c.family.toLowerCase().includes('regulator') || c.ref.includes('7805') || c.ref.includes('1117'));
    const powerDrivers = inventory.filter(c => c.family.toLowerCase().includes('mosfet') || c.family.toLowerCase().includes('transistor') || c.ref.includes('IRFZ') || c.ref.includes('TIP') || c.ref.includes('ULN'));
    const logicChips = inventory.filter(c => c.family.toLowerCase().includes('logic') || c.ref.includes('74HC') || c.ref.includes('74AHC'));
    const mcus = inventory.filter(c => c.family.toLowerCase().includes('microcontrôleur') || c.ref.includes('ATmega') || c.ref.includes('ESP32') || c.ref.includes('STM32') || c.ref.includes('ATMEL'));
    const modules = inventory.filter(c => c.family.toLowerCase().includes('module') || c.package === 'Module');

    if (lm358) {
      pool.push({
        label: `Amplificateur ${lm358.ref.split(' ')[0]}`,
        prompt: `Comment câbler l'AOP ${lm358.ref} en comparateur de tension avec hystérésis ou en suiveur, et quelles précautions de découplage prendre ?`
      });
    }

    if (ne555) {
      pool.push({
        label: `Horloge / PWM avec ${ne555.ref.split(' ')[0]}`,
        prompt: `Comment configurer le timer ${ne555.ref} en oscillateur astable à fréquence variable avec rapport cyclique réglable ?`
      });
    }

    if (regulators.length > 0) {
      const reg = regulators[suggestionSeed % regulators.length];
      pool.push({
        label: `Régulation avec ${reg.ref.split(' ')[0]}`,
        prompt: `Quelles sont les tensions d'entrée recommandées, les condensateurs ESR requis et le courant max pour le régulateur ${reg.ref} ?`
      });
    }

    if (powerDrivers.length > 0) {
      const drv = powerDrivers[(suggestionSeed + 1) % powerDrivers.length];
      pool.push({
        label: `Commutation de puissance (${drv.ref.split(' ')[0]})`,
        prompt: `Comment piloter la charge avec le composant ${drv.ref} (${drv.type}) depuis un microcontrôleur 3.3V/5V en toute sécurité (diode de roue libre, résistance de grille) ?`
      });
    }

    if (logicChips.length > 0) {
      const chip = logicChips[(suggestionSeed + 2) % logicChips.length];
      pool.push({
        label: `Logique / Bus : ${chip.ref.split(' ')[0]}`,
        prompt: `Explique-moi l'utilisation pratique et le brochage du circuit logique ${chip.ref} (${chip.type}) dans un montage.`
      });
    }

    if (mcus.length > 0) {
      const mcu = mcus[suggestionSeed % mcus.length];
      pool.push({
        label: `Architecture ${mcu.ref.split(' ')[0]}`,
        prompt: `Quels composants de mon atelier puis-je associer au microcontrôleur ${mcu.ref} pour créer une station d'acquisition autonome ?`
      });
    }

    if (modules.length > 0) {
      const mod = modules[(suggestionSeed + 1) % modules.length];
      pool.push({
        label: `Module ${mod.ref.split(' ')[0]}`,
        prompt: `Comment intégrer le module ${mod.ref} (${mod.functionDesc}) dans un projet et quelles sont ses contraintes d'alimentation ?`
      });
    }

    if (pool.length <= 3) return pool;
    const startIndex = (suggestionSeed * 2) % (pool.length - 2);
    return pool.slice(startIndex, startIndex + 3);
  }, [inventory, suggestionSeed]);

  return (
    <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none flex-shrink-0 ai-no-print">
      <button
        type="button"
        onClick={onGenerateProjects}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 whitespace-nowrap transition-colors disabled:opacity-50"
        title="Générer 3 projets adaptés au stock d'atelier"
      >
        <Lightbulb className="w-3 h-3 text-amber-400" />
        <span>3 Projets avec mon stock</span>
      </button>

      {dynamicSuggestions.map((sug, idx) => (
        <button
          key={`${sug.label}-${idx}`}
          type="button"
          onClick={() => onSelectPrompt(sug.prompt)}
          disabled={isLoading}
          className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 hover:border-slate-500"
          title={sug.prompt}
        >
          <span>{sug.label}</span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => setSuggestionSeed(prev => prev + 1)}
        disabled={isLoading}
        className="px-2 py-1 rounded-full bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/70 text-[10px] whitespace-nowrap transition-colors flex items-center gap-1 ml-auto"
        title="Faire tourner les suggestions selon d'autres références de l'inventaire"
      >
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>Autres suggestions</span>
      </button>
    </div>
  );
};
