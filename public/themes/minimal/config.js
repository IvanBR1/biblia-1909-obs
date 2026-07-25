window.BibleThemeRegistry.register({
    id: 'minimal',
    name: 'Minimalista',
    description: 'Texto limpio sobre una placa discreta y semitransparente.',
    preview: '/themes/minimal/preview.html',
    fonts: window.BibleFontCatalog,
    defaults: { fontFamily: 'Open Sans, Arial, sans-serif', fontSize: 40, textColor: '#ffffff', backgroundColor: '#0d1117', backgroundOpacity: 58, cardBackgroundColor: '#0d1117', cardBackgroundOpacity: 58, horizontalAlign: 'center', verticalAlign: 'center', autoFit: true, textAlign: 'center', lineHeight: 1.3, padding: 22, maxWidth: 1240, textEffect: 'none' },
    render: () => `<section class="verse-container minimal-card" id="verse-container"><div class="verse-heading" id="verse-heading"></div><div class="verse-text" id="verse-text"></div><div class="verse-note" id="verse-note"></div><div class="verse-reference" id="verse-reference"></div></section>`
});
