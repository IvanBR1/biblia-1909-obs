(function () {
    const root = document.documentElement;
    const body = document.body;
    const params = new URLSearchParams(window.location.search);
    const preferredTheme = params.get('theme');
    let selectedThemeId = preferredTheme || localStorage.getItem('bibleSelectedTheme') || 'classic';
    let activeSettings = {};
    let verseContainer;
    let verseText;
    let verseReference;

    function getTheme() {
        return window.BibleThemeRegistry.get(selectedThemeId) || window.BibleThemeRegistry.get('classic');
    }

    function getDefaults() {
        return { ...window.BibleThemeDefaults, ...getTheme().defaults };
    }

    function normalizedSettings(settings) {
        return { ...getDefaults(), ...(settings || {}) };
    }

    function setEffect(effect) {
        const effects = {
            none: ['none', 'none'],
            shadow: ['0 4px 18px rgba(0, 0, 0, .82)', 'none'],
            outline: ['-1px -1px 0 rgba(0,0,0,.8), 1px -1px 0 rgba(0,0,0,.8), -1px 1px 0 rgba(0,0,0,.8), 1px 1px 0 rgba(0,0,0,.8), 0 4px 14px rgba(0,0,0,.7)', 'none'],
            contrast: ['0 3px 12px rgba(0, 0, 0, .95)', 'contrast(1.18)']
        };
        const current = effects[effect] || effects.shadow;
        root.style.setProperty('--verse-text-shadow', current[0]);
        root.style.setProperty('--verse-filter', current[1]);
    }

    function applySettings(settings) {
        activeSettings = normalizedSettings({ ...activeSettings, ...settings });
        const safe = window.BibleThemeUtilities;
        root.style.setProperty('--verse-x', `${safe.clamp(activeSettings.textX, 5, 95, 50)}%`);
        root.style.setProperty('--verse-y', `${safe.clamp(activeSettings.textY, 5, 85, 16)}%`);
        root.style.setProperty('--verse-font-family', activeSettings.fontFamily);
        root.style.setProperty('--verse-font-size', `${safe.clamp(activeSettings.fontSize, 18, 96, 52)}px`);
        root.style.setProperty('--verse-text-color', activeSettings.textColor);
        root.style.setProperty('--verse-container-bg', safe.hexToRgba(activeSettings.backgroundColor, safe.clamp(activeSettings.backgroundOpacity, 0, 100, 88) / 100));
        root.style.setProperty('--verse-text-align', activeSettings.textAlign);
        root.style.setProperty('--verse-line-height', safe.clamp(activeSettings.lineHeight, .8, 2.5, 1.2));
        root.style.setProperty('--verse-padding', `${safe.clamp(activeSettings.padding, 0, 120, 32)}px`);
        root.style.setProperty('--verse-max-width', `${safe.clamp(activeSettings.maxWidth, 320, 1800, 1120)}px`);
        body.classList.toggle('background-hidden', activeSettings.backgroundVisible === false);
        setEffect(activeSettings.textEffect);
        if (verseContainer) {
            verseContainer.style.maxHeight = '';
            if (verseReference) verseReference.style.fontSize = '';
            requestAnimationFrame(fitVerseToScreen);
        }
    }

    function fitVerseToScreen() {
        if (!verseContainer || !verseText) return;

        const preferredFontSize = window.BibleThemeUtilities.clamp(activeSettings.fontSize, 18, 96, 52);
        // Los pasajes excepcionalmente extensos conservan el texto completo antes que recortarse.
        const minimumFontSize = 12;
        const requestedY = window.BibleThemeUtilities.clamp(activeSettings.textY, 5, 85, 16);
        const safeLongTextY = 8;
        let fontSize = preferredFontSize;

        const setAvailableHeight = () => {
            const height = Math.max(110, window.innerHeight - verseContainer.offsetTop - 22);
            verseContainer.style.maxHeight = `${height}px`;
            return height;
        };

        root.style.setProperty('--verse-font-size', `${fontSize}px`);
        if (verseReference) verseReference.style.fontSize = `${Math.max(13, Math.round(fontSize * 0.45))}px`;

        let availableHeight = setAvailableHeight();

        // Para pasajes largos se prioriza la legibilidad: se aprovecha el alto libre antes de achicar el texto.
        if (verseContainer.scrollHeight > availableHeight && requestedY > safeLongTextY) {
            root.style.setProperty('--verse-y', `${safeLongTextY}%`);
            availableHeight = setAvailableHeight();
        }

        while (fontSize > minimumFontSize && verseContainer.scrollHeight > availableHeight) {
            fontSize -= 1;
            root.style.setProperty('--verse-font-size', `${fontSize}px`);
            if (verseReference) verseReference.style.fontSize = `${Math.max(12, Math.round(fontSize * 0.45))}px`;
        }
    }

    function renderTheme(themeId) {
        if (!window.BibleThemeRegistry.has(themeId)) return;
        const previousText = verseText ? verseText.textContent : '';
        const previousReference = verseReference ? verseReference.textContent : '';
        selectedThemeId = themeId;
        const theme = getTheme();
        body.dataset.theme = theme.id;
        document.getElementById('theme-root').innerHTML = theme.render();
        verseContainer = document.getElementById('verse-container');
        verseText = document.getElementById('verse-text');
        verseReference = document.getElementById('verse-reference');
        verseText.textContent = previousText;
        verseReference.textContent = previousReference;
        applySettings(activeSettings);
        if (previousText) showVerse();
    }

    function showVerse() {
        verseContainer.classList.add('visible');
        body.classList.add('has-verse');
        requestAnimationFrame(fitVerseToScreen);
    }

    function hideVerse() {
        verseContainer.classList.remove('visible');
        body.classList.remove('has-verse');
    }

    async function loadVerse(command) {
        if (command.content) {
            verseText.textContent = window.BibleThemeUtilities.sanitizeText(command.content);
            verseReference.textContent = command.reference || '';
            if (command.show !== false) showVerse();
            return;
        }
        try {
            const response = await fetch(`https://biblia-api.qhar.in/book/${command.book}/chapter/${command.chapter}/verse/${command.verse}`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const data = await response.json();
            verseText.textContent = window.BibleThemeUtilities.sanitizeText(data[0] && data[0].content);
            verseReference.textContent = (data[0] && data[0].reference) || '';
            if (command.show !== false) showVerse();
        } catch (error) {
            console.error('Error al cargar el versículo:', error);
        }
    }

    function processCommand(command) {
        if (!command) return;
        if (command.themeId && command.themeId !== selectedThemeId) renderTheme(command.themeId);
        if (command.settings) applySettings(command.settings);
        // Compatibilidad con los comandos planos de versiones anteriores.
        applySettings(command);
        if (command.action === 'load') loadVerse(command);
        if (command.action === 'show') showVerse();
        if (command.action === 'hide') hideVerse();
    }

    function receiveCommand() {
        const raw = localStorage.getItem('bibleVerseCommand');
        if (!raw) return;
        try { processCommand(JSON.parse(raw)); } catch (error) { console.error('Comando de Biblia inválido:', error); }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const savedTheme = JSON.parse(localStorage.getItem('bibleThemeSettings') || '{}');
        if (!preferredTheme && savedTheme.themeId && window.BibleThemeRegistry.has(savedTheme.themeId)) selectedThemeId = savedTheme.themeId;
        renderTheme(selectedThemeId);
        applySettings(savedTheme.settings || savedTheme);
        hideVerse();
        window.addEventListener('storage', event => {
            if (event.key === 'bibleVerseCommand') receiveCommand();
        });
        receiveCommand();
    });
    window.addEventListener('resize', () => {
        applySettings(activeSettings);
        requestAnimationFrame(fitVerseToScreen);
    });
}());
