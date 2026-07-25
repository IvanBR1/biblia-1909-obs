/* Esquema documental compartido para los temas del visualizador.
 * Cada tema registra: id, name, description, preview, defaults, fonts y render().
 */
window.BibleThemeSchema = {
    settings: [
        'horizontalAlign', 'verticalAlign', 'autoFit', 'fontFamily', 'fontWeight', 'fontSize', 'textColor',
        'backgroundColor', 'backgroundOpacity', 'cardBackgroundColor', 'cardBackgroundOpacity', 'backgroundVisible',
        'backgroundType', 'backgroundFit', 'backgroundPosition', 'backgroundOverlayOpacity', 'imageFileName', 'imageAssetVersion', 'imageAnimation',
        'textAlign', 'lineHeight', 'letterSpacing', 'padding', 'maxWidth', 'textEffect', 'transition', 'transitionDuration'
    ]
};
