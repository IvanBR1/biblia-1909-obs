window.BibleThemeRegistry.register({
    id: 'glass',
    name: 'Cristal',
    description: 'Tarjeta translúcida con iluminación suave.',
    preview: '/themes/glass/preview.html',
    fonts: window.BibleFontCatalog,
    defaults: { fontFamily: 'Inter, Arial, sans-serif', fontWeight: 600, fontSize: 44, textColor: '#ffffff', backgroundColor: '#102131', backgroundOpacity: 48, cardBackgroundColor: '#18314d', cardBackgroundOpacity: 54, horizontalAlign: 'center', verticalAlign: 'center', autoFit: true, textAlign: 'center', lineHeight: 1.22, padding: 42, maxWidth: 1180, textEffect: 'shadow' },
    render: () => `<section class="verse-container glass-card" id="verse-container"><div class="verse-heading" id="verse-heading"></div><div class="verse-text" id="verse-text"></div><div class="verse-note" id="verse-note"></div><div class="verse-reference" id="verse-reference"></div></section>`
});
