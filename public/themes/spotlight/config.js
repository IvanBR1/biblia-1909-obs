window.BibleThemeRegistry.register({
    id: 'spotlight',
    name: 'Reflector',
    description: 'Composición escénica circular para mensajes centrales.',
    preview: '/themes/spotlight/preview.html',
    fonts: window.BibleFontCatalog,
    defaults: { fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 600, fontSize: 50, textColor: '#fff8e9', backgroundColor: '#090807', backgroundOpacity: 94, cardBackgroundColor: '#17120e', cardBackgroundOpacity: 94, horizontalAlign: 'center', verticalAlign: 'center', autoFit: true, textAlign: 'center', lineHeight: 1.12, padding: 48, maxWidth: 1260, textEffect: 'shadow' },
    render: () => `<section class="verse-container spotlight-card" id="verse-container"><div class="verse-heading" id="verse-heading"></div><div class="verse-text" id="verse-text"></div><div class="verse-note" id="verse-note"></div><div class="verse-reference" id="verse-reference"></div></section>`
});
