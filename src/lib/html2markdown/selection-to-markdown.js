function createSelectionContainer(html) {
  const container = document.createElement('div');
  // The HTML comes from the user's current DOM selection and is only used for
  // detached conversion here. Scripts are removed before any clipboard write.
  container.innerHTML = html;
  return container;
}

function getMathElements(container) {
  return [
    ...Array.from(container.querySelectorAll('.katex')),
    ...Array.from(container.querySelectorAll('[data-math]')),
    ...Array.from(container.querySelectorAll('mjx-container')),
    ...Array.from(container.querySelectorAll('.MathJax_Display, .MJXc-display, .MathJax, .mjx-chtml, .MathJax_CHTML, .MathJax_MathML')),
    ...Array.from(container.querySelectorAll('img.mwe-math, img.mwe-math-fallback-image-inline, img.mwe-math-fallback-image-display'))
  ];
}

function replaceMathWithMarkers(container, settings, mode) {
  const mathElements = getMathElements(container);

  mathElements.forEach((el) => {
    const latex = extractLatexFromElement(el);
    if (!latex) {
      return;
    }

    const displayMode = getDisplayMode(el);
    let replacementText = latex;

    if (mode === 'typst-markdown') {
      replacementText = displayMode === 'display' ? `$$${latex}$$` : `$${latex}$`;
    } else {
      const delimiters = CopyLatexSettings.resolveDelimiterPair(settings, displayMode === 'display');
      replacementText = `${delimiters.start}${latex}${delimiters.end}`;
    }

    const marker = document.createElement('span');
    marker.className = 'latex-marker';
    marker.setAttribute('data-latex-mode', displayMode);
    marker.textContent = replacementText;
    el.replaceWith(marker);
  });
}

function stripMathArtifacts(container) {
  container.querySelectorAll('script, style').forEach((node) => node.remove());
  container.querySelectorAll('script[type*="math/tex"]').forEach((node) => node.remove());
  container.querySelectorAll('math, .katex-mathml, mjx-assistive-mml, annotation, semantics').forEach((node) => node.remove());
  container.querySelectorAll('.katex-html, .katex-fallback').forEach((node) => node.remove());
}

function absolutizeUrls(container) {
  container.querySelectorAll('a[href]').forEach((link) => {
    link.setAttribute('href', link.href);
  });

  container.querySelectorAll('img[src]').forEach((img) => {
    img.setAttribute('src', img.src);
  });
}

function createTurndownService() {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  })
    .remove('script')
    .remove('style');

  turndownService.use(turndownPluginGfm.gfm);
  turndownService.addRule('latexMarker', {
    filter: (node) => {
      return node.nodeName === 'SPAN'
        && node.classList
        && node.classList.contains('latex-marker');
    },
    replacement: (content, node) => {
      const value = node.textContent || '';
      return node.getAttribute('data-latex-mode') === 'display'
        ? `\n\n${value}\n\n`
        : value;
    }
  });

  return turndownService;
}

