# CopyLaTeX

A Chrome and Firefox extension that lets you quickly copy LaTeX code (KaTeX or MathJax) from equations displayed on websites like ChatGPT, DeepSeek, or any blog using mathematical equations. It works simply by hovering over an equation and clicking to copy the LaTeX expression.

## Changelog

### March 12, 2026 - v1.6.0
- Added a popup settings panel for copy behavior and output format.
- Added selection copy modes for Markdown or rich text (HTML) with LaTeX substitutions.
- Added inline and display delimiter switching, including custom delimiter pairs.
- Added options to disable the floating click-to-copy button, hijack normal copy when math is selected, and enable an extension copy shortcut.
- Improved MathJax v3/v4 selection copy so untouched formulas can still be copied as LaTeX.
- Improved single-formula copy so delimiter settings apply there too.
- The floating copy button remains a single toggle that controls both the hover overlay and formula click-to-copy behavior.

### Previous release notes
- v1.5: Typst support.
- v1.4: New feature. Select text that includes formulas, right click it, and a `Copy as Markdown (with LaTeX)` option appears.
- v1.3: Dark mode enabled and the check emoji was replaced with an SVG icon.
- v1.2: Added MathJax v3 support via the MathJax API when the generated HTML does not contain source LaTeX.
- v1.1: Added support for Wikipedia and Wikiwand math images.


## Example GIFs
#### KaTeX
<img src="assets/gif-demo-katex.gif" alt="Demo-KaTeX" width="800">

#### MathJax
<img src="assets/gif-demo-mathjax.gif" alt="Demo-MathJax" width="800">

#### Wikipedia images
<img src="assets/gif-demo-wikipedia.gif" alt="Demo-MathJax" width="800">

#### Copy as Markdown
<img src="assets/gif-demo-copy-as-markdown.gif" alt="Demo-Markdown" width="800">

You can use [https://markdown-preview-katex.vercel.app/](https://markdown-preview-katex.vercel.app/) to test this feature.

#### Copy as Typst

<img src="assets/gif-demo-copy-as-typst.gif" alt="Demo-Typst" width="800">

You can use [https://typst-online.vercel.app/](https://typst-online-editor.vercel.app/) to test this feature.

## Popular Sites Using MathJax/KaTeX
Generally any math, physics, or engineering-related blog or website. Some typical examples:
- KaTeX: ChatGPT, DeepSeek, Notion, Gemini...
- MathJax: Stack Exchange, ProofWiki...

## Host permissions and speed
You can check the javascript source code yourself. It loads after everything and is very fast and small sized. However if you want you can always customize in which hosts (websites) the extension loads or not:

<img src="assets/only-specific-sites.jpg" alt="Manage-allowed-hosts" width="800">

<img src="assets/example-specific-site.jpg" alt="Adding-an-allowed-host" width="800">

This is done in `chrome://extensions` in the extension 'Details'.

<details>
<summary>Recommended websites to add</summary>

- https://chatgpt.com/*
- https://chat.deepseek.com/*
- https://math.stackexchange.com/*
- https://physics.stackexchange.com/*
- https://proofwiki.org/*
- https://\*.wikipedia.org/*
- https://www.wikiwand.com/*
- https://mathoverflow.net/*
- https://\*.notion.site/*
- https://publish.obsidian.md/*
- https://nbviewer.org/*
- https://gemini.google.com/*
- https://www.phind.com/*
- https://chat.mistral.ai/*
- https://librechat-librechat.hf.space/*
- https://www.perplexity.ai/*
- https://phys.libretexts.org/*

</details>

## How it works technically

1. **Content Script (`content.js`)**:
   -  **For KaTeX**
      - Automatically detects all `<span class="katex">` elements on the page.
      - Extracts the LaTeX code from `<annotation encoding="application/x-tex">`.
   - **For Gemini KaTeX**
     - Extracts LaTeX inside `data-math` attribute.
   - **For MathJax**
     - Extracts LaTeX inside `<script type="math/tex">` elements.
   - **For MathJax v3/v4**
      - Injects page script (`mathjax-api.js`) to extract LaTeX from `mjx-container` elements via MathJax's API. Only possible via API and inject script because no LaTeX code present in the generated HTML.
   - **For Wikipedia**
     - Extracts LaTeX from `alt` attributes of images.
   - **For all of them** 
   - Shows an overlay when hovering over the equation, when the floating copy button setting is enabled.
   - Allows clicking formulas to copy the code to clipboard using `navigator.clipboard.writeText()`. This behavior uses the same floating copy button toggle.
   - Uses an inline `<svg>` to avoid external file dependencies.

2. **CSS (`overlay.css`)**:
   - Overlay styling: white background, subtle border and shadow.
   - Large, readable text.
   - Centered over the KaTeX formula.
   - `pointer` cursor.

3. **Extension declaration `manifest.json`**:
   - Injects `content.js`, `overlay.css` and the other scripts.
   - Sets information and permissions of the extension.
4. **Background script `background.js`**:
   - Handles context menu (right click). Needed to display the "Copy as Markdown" option when right clicking the selected text.
5. **Selection script `selection-to-markdown.js`**:
   - A set of functions, workers and utilities to convert HTML to markdown while preserving our extracted LaTeX. Under the hood uses the `turndown.js` library and the `turndown-plugin-gfm.js` GitHub-flavored markdown plugin for converting HTML to Markdown.

### How to test the extension locally

1. Download the `src` directory (using for example [download-directory.github.io](https://download-directory.github.io/)). Rename it if you want.
2. Then go to `chrome://extensions` (as if it were an URL) and in the top left click the 'Load unpacked' button and select the `src` (or whatever is named now) folder.

## Building and Packaging

You can automate the creation of a production-ready ZIP file for both Chrome and Firefox using the provided build scripts. These scripts will create a clean `dist` directory, apply browser-specific tweaks (like updating the settings URL), and package the extension.

### For Chrome:
1. Run the script:
   ```bash
   ./build-chrome.sh
   ```
2. The output will be `copy-latex-chrome.zip`.

### For Firefox:
1. Run the script:
   ```bash
   ./build-firefox.sh
   ```
2. The output will be `copy-latex-firefox.zip`. This version includes the necessary `browser_specific_settings` in the `manifest.json`.


## Acknowledgements

This project builds on the original CopyLaTeX extension created by [Mapaor](https://github.com/Mapaor), who authored and published the initial version of the extension.

Credits to @leander-ow for his dark mode contribution and to  @ashigirl96 for suggesting and providing a working code implementation for the "Copy as Markdown" feature. 

This extension also works thanks to the following open source projects:
- [Turndown](https://github.com/mixmark-io/turndown) - Library for converting HTML to Markdown
- [tex2typst](https://github.com/qwinsi/tex2typst) - Library for converting LaTeX to Typst
- [markdown2typst](https://github.com/Mapaor/markdown2typst) - Library for converting Markdown to Typst

## License

MIT License.

It is MIT Licensed so that anyone can customize it to their needs but please don't just copy-cat the code and publish it with a new name, it's weird. 

If you have an idea for a new feature open an issue and let me know! Also if you have the time to implement a feature you want it would be great if you made a pull request.

## Planned features:

- [X] **Text selection to Markdown**: Select some text that includes equations, right click and a new option "[Extension Icon] Copy as Markdown" appears.
- [X] **Typst support**: 
  Pop up with a toggle between LaTeX and Typst
- [X] **Custom delimiters**:
  Choose between no delimiters, `$...$`, `$$...$$`, `\(...\)`, `\[...\]`, or a custom pair for inline and display math.
