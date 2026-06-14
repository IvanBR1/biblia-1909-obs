# Visualizador de Biblia para OBS

Visualizador local de versículos bíblicos para OBS, pensado para cultos, transmisiones en vivo, estudios bíblicos y presentaciones. El panel de control permite buscar un pasaje, previsualizarlo, ver el siguiente versículo y enviarlo a una fuente de navegador en OBS.

El proyecto usa la Biblia Reina Valera 1909 desde una API pública y se comunica entre el panel y el visualizador mediante `localStorage`.

## Características

- Panel de control local para seleccionar libro, capítulo y versículo.
- Buscador de libros siempre visible.
- Secciones desplegables para navegación, tema, vista previa e historial.
- Vista previa del versículo actual y del siguiente versículo.
- Navegación anterior/siguiente entre capítulos y libros.
- Historial de los últimos 10 versículos usados.
- Mostrar/Ocultar en tiempo real para OBS.
- Temas HTML independientes para usar como fuente de navegador.
- Tema con fondo de Biblia en pantalla completa y texto ajustable horizontal/verticalmente.

## Archivos principales

```text
biblia-obs-1909/
├── bible-display-theme1.html   # Tema clásico / visualizador base
├── bible-display-theme2.html   # Tema con imagen de fondo y texto tipo libro
├── control-panel.html          # Panel de control
├── control.js                  # Lógica del panel
├── style.css                   # Estilos del panel
├── src/img/biblia_bg_1.png     # Fondo usado por el tema 2
└── README.md
```

> Nota: `bible-display.html` ya no se usa. El código base del visualizador está en `bible-display-theme1.html`.

## Uso rápido

1. Abre `control-panel.html` en tu navegador.
2. En OBS, añade una fuente **Navegador**.
3. Usa uno de estos archivos como URL local:

```text
file:///D:/Documents/biblia-obs-1909/bible-display-theme1.html
file:///D:/Documents/biblia-obs-1909/bible-display-theme2.html
```

4. Configura la fuente en OBS con tamaño recomendado `1920x1080`.
5. Desde el panel, busca el libro, elige capítulo y versículo, y activa **Mostrar/Ocultar**.

## Panel de control

El buscador de libros queda siempre visible. Las demás áreas se pueden abrir o cerrar:

- **Navegación**: capítulo, versículo, botón anterior y botón siguiente.
- **Tema**: posición horizontal, posición vertical y fondo del tema.
- **Vista previa**: muestra el versículo actual y el siguiente.
- **Historial**: lista los últimos 10 versículos cargados.

## Tema 1

`bible-display-theme1.html` contiene el visualizador clásico. Mantiene el formato actual de:

- Texto del versículo.
- Cita bíblica.
- Libro/capítulo/versículo según lo entrega la API.

## Tema 2

`bible-display-theme2.html` usa la imagen `src/img/biblia_bg_1.png` como fondo de pantalla completa. El texto aparece centrado en la parte superior por defecto, con una transición suave para el fondo y el versículo.

Desde el panel puedes ajustar:

- Posición horizontal del texto.
- Posición vertical del texto.
- Activar o desactivar el fondo.

## API usada

El proyecto consulta:

```text
https://biblia-api.qhar.in/book/{bookId}/chapter/{chapterNumber}/verse/{verseNumber}
https://biblia-api.qhar.in/book/{bookId}/chapter/{chapterNumber}/verse
```

La API es externa al proyecto. Si no carga un versículo, revisa tu conexión a internet y la disponibilidad del servicio.

## Compatibilidad

- OBS Studio con fuente de navegador.
- Chrome, Edge o navegador basado en Chromium recomendado para el panel.
- Funciona como archivos locales; no requiere servidor web.

## Personalización

Para modificar el panel edita `style.css`.

Para cambiar el aspecto en OBS edita:

- `bible-display-theme1.html`
- `bible-display-theme2.html`

En el tema 2, las variables principales están al inicio del CSS:

```css
:root {
  --verse-x: 50%;
  --verse-y: 16%;
  --verse-width: min(86vw, 1180px);
}
```

## Problemas comunes

### No se muestra el versículo en OBS

- Confirma que el panel y el tema estén abiertos desde la misma carpeta local.
- Verifica que la fuente de navegador apunte a `bible-display-theme1.html` o `bible-display-theme2.html`.
- Revisa que JavaScript y `localStorage` estén habilitados.

### La vista previa no carga

- Verifica conexión a internet.
- Revisa si la API está respondiendo.

### El fondo del tema 2 no aparece

- Confirma que exista `src/img/biblia_bg_1.png`.
- Revisa que el interruptor **Fondo del tema** esté activado.

## Estado

Versión local: 1.1.0

Última actualización: junio de 2026
