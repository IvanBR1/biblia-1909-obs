# Visualizador de la Biblia para OBS

## 📖 Descripción
Un visualizador elegante y funcional de versículos bíblicos diseñado específicamente para su uso en **OBS (Open Broadcaster Software)**. Ideal para transmisiones en vivo, cultos en línea o estudios bíblicos.

Permite mostrar versículos de la **Biblia Reina Valera 1909** con un diseño profesional y controles en tiempo real.

---

## ✨ Características Principales

- **Interfaz dual**: Panel de control + visualizador para OBS
- **Conexión en tiempo real**: Comunicación vía `localStorage` entre paneles
- **Navegación completa**: Libros, capítulos y versículos
- **Historial inteligente**: Guarda los últimos 10 versículos consultados
- **Búsqueda de libros**: Filtro en tiempo real
- **Persistencia de estado**: Recuerda la última configuración
- **Diseño responsive**: Adaptable a distintas resoluciones
- **Animaciones suaves**: Transiciones elegantes al mostrar u ocultar

---

## 📁 Estructura de Archivos

```text
📂 visualizador-biblia-obs/
├── 📄 bible-display.html      # Visualizador principal (para OBS)
├── 📄 control-panel.html      # Panel de control
├── 📄 control.js              # Lógica del panel de control
├── 📄 style.css               # Estilos del panel de control
└── 📄 README.md               # Documentación
```

---

## 🔧 Dependencias Externas

- **Biblia API (Reina Valera 1909)**  
  https://biblia-api.qhar.in/

- **Google Fonts**  
  Merriweather · Open Sans

- **Font Awesome**  
  Versión 6.4.0 (iconos)

- **OBS Studio**  
  Versión 28.0 o superior (recomendado)

---

## 🚀 Instalación Rápida

### 1. Descargar los archivos

```bash
git clone https://github.com/tu-usuario/visualizador-biblia-obs.git
```

O descarga manualmente los archivos principales.

### 2. Abrir el Panel de Control

- Abre `control-panel.html` en tu navegador
- No requiere servidor web
- Funciona completamente de forma local

### 3. Configurar en OBS

- Añade una fuente **Navegador (Browser Source)**
- Usa la ruta local del archivo `bible-display.html`
- Tamaño recomendado: **1920x1080**

---

## ⚙️ Configuración en OBS

### Paso 1: Añadir el Visualizador

1. En OBS, haz clic en **+** (Fuentes)
2. Selecciona **Navegador**
3. Nombre: `Biblia Visualizador`

**Configuración recomendada:**

- URL:  
  `file:///C:/Users/TuUsuario/visualizador-biblia-obs/bible-display.html`
- Ancho: `1920`
- Alto: `1080`
- FPS: `30–60`

### Paso 2: Añadir el Panel de Control (Opcional)

- Añade otra fuente **Navegador**
- Usa la ruta a `control-panel.html`
- Tamaño sugerido: `500x700`
- Ubícalo donde sea más cómodo

---

## 🎮 Uso del Sistema

### Interfaz del Panel de Control

```text
┌─────────────────────────────┐
│ 🎛️ CONTROLES                │
│ • Libro: [Búsqueda] ▼       │
│ • Capítulo: [1]             │
│ • Versículo: [1]            │
│ • ◄ | ►                     │
│ • Mostrar/Ocultar [ ]       │
├─────────────────────────────┤
│ 👁️ VISTA PREVIA             │
│ [Versículo actual]          │
├─────────────────────────────┤
│ 📜 HISTORIAL (últimos 10)   │
│ • Génesis 1:1               │
│ • Juan 3:16                 │
└─────────────────────────────┘
```

### Funcionalidades

#### 📌 Seleccionar Versículo
- Busca el libro escribiendo su nombre
- Navega con flechas o introduce valores manualmente

#### 👁️ Mostrar / Ocultar
- Interruptor para controlar visibilidad en OBS
- Animaciones suaves de entrada y salida

#### 🔀 Navegación
- Versículo anterior / siguiente
- Navegación automática entre capítulos y libros

#### 📜 Historial
- Hasta 10 versículos
- Haz clic para recargar cualquiera

---

## 🔌 API y Dependencia Externa

Este proyecto depende de una API mantenida por **jh0rman**.

- Repositorio: `github.com/jh0rman/biblia-api`
- Versión: **Reina Valera 1909**
- Estado: Activo
- Última actualización conocida: **Enero 2026**

### Endpoints Utilizados

```javascript
// Obtener versículo específico
GET https://biblia-api.qhar.in/book/{bookId}/chapter/{chapterNumber}/verse/{verseNumber}

// Obtener todos los versículos de un capítulo
GET https://biblia-api.qhar.in/book/{bookId}/chapter/{chapterNumber}/verse
```

### ⚠️ Nota Importante

La API es mantenida por un tercero. Si hay problemas:

- Verifica el estado del repositorio
- Los endpoints podrían cambiar
- Considera implementar caché local para producción

---

## 🎨 Personalización

### Colores (Variables CSS)

```css
:root {
  --primary-color: #2c3e50;
  --secondary-color: #3498db;
  --accent-color: #e74c3c;
  --light-color: #ecf0f1;
  --dark-color: #2c3e50;
}
```

Archivos a editar:
- `bible-display.html`
- `style.css`

### Tamaños de Fuente

```css
.verse-body {
  font-size: 1.8rem;
}

.verse-reference {
  font-size: 1.4rem;
}
```

---

## 🐛 Problemas Conocidos y Soluciones

### ❌ El versículo no se muestra en OBS

- Verifica que ambos HTML estén en la misma carpeta
- Confirma permisos de archivos locales en OBS
- Revisa la consola del navegador (F12)

### ❌ La API no responde

- Verifica conexión a internet
- Revisa el repositorio de la API
- Implementa manejo de errores y timeout

### ❌ Los controles no funcionan

- Abre `control-panel.html` en el mismo navegador
- Verifica que JavaScript esté habilitado
- Revisa bloqueadores de `localStorage`

---

## 📱 Compatibilidad

- **Navegadores**: Chrome 90+, Firefox 88+, Edge 90+
- **OBS**: 28.0+
- **Sistemas Operativos**:
  - Windows 10+
  - macOS 10.15+
  - Linux (con OBS)

---

## 🔄 Actualizaciones Futuras

- Soporte para múltiples traducciones
- Temas y colores configurables desde el panel
- Favoritos / marcadores

---

## 🤝 Contribución

1. Haz fork del repositorio
2. Crea una rama
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit de cambios
   ```bash
   git commit -m "Add some AmazingFeature"
   ```
4. Push a la rama
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto se distribuye bajo la **Licencia MIT**.  
Consulta el archivo `LICENSE` para más información.

---

## ⚠️ Aviso Legal

Este software utiliza la Biblia **Reina Valera 1909**, texto de dominio público, obtenida mediante una API pública.

Este proyecto **no está afiliado oficialmente** con los mantenedores de la API.

---

## 🆘 Soporte

- Revisa la sección de problemas conocidos
- Consulta cambios en la API
- Abre un issue en el repositorio del proyecto

> **Nota:** Para entornos de producción crítica, se recomienda implementar un sistema de caché o respaldo local.

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2026

