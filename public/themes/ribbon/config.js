window.BibleThemeRegistry.register({
    id: 'ribbon',
    name: 'Cinta',
    description: 'Banda cálida para lecturas y anuncios destacados.',
    preview: '/themes/ribbon/preview.html',
    fonts: window.BibleFontCatalog,
    defaults: { fontFamily: 'Archivo, Arial, sans-serif', fontWeight: 700, fontSize: 42, textColor: '#ffffff', backgroundColor: '#7e1831', backgroundOpacity: 96, cardBackgroundColor: '#a52041', cardBackgroundOpacity: 96, horizontalAlign: 'left', verticalAlign: 'bottom', autoFit: true, textAlign: 'left', lineHeight: 1.18, padding: 34, maxWidth: 1280, textEffect: 'shadow' },
    render: () => `<section class="verse-container ribbon-card" id="verse-container"><div class="verse-heading" id="verse-heading"></div><div class="verse-text" id="verse-text"></div><div class="verse-note" id="verse-note"></div><div class="verse-reference" id="verse-reference"></div></section>`
});
