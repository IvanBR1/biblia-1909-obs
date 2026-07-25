window.BibleThemeRegistry.register({
    id: 'neon',
    name: 'Neón',
    description: 'Marco luminoso de alto impacto para pantallas.',
    preview: '/themes/neon/preview.html',
    fonts: window.BibleFontCatalog,
    defaults: { fontFamily: 'Space Grotesk, Arial, sans-serif', fontWeight: 700, fontSize: 43, textColor: '#f2fdff', backgroundColor: '#06101e', backgroundOpacity: 94, cardBackgroundColor: '#06101e', cardBackgroundOpacity: 94, horizontalAlign: 'center', verticalAlign: 'center', autoFit: true, textAlign: 'center', lineHeight: 1.16, padding: 38, maxWidth: 1200, textEffect: 'shadow' },
    render: () => `<section class="verse-container neon-card" id="verse-container"><div class="verse-heading" id="verse-heading"></div><div class="verse-text" id="verse-text"></div><div class="verse-note" id="verse-note"></div><div class="verse-reference" id="verse-reference"></div></section>`
});
