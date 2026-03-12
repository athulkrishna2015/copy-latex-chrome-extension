const CopyLatexSettings = (() => {
  const defaults = Object.freeze({
    outputFormat: 'latex',
    selectionCopyMode: 'markdown',
    enableFloatingButton: true,
    hijackNormalCopy: false,
    enableCustomCopyShortcut: false,
    inlineDelimiterType: 'single',
    inlineCustomStart: '$',
    inlineCustomEnd: '$',
    displayDelimiterType: 'double',
    displayCustomStart: '$$',
    displayCustomEnd: '$$'
  });

  const storageKeys = Object.freeze(Object.keys(defaults));

  function merge(stored = {}) {
    return { ...defaults, ...stored };
  }

  function resolveDelimiterPair(settings, isDisplay = false) {
    const merged = merge(settings);

    if (isDisplay) {
      switch (merged.displayDelimiterType) {
        case 'none':
          return { start: '', end: '' };
        case 'single':
          return { start: '$', end: '$' };
        case 'double':
          return { start: '$$', end: '$$' };
        case 'brackets':
          return { start: '\\[', end: '\\]' };
        case 'custom':
          return {
            start: merged.displayCustomStart || '$$',
            end: merged.displayCustomEnd || '$$'
          };
        default:
          return { start: '$$', end: '$$' };
      }
    }

    switch (merged.inlineDelimiterType) {
      case 'none':
        return { start: '', end: '' };
      case 'single':
        return { start: '$', end: '$' };
      case 'double':
        return { start: '$$', end: '$$' };
      case 'paren':
        return { start: '\\(', end: '\\)' };
      case 'custom':
        return {
          start: merged.inlineCustomStart || '$',
          end: merged.inlineCustomEnd || '$'
        };
      default:
        return { start: '$', end: '$' };
    }
  }

  function getSelectionMenuTitle(settings) {
    const merged = merge(settings);

    if (merged.outputFormat === 'typst') {
      return 'Copy as Typst';
    }

    return merged.selectionCopyMode === 'rich-text'
      ? 'Copy as Rich Text HTML (with LaTeX)'
      : 'Copy as Markdown (with LaTeX)';
  }

  return {
    defaults,
    storageKeys,
    merge,
    resolveDelimiterPair,
    getSelectionMenuTitle
  };
})();

globalThis.CopyLatexSettings = CopyLatexSettings;
