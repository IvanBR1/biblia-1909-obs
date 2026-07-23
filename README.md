# Visualizador de Biblia para OBS · v2.1.0

Monolito local para buscar y presentar versículos de la Biblia Reina-Valera 1909 en una fuente de navegador de OBS. Incluye la base bíblica, el panel, el visualizador y cuatro temas; no consulta una API externa.

## Requisitos y ejecución

- Node.js 22.5 o posterior.

```bash
npm run build
npm start
```

Abre:

- presentación y datos del desarrollador: `http://localhost:3000/`;
- panel de control: `http://localhost:3000/panel/`;
- fuente de navegador para OBS: `http://localhost:3000/visualizador/`.

En OBS se recomienda una fuente Navegador de 1920 × 1080.

## Funciones

- Selección directa por libro, capítulo y versículo.
- Navegación anterior/siguiente continua, incluso entre capítulos y libros.
- Búsqueda avanzada por palabras del texto bíblico, sin conocer la cita.
- Selección de cualquier resultado para cargar automáticamente su libro, capítulo y versículo.
- Vista previa del versículo actual y del siguiente.
- Mostrar u ocultar la salida en OBS.
- Temas Clásico, Libro moderno, Minimalista y Cinematográfico.
- Personalización de posición, autoajuste, tipografía, colores, fondo, márgenes y contraste.
- Persistencia local de la selección y los ajustes.

## Base local

El archivo fuente se conserva en `data/bible.db`. `npm run import` lo transforma de manera determinista en `data/bible.db.json`; `npm run build` publica una copia en `public/data/bible.db.json` para que el navegador pueda consultarla.

La navegación incluye 66 libros, 1,189 capítulos y 31,102 versículos. Las introducciones editoriales existentes en el SQLite no se presentan como capítulos.

## Estructura

```text
visualizador-biblia-obs/
├── data/
│   ├── bible.db
│   └── bible.db.json
├── public/
│   ├── index.html
│   ├── panel/index.html
│   ├── visualizador/index.html
│   ├── assets/
│   ├── data/bible.db.json
│   └── themes/
├── src/
│   ├── import-bible.js
│   ├── build-static.js
│   └── server.js
└── test/application.test.js
```

## Créditos y procedencia

Desarrollado por **Iván Bermúdez Regino**.

La base Reina-Valera 1909 fue importada del proyecto [`jh0rman/biblia-api`](https://github.com/jh0rman/biblia-api), declarado bajo licencia ISC. La traducción Reina-Valera 1909 es de dominio público; la descripción de procedencia se conserva también dentro del JSON generado.

Soli Deo Gloria.
