# Visualizador de Biblia para OBS · v2.0.0

Panel local para buscar y presentar versículos de la Biblia Reina-Valera 1909 en una fuente de navegador de OBS. El panel y el visualizador se comunican por `localStorage`.

## Acceso a la aplicación

Puedes usar la aplicación de dos formas:

- **Publicada:** [https://bible-1909-obs.netlify.app/](https://bible-1909-obs.netlify.app/)
- **Local:** abre [index.html](D:\Documents\biblia-obs-1909\index.html) o [control-panel.html](D:\Documents\biblia-obs-1909\control-panel.html) directamente desde esta carpeta.

## Uso rápido

1. Abre `control-panel.html` en el navegador que usarás como control, o entra al sitio publicado y abre el panel.
2. En OBS agrega una fuente **Navegador** de 1920 × 1080.
3. Usa esta URL local como fuente:

   ```text
   file:///D:/Documents/biblia-obs-1909/bible-display.html
   ```

4. Elige libro, capítulo y versículo y activa **Mostrar en OBS**.
5. Abre el engrane para elegir un tema o personalizarlo.

## Panel de control

La pantalla principal se concentra en la selección del pasaje y el envío a OBS. La vista previa y el historial comienzan cerrados. El botón de engrane abre un panel lateral con:

- selector compacto de tema;
- posición horizontal y vertical;
- fuente, tamaño, color y alineación;
- color, transparencia y visibilidad de fondo;
- interlineado, márgenes internos y ancho máximo;
- sombra, contorno o contraste;
- restauración de valores predeterminados del tema seleccionado.

Todos los valores se guardan automáticamente y se aplican de la misma forma a cualquier tema.

## Temas incluidos

- **Clásico**: tarjeta de lectura sobria.
- **Libro moderno**: composición editorial sobre una imagen de Biblia.
- **Minimalista**: placa semitransparente, limpia y discreta.
- **Cinematográfico**: alto contraste, degradado y detalles dorados para proyección.

## Estructura

```text
biblia-obs-1909/
├── index.html                      # Información del proyecto y autor
├── bible-display.html              # Visualizador único para OBS
├── control-panel.html
├── control.js
├── style.css
├── themes/
│   ├── index.js                    # Registro central
│   ├── types.js                    # Esquema documental común
│   ├── shared/
│   │   ├── defaults.js
│   │   ├── utilities.js
│   │   ├── commonStyles.css
│   │   └── preview-runtime.js
│   ├── classic/
│   │   ├── config.js
│   │   ├── styles.css
│   │   ├── preview.html
│   │   └── assets/
│   ├── modern/
│   │   ├── config.js
│   │   ├── styles.css
│   │   ├── preview.html
│   │   └── assets/biblia_bg_1.png
│   ├── minimal/
│   │   ├── config.js
│   │   ├── styles.css
│   │   ├── preview.html
│   │   └── assets/
│   └── cinematic/
│       ├── config.js
│       ├── styles.css
│       ├── preview.html
│       └── assets/
└── README.md
```

## Agregar un tema nuevo

1. Duplica una carpeta de `themes/` con un nombre único, por ejemplo `themes/sereno/`.
2. En `config.js` registra el tema con `window.BibleThemeRegistry.register(...)`. Define `id`, `name`, `description`, `preview`, `fonts`, `defaults` y `render`.
3. Crea los estilos exclusivos en `styles.css`; utiliza las variables compartidas `--verse-x`, `--verse-y`, `--verse-font-size`, `--verse-text-color`, `--verse-container-bg`, `--verse-padding` y `--verse-max-width` para que los controles funcionen automáticamente.
4. Guarda imágenes, texturas u otros recursos en `assets/` y usa rutas relativas desde el CSS.
5. Agrega `sereno` a la lista de carga central de `themes/index.js`; esta registra tanto su configuración como su hoja de estilos.
6. Crea `preview.html` que redirija a `../../bible-display.html?theme=sereno`.

No hace falta modificar `control-panel.html`, `control.js` ni el motor del visualizador: el registro central incorpora automáticamente el tema al selector.

## API

El proyecto consulta:

```text
https://biblia-api.qhar.in/book/{bookId}/chapter/{chapterNumber}/verse/{verseNumber}
https://biblia-api.qhar.in/book/{bookId}/chapter/{chapterNumber}/verse
```

Si no carga un versículo, comprueba la conexión a internet y la disponibilidad de la API.