function normalizeMarkdown(markdown) {
  return markdown
    .replace(/^[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractPlainTextFromContainer(container) {
  const clone = container.cloneNode(true);
  const blockSelectors = 'p, div, section, article, aside, header, footer, main, nav, li, ul, ol, blockquote, pre, table, tr, h1, h2, h3, h4, h5, h6';

  clone.querySelectorAll('br').forEach((node) => {
    node.replaceWith(document.createTextNode('\n'));
  });

  clone.querySelectorAll('.latex-marker[data-latex-mode="display"]').forEach((node) => {
    node.prepend(document.createTextNode('\n'));
    node.append(document.createTextNode('\n'));
  });

  clone.querySelectorAll(blockSelectors).forEach((node) => {
    node.append(document.createTextNode('\n'));
  });

  return clone.textContent
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function convertHtmlToMarkdownText(html, settings) {
  const container = createSelectionContainer(html);
  replaceMathWithMarkers(
    container,
    settings,
    settings.outputFormat === 'typst' ? 'typst-markdown' : 'latex'
  );
  stripMathArtifacts(container);
  absolutizeUrls(container);

  const markdown = normalizeMarkdown(createTurndownService().turndown(container.innerHTML));

  if (settings.outputFormat !== 'typst') {
    return markdown;
  }

  if (!window.markdown2typst) {
    throw new Error('markdown2typst library not loaded');
  }

  return window.markdown2typst(markdown);
}

function convertHtmlToRichTextPayload(html, settings) {
  const container = createSelectionContainer(html);
  replaceMathWithMarkers(container, settings, 'latex');
  stripMathArtifacts(container);
  absolutizeUrls(container);

  return {
    format: 'rich-text',
    text: extractPlainTextFromContainer(container),
    html: container.innerHTML.trim()
  };
}

function extractLatexFromElement(el) {
  const remembered = el.getAttribute?.('data-copylatex-latex');
  if (remembered && remembered.trim()) {
    return remembered.trim();
  }

  if (
    el.tagName === 'IMG'
    && (
      el.classList.contains('mwe-math')
      || el.classList.contains('mwe-math-fallback-image-inline')
      || el.classList.contains('mwe-math-fallback-image-display')
    )
  ) {
    const alt = el.getAttribute('alt');
    if (alt) {
      const match = alt.match(/^\{\\displaystyle\s*([\s\S]*?)\}$/);
      return match && match[1] ? match[1].trim() : alt.trim();
    }
  }

  if (el.classList.contains('katex')) {
    const annotation = el.querySelector('.katex-mathml annotation[encoding="application/x-tex"]');
    if (annotation && annotation.textContent) {
      return annotation.textContent.trim();
    }

    return el.getAttribute('data-tex')
      || el.getAttribute('data-latex')
      || el.getAttribute('aria-label')
      || null;
  }

  if (el.hasAttribute('data-math')) {
    const dataMath = el.getAttribute('data-math');
    if (dataMath && dataMath.trim()) {
      return dataMath.trim();
    }
  }

  if (el.tagName === 'MJX-CONTAINER') {
    const sibling = el.nextElementSibling;
    if (sibling && sibling.tagName === 'SCRIPT' && sibling.type?.includes('math/tex')) {
      return sibling.textContent?.trim() || null;
    }
  }

  const sibling = el.nextElementSibling;
  if (sibling && sibling.tagName === 'SCRIPT') {
    const type = sibling.type;
    if (type === 'math/tex' || type === 'math/tex; mode=display') {
      return sibling.textContent?.trim() || null;
    }
  }

  return null;
}

function getDisplayMode(el) {
  if (el.classList.contains('mwe-math-fallback-image-display')) {
    return 'display';
  }

  if (el.classList.contains('MathJax_Display') || el.classList.contains('MJXc-display')) {
    return 'display';
  }

  if (el.tagName === 'MJX-CONTAINER' && el.hasAttribute('display')) {
    return 'display';
  }

  if (el.classList.contains('katex')) {
    if (el.parentElement?.classList.contains('katex-display')) {
      return 'display';
    }
    if (el.parentElement && window.getComputedStyle(el.parentElement).display === 'block') {
      return 'display';
    }
  }

  if (el.hasAttribute('data-math')) {
    return el.tagName === 'DIV' ? 'display' : 'inline';
  }

  return 'inline';
}

function buildClipboardPayload(html, settings) {
  const mergedSettings = CopyLatexSettings.merge(settings);

  if (mergedSettings.outputFormat === 'latex' && mergedSettings.selectionCopyMode === 'rich-text') {
    return convertHtmlToRichTextPayload(html, mergedSettings);
  }

  return {
    format: mergedSettings.outputFormat === 'typst' ? 'typst' : 'markdown',
    text: convertHtmlToMarkdownText(html, mergedSettings)
  };
}

async function copyTextToClipboard(text) {
  class KnownFailureError extends Error {}

  const useClipboardApi = async (value) => {
    let permission;
    try {
      permission = await navigator.permissions.query({
        name: 'clipboard-write',
        allowWithoutGesture: true
      });
    } catch (error) {
      if (error instanceof TypeError) {
        await navigator.clipboard.writeText(value);
        return true;
      }
      throw error;
    }

    if (permission && permission.state === 'granted') {
      await navigator.clipboard.writeText(value);
      return true;
    }

    throw new KnownFailureError('no permission to call navigator.clipboard API');
  };

  const useTextareaFallback = async (value) => {
    const textBox = document.createElement('textarea');
    textBox.value = value;
    textBox.setAttribute('readonly', '');
    textBox.style.position = 'fixed';
    textBox.style.left = '-9999px';
    textBox.style.top = '0';
    document.body.appendChild(textBox);

    try {
      textBox.select();
      const result = document.execCommand('copy');
      if (!result) {
        throw new KnownFailureError('execCommand returned false');
      }
      return true;
    } finally {
      textBox.remove();
    }
  };

  try {
    await useClipboardApi(text);
    return { ok: true, method: 'navigator_api' };
  } catch (error) {
    if (!(error instanceof KnownFailureError)) {
      return { ok: false, error: `${error.name} ${error.message}`, method: 'navigator_api' };
    }
  }

  try {
    await useTextareaFallback(text);
    return { ok: true, method: 'textarea' };
  } catch (error) {
    return { ok: false, error: `${error.name} ${error.message}`, method: 'textarea' };
  }
}

async function copyHtmlWithExecCommand(html) {
  const container = document.createElement('div');
  container.contentEditable = 'true';
  container.setAttribute('aria-hidden', 'true');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.opacity = '0';
  container.innerHTML = html;
  document.body.appendChild(container);

  const selection = window.getSelection();
  const previousRanges = [];

  if (selection) {
    for (let index = 0; index < selection.rangeCount; index += 1) {
      previousRanges.push(selection.getRangeAt(index).cloneRange());
    }
    selection.removeAllRanges();
  }

  const range = document.createRange();
  range.selectNodeContents(container);
  selection?.addRange(range);

  try {
    globalThis.CopyLatexBrowserCopyInProgress = true;
    return document.execCommand('copy');
  } finally {
    globalThis.CopyLatexBrowserCopyInProgress = false;
    selection?.removeAllRanges();
    previousRanges.forEach((previousRange) => selection?.addRange(previousRange));
    container.remove();
  }
}

async function copyClipboardPayload(payload, options = {}) {
  const clipboardEvent = options.clipboardEvent;
  if (payload.html) {
    if (clipboardEvent) {
      clipboardEvent.preventDefault();
      clipboardEvent.stopPropagation();
    }

    const copied = await copyHtmlWithExecCommand(payload.html);
    if (copied) {
      return { ok: true, method: 'exec_command_html', format: payload.format };
    }

    if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([payload.text || ''], { type: 'text/plain' }),
            'text/html': new Blob([payload.html], { type: 'text/html' })
          })
        ]);
        return { ok: true, method: 'navigator_item', format: payload.format };
      } catch (error) {
        console.debug('[Copy LaTeX] Rich clipboard API failed:', error);
      }
    }
  }

  if (clipboardEvent?.clipboardData) {
    clipboardEvent.preventDefault();
    clipboardEvent.stopPropagation();
    clipboardEvent.clipboardData.setData('text/plain', payload.text || '');
    return { ok: true, method: 'clipboard_event', format: payload.format };
  }

  const textResult = await copyTextToClipboard(payload.text || '');
  return { ...textResult, format: payload.format };
}

async function convertAndCopyHtml(html, settings = CopyLatexSettings.defaults, options = {}) {
  try {
    const payload = buildClipboardPayload(html, settings);
    if (!payload.text && !payload.html) {
      return { ok: false, error: 'No content' };
    }

    return await copyClipboardPayload(payload, options);
  } catch (error) {
    console.error('[Copy LaTeX] Error in convertAndCopyHtml:', error);
    return { ok: false, error: String(error) };
  }
}
