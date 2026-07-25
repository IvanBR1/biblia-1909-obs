(function () {
  const root = document.documentElement;
  const body = document.body;
  const params = new URLSearchParams(window.location.search);
  const preferredTheme = params.get('theme');
  let selectedThemeId = preferredTheme || localStorage.getItem('bibleSelectedTheme') || 'modern';
  let activeSettings = {};
  let verseContainer;
  let verseHeading;
  let versePsalmSuperscription;
  let verseText;
  let verseNote;
  let verseReference;
  let fitFrame;
  const ASSET_DB = 'bibleObsAssets';
  const backgroundImage = document.getElementById('background-image');
  let backgroundObjectUrl = '';
  let loadedBackgroundVersion = null;

  const getTheme = () => window.BibleThemeRegistry.get(selectedThemeId) || window.BibleThemeRegistry.get('modern');
  const getDefaults = () => ({ ...window.BibleThemeDefaults, ...getTheme().defaults });

  function setEffect(effect) {
    const effects = {
      none: ['none', 'none'],
      shadow: ['0 4px 18px rgba(0,0,0,.82)', 'none'],
      outline: ['-1px -1px 0 rgba(0,0,0,.8),1px -1px 0 rgba(0,0,0,.8),-1px 1px 0 rgba(0,0,0,.8),1px 1px 0 rgba(0,0,0,.8),0 4px 14px rgba(0,0,0,.7)', 'none'],
      contrast: ['0 3px 12px rgba(0,0,0,.95)', 'contrast(1.18)']
    };
    const current = effects[effect] || effects.shadow;
    root.style.setProperty('--verse-text-shadow', current[0]);
    root.style.setProperty('--verse-filter', current[1]);
  }

  function setAnchoring(horizontal, vertical) {
    const horizontalPositions = {
      left: ['24px', 'auto', '0%'],
      center: ['50%', 'auto', '-50%'],
      right: ['auto', '24px', '0%']
    };
    const verticalPositions = {
      top: ['24px', 'auto', '0%'],
      center: ['50%', 'auto', '-50%'],
      bottom: ['auto', '24px', '0%']
    };
    const [left, right, translateX] = horizontalPositions[horizontal] || horizontalPositions.center;
    const [top, bottom, translateY] = verticalPositions[vertical] || verticalPositions.center;
    root.style.setProperty('--verse-left', left);
    root.style.setProperty('--verse-right', right);
    root.style.setProperty('--verse-top', top);
    root.style.setProperty('--verse-bottom', bottom);
    root.style.setProperty('--verse-translate-x', translateX);
    root.style.setProperty('--verse-translate-y', translateY);
    body.dataset.horizontalAlign = horizontalPositions[horizontal] ? horizontal : 'center';
    body.dataset.verticalAlign = verticalPositions[vertical] ? vertical : 'center';
  }

  function contentFits(container) {
    if (!container) return true;
    return container.scrollHeight <= container.clientHeight + 1
      && container.scrollWidth <= container.clientWidth + 1;
  }

  function getFittedSize(container) {
    if (!container || !container.querySelector('.verse-text')?.textContent.trim()) return null;
    const safe = window.BibleThemeUtilities;
    const requestedSize = safe.clamp(activeSettings.fontSize, 8, 96, 52);
    // El tamaño del tema es el tamaño editorial de referencia. Autoajustar
    // sólo lo reduce si el pasaje no cabe; ampliarlo hasta 96 px hacía que
    // versículos cortos cambiaran drásticamente entre temas.
    const maximumSize = requestedSize;
    const minimumSize = 8;

    container.style.setProperty('--verse-font-size', `${maximumSize}px`);
    if (activeSettings.autoFit === false || contentFits(container)) return maximumSize;

    let low = minimumSize;
    let high = maximumSize;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidate = (low + high) / 2;
      container.style.setProperty('--verse-font-size', `${candidate}px`);
      if (contentFits(container)) low = candidate;
      else high = candidate;
    }
    return Number(Math.max(minimumSize, low - 0.5).toFixed(1));
  }

  function fitTextToContainer() {
    const size = getFittedSize(verseContainer);
    if (size !== null) root.style.setProperty('--verse-font-size', `${size}px`);
  }

  function scheduleFit() {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(() => {
      fitFrame = requestAnimationFrame(fitTextToContainer);
    });
  }

  function formatPassage(passage = {}) {
    const content = String(passage.content || '');
    const isPsalm = /^Salmos\s+\d+:/u.test(String(passage.reference || ''));
    const marker = isPsalm && content.match(/^(.{1,420}?)\s*\[\d+\]\s+([\s\S]+)$/u);
    if (!marker) return { ...passage, content, isPsalmSuperscription: Boolean(passage.psalmSuperscription) };
    return {
      ...passage,
      heading: passage.heading || '',
      psalmSuperscription: marker[1].trim(),
      content: marker[2].trim(),
      isPsalmSuperscription: true
    };
  }

  function setPassageContent({ content = '', heading = '', note = '', psalmSuperscription = '', isPsalmSuperscription = false }) {
    verseHeading.textContent = window.BibleThemeUtilities.sanitizeText(heading);
    versePsalmSuperscription.textContent = window.BibleThemeUtilities.sanitizeText(psalmSuperscription);
    verseText.textContent = window.BibleThemeUtilities.sanitizeText(content);
    verseNote.textContent = window.BibleThemeUtilities.sanitizeText(note);
    verseContainer.classList.toggle('has-psalm-superscription', isPsalmSuperscription);
  }

  // Medimos el siguiente pasaje en una copia invisible. El texto que está en
  // pantalla nunca recibe el tamaño máximo temporal, por lo que Autoajustar
  // no provoca saltos ni parpadeos durante la transición del contenedor.
  function measurePassage(command) {
    if (!verseContainer) return null;
    const clone = verseContainer.cloneNode(true);
    clone.removeAttribute('id');
    clone.style.cssText = `position:fixed;top:24px;left:24px;width:${verseContainer.offsetWidth}px;max-height:calc(100vh - 48px);visibility:hidden;opacity:0;transform:none;transition:none;pointer-events:none;`;
    clone.querySelector('#verse-heading').textContent = window.BibleThemeUtilities.sanitizeText(command.heading || '');
    clone.querySelector('#psalm-superscription').textContent = window.BibleThemeUtilities.sanitizeText(command.psalmSuperscription || '');
    clone.querySelector('#verse-text').textContent = window.BibleThemeUtilities.sanitizeText(command.content || '');
    clone.querySelector('#verse-note').textContent = window.BibleThemeUtilities.sanitizeText(command.note || '');
    clone.querySelector('#verse-reference').textContent = command.reference || '';
    clone.classList.toggle('has-psalm-superscription', Boolean(command.isPsalmSuperscription));
    document.getElementById('theme-root').append(clone);
    const size = getFittedSize(clone);
    clone.remove();
    return size;
  }

  function readBackgroundImage() {
    return new Promise(resolve => {
      const request = indexedDB.open(ASSET_DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('assets');
      request.onerror = () => resolve(null);
      request.onsuccess = () => {
        const database = request.result;
        const read = database.transaction('assets').objectStore('assets').get('background-image');
        read.onsuccess = () => { resolve(read.result || null); database.close(); };
        read.onerror = () => { resolve(null); database.close(); };
      };
    });
  }

  async function applyBackgroundImage() {
    const version = `${activeSettings.imageAssetVersion || 0}:${activeSettings.imageFileName || ''}`;
    if (loadedBackgroundVersion === version) return;
    loadedBackgroundVersion = version;
    if (backgroundObjectUrl) URL.revokeObjectURL(backgroundObjectUrl);
    backgroundObjectUrl = '';
    let hasImage = false;

    if (activeSettings.imageFileName) {
      const file = await readBackgroundImage();
      if (loadedBackgroundVersion !== version) return;
      if (file) {
        backgroundObjectUrl = URL.createObjectURL(file);
        hasImage = true;
      }
    }

    backgroundImage.src = backgroundObjectUrl || '';
    backgroundImage.hidden = !hasImage;
    body.dataset.backgroundType = activeSettings.backgroundType === 'color'
      ? 'color'
      : hasImage
        ? 'image'
        : 'none';
  }

  function applySettings(settings) {
    activeSettings = { ...getDefaults(), ...activeSettings, ...(settings || {}) };
    const safe = window.BibleThemeUtilities;
    setAnchoring(activeSettings.horizontalAlign, activeSettings.verticalAlign);
    root.style.setProperty('--verse-font-family', activeSettings.fontFamily);
    root.style.setProperty('--verse-font-weight', safe.clamp(activeSettings.fontWeight, 400, 800, 400));
    root.style.setProperty('--verse-font-size', `${safe.clamp(activeSettings.fontSize, 18, 96, 52)}px`);
    root.style.setProperty('--verse-text-color', activeSettings.textColor);
    const cardColor = activeSettings.cardBackgroundColor || activeSettings.backgroundColor;
    const cardOpacity = activeSettings.cardBackgroundOpacity ?? activeSettings.backgroundOpacity;
    root.style.setProperty('--verse-container-bg', safe.hexToRgba(cardColor, safe.clamp(cardOpacity, 0, 100, 88) / 100));
    root.style.setProperty('--verse-text-align', activeSettings.textAlign);
    root.style.setProperty('--verse-line-height', safe.clamp(activeSettings.lineHeight, .8, 2.5, 1.2));
    root.style.setProperty('--verse-letter-spacing', `${safe.clamp(activeSettings.letterSpacing, -2, 12, 0)}px`);
    root.style.setProperty('--verse-padding', `${safe.clamp(activeSettings.padding, 0, 120, 32)}px`);
    root.style.setProperty('--verse-max-width', `${safe.clamp(activeSettings.maxWidth, 320, 1800, 1120)}px`);
    root.style.setProperty('--verse-transition-duration', `${safe.clamp(activeSettings.transitionDuration, 150, 1800, 550)}ms`);
    const sceneFill = activeSettings.backgroundType === 'color';
    const sceneColor = safe.hexToRgba(activeSettings.backgroundColor, safe.clamp(activeSettings.backgroundOpacity, 0, 100, 88) / 100);
    root.style.setProperty('--scene-background-color', sceneFill ? sceneColor : 'transparent');
    root.style.setProperty('--scene-background-fit', activeSettings.backgroundFit === 'stretch' ? 'fill' : ['cover', 'contain'].includes(activeSettings.backgroundFit) ? activeSettings.backgroundFit : 'cover');
    root.style.setProperty('--scene-background-position', activeSettings.backgroundPosition || 'center center');
    root.style.setProperty('--scene-background-shade', safe.clamp(activeSettings.backgroundOverlayOpacity, 0, 90, 42) / 100);
    body.dataset.transition = ['fade', 'slide', 'scale', 'reveal', 'flip'].includes(activeSettings.transition) ? activeSettings.transition : 'fade';
    body.dataset.textAlign = ['left', 'center', 'right'].includes(activeSettings.textAlign) ? activeSettings.textAlign : 'center';
    body.dataset.backgroundType = activeSettings.backgroundType === 'color' ? 'color' : (activeSettings.imageFileName ? 'image' : 'none');
    body.classList.toggle('animate-background', Boolean(activeSettings.imageAnimation));
    body.classList.toggle('background-hidden', activeSettings.backgroundVisible === false);
    applyBackgroundImage();
    setEffect(activeSettings.textEffect);
    scheduleFit();
  }

  function renderTheme(themeId) {
    if (!window.BibleThemeRegistry.has(themeId)) return;
    const oldPassage = {
      heading: verseHeading ? verseHeading.textContent : '',
      psalmSuperscription: versePsalmSuperscription ? versePsalmSuperscription.textContent : '',
      content: verseText ? verseText.textContent : '',
      note: verseNote ? verseNote.textContent : ''
    };
    const oldReference = verseReference ? verseReference.textContent : '';
    const wasVisible = verseContainer && verseContainer.classList.contains('visible');
    selectedThemeId = themeId;
    const theme = getTheme();
    body.dataset.theme = theme.id;
    document.getElementById('theme-root').innerHTML = theme.render();
    verseContainer = document.getElementById('verse-container');
    verseHeading = document.getElementById('verse-heading');
    versePsalmSuperscription = document.getElementById('psalm-superscription');
    if (!versePsalmSuperscription) {
      versePsalmSuperscription = document.createElement('div');
      versePsalmSuperscription.className = 'psalm-superscription';
      versePsalmSuperscription.id = 'psalm-superscription';
      verseHeading.insertAdjacentElement('afterend', versePsalmSuperscription);
    }
    verseText = document.getElementById('verse-text');
    verseNote = document.getElementById('verse-note');
    verseReference = document.getElementById('verse-reference');
    // Ensure we refit text after the transition ends for any transition type.
    try {
      if (verseContainer._fitListener) verseContainer.removeEventListener('transitionend', verseContainer._fitListener);
    } catch (e) {}
    verseContainer._fitListener = function (ev) {
      if (ev.target !== verseContainer) return;
      // opacity and transform cover most visibility transitions used in CSS
      if (ev.propertyName === 'opacity' || ev.propertyName === 'transform') {
        if (verseContainer.classList.contains('visible')) scheduleFit();
      }
    };
    verseContainer.addEventListener('transitionend', verseContainer._fitListener);
    setPassageContent(formatPassage({ ...oldPassage, reference: oldReference }));
    verseReference.textContent = oldReference;
    applySettings(activeSettings);
    if (wasVisible) showVerse();
    else scheduleFit();
  }

  function revealVerse() {
    verseContainer.classList.add('visible');
    body.classList.add('has-verse');
  }
  function showVerse() {
    fitTextToContainer();
    revealVerse();
  }
  function hideVerse() {
    verseContainer.classList.remove('visible');
    body.classList.remove('has-verse');
  }
  function loadPassage(command) {
    const passage = formatPassage(command);
    const update = () => {
      setPassageContent(passage);
      verseReference.textContent = passage.reference || '';
    };
    const size = measurePassage(passage);
    if (size !== null) root.style.setProperty('--verse-font-size', `${size}px`);
    update();
    if (command.show === false) {
      hideVerse();
      return;
    }
    revealVerse();
  }
  function processCommand(command) {
    if (!command) return;
    if (command.themeId && command.themeId !== selectedThemeId) renderTheme(command.themeId);
    if (command.settings) applySettings(command.settings);
    if (command.action === 'load') {
      loadPassage(command);
    }
    if (command.action === 'show') showVerse();
    if (command.action === 'hide') hideVerse();
  }
  function receiveCommand() {
    const raw = localStorage.getItem('bibleDisplayCommand');
    if (!raw) return;
    try { processCommand(JSON.parse(raw)); } catch (error) { console.error('Comando bíblico inválido:', error); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = JSON.parse(localStorage.getItem('bibleThemeSettings') || '{}');
    if (!preferredTheme && savedTheme.themeId && window.BibleThemeRegistry.has(savedTheme.themeId)) selectedThemeId = savedTheme.themeId;
    renderTheme(selectedThemeId);
    applySettings(savedTheme.settings || {});
    hideVerse();
    window.addEventListener('storage', event => { if (event.key === 'bibleDisplayCommand') receiveCommand(); });
    window.addEventListener('resize', scheduleFit);
    if (document.fonts?.ready) document.fonts.ready.then(scheduleFit);
    receiveCommand();
    window.addEventListener('beforeunload', () => { if (backgroundObjectUrl) URL.revokeObjectURL(backgroundObjectUrl); });
  });
}());
