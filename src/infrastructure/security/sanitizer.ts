/**
 * @file sanitizer.ts
 * @description Utilitaire d'assainissement de texte et rendu Markdown sécurisé sans innerHTML vulnérable
 */

export const SecuritySanitizer = {
  /**
   * Échappe les caractères HTML dangereux pour éviter toute injection XSS.
   */
  escapeHtml(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/[&<>"']/g, (match) => {
      switch (match) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#039;';
        default: return match;
      }
    });
  },

  /**
   * Génère du HTML sécurisé pour les messages Markdown de l'assistant IA
   * Traite d'abord par échappement strict, puis transforme les balises autorisées.
   */
  formatAiMarkdown(text: string): string {
    if (!text || typeof text !== 'string') return '';

    const safe = this.escapeHtml(text);

    return safe
      // H3 titles
      .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-emerald-400 mt-4 mb-2 pb-1 border-b border-slate-700/60">$1</h3>')
      // H2 titles
      .replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-purple-300 mt-5 mb-2 pb-1 border-b border-purple-900/40">$1</h2>')
      // H1 titles
      .replace(/^# (.*$)/gim, '<h1 class="text-lg font-extrabold text-white mt-5 mb-2">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
      // Inline Code
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-purple-300 font-mono text-xs">$1</code>')
      // List items
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc marker:text-emerald-400 py-0.5 text-slate-300 leading-relaxed">$1</li>')
      // Sauts de ligne multiples
      .replace(/\n\n/g, '<div class="h-2"></div>')
      .replace(/\n/g, '<br/>');
  }
};
