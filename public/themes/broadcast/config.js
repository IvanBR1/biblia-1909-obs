window.BibleThemeRegistry.register({
    id: 'broadcast',
    name: 'Transmisión',
    description: 'Placa informativa azul, clara y muy legible.',
    preview: '/themes/broadcast/preview.html',
    fonts: window.BibleFontCatalog,
    defaults: { fontFamily: 'Inter, Arial, sans-serif', fontWeight: 700, fontSize: 44, textColor: '#ffffff', backgroundColor: '#101722', backgroundOpacity: 94, cardBackgroundColor: '#101722', cardBackgroundOpacity: 94, horizontalAlign: 'left', verticalAlign: 'bottom', autoFit: true, textAlign: 'left', lineHeight: 1.2, padding: 34, maxWidth: 1220, textEffect: 'shadow' },
    render: () => `<section class="verse-container broadcast-card" id="verse-container"><div class="verse-heading" id="verse-heading"></div><div class="verse-text" id="verse-text"></div><div class="verse-note" id="verse-note"></div><div class="verse-reference" id="verse-reference"></div></section>`
});
