async function waitForThemes() {
  if (window.BibleThemeRegistry && window.BibleThemeDefaults) return;
  await new Promise((resolve) =>
    window.addEventListener("BibleThemesReady", resolve, { once: true }),
  );
}
const DATABASE_URL = "/data/bible.db.json";
const ASSET_DB = "bibleObsAssets";
const $ = (id) => document.getElementById(id);

// 1. Objetos vacíos: se llenan dentro de DOMContentLoaded cuando el DOM ya existe
const elements = {};
const controls = {};

let database;
let books = [];
let bookById = new Map();
let searchableVerses = [];
let currentBook;
let currentChapter;
let currentVerse;
let bookResults = [];
let textResults = [];
let isVisible = false;
let selectedThemeId = "modern";
let themeSettings = { ...(window.BibleThemeDefaults || {}) };
let searchTimer;
let databaseLoadPromise;
let uiReady = false;
const backgroundAnchors = [
  ["left top", "↖"],
  ["center top", "↑"],
  ["right top", "↗"],
  ["left center", "←"],
  ["center center", "•"],
  ["right center", "→"],
  ["left bottom", "↙"],
  ["center bottom", "↓"],
  ["right bottom", "↘"],
];

function escapeHtml(value) {
  return String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );
}

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLocaleLowerCase("es-MX");
}

function setClearButton(input, button) {
  button.hidden = !input.value;
}

function setDatabaseStatus(state, message) {
  const status =
    elements.databaseStatus || document.getElementById("database-status");

  if (!status) return;

  status.className = `database-status ${state}`;

  const text = status.querySelector("span:last-child");
  if (text) {
    text.textContent = message;
  }
}

function setAppReady() {
  if (uiReady) return;
  uiReady = true;
  document.body.classList.remove("loading");
}

function currentPassage() {
  const book = bookById.get(currentBook);
  const chapter = book?.chapters.find((item) => item.number === currentChapter);
  const verse = chapter?.verses.find((item) => item.number === currentVerse);
  return { book, chapter, verse };
}

function adjacentPassage(direction) {
  const { book, chapter } = currentPassage();
  if (!book || !chapter) return null;
  const verseIndex = chapter.verses.findIndex(
    (item) => item.number === currentVerse,
  );
  const nextVerse = chapter.verses[verseIndex + direction];
  if (nextVerse) return { book, chapter, verse: nextVerse };

  const chapterIndex = book.chapters.findIndex(
    (item) => item.number === currentChapter,
  );
  const nextChapter = book.chapters[chapterIndex + direction];
  if (nextChapter) {
    const verse =
      direction > 0 ? nextChapter.verses[0] : nextChapter.verses.at(-1);
    return verse ? { book, chapter: nextChapter, verse } : null;
  }

  const bookIndex = books.findIndex((item) => item.id === currentBook);
  const nextBook = books[bookIndex + direction];
  if (!nextBook) return null;
  const edgeChapter =
    direction > 0 ? nextBook.chapters[0] : nextBook.chapters.at(-1);
  const edgeVerse =
    direction > 0 ? edgeChapter?.verses[0] : edgeChapter?.verses.at(-1);
  return edgeVerse
    ? { book: nextBook, chapter: edgeChapter, verse: edgeVerse }
    : null;
}

function saveState() {
  localStorage.setItem(
    "bibleControlState",
    JSON.stringify({
      book: currentBook,
      chapter: currentChapter,
      verse: currentVerse,
      visible: isVisible,
      themeId: selectedThemeId,
      themeSettings,
    }),
  );
}

function sendCommand(command) {
  localStorage.setItem(
    "bibleDisplayCommand",
    JSON.stringify({ ...command, sentAt: Date.now() }),
  );
}

function sendThemeSettings() {
  localStorage.setItem("bibleSelectedTheme", selectedThemeId);
  localStorage.setItem(
    "bibleThemeSettings",
    JSON.stringify({ themeId: selectedThemeId, settings: themeSettings }),
  );
  sendCommand({
    action: "theme-settings",
    themeId: selectedThemeId,
    settings: themeSettings,
  });
}

function sendCurrentVerse() {
  const { verse } = currentPassage();
  if (!verse) return;
  sendCommand({
    action: "load",
    content: verse.content,
    heading: verse.heading,
    note: verse.note,
    reference: `${verse.reference} · ${database.translation.abbreviation}`,
    show: isVisible,
    themeId: selectedThemeId,
    settings: themeSettings,
  });
}

function renderPreviewPassage(container, verse, fallback) {
  if (!container) return;
  const text = container.querySelector(".verse-text");
  if (!text) return;

  text.replaceChildren();
  if (!verse) {
    container.classList.remove("has-psalm-superscription");
    text.textContent = fallback;
    return;
  }
  const marker =
    /^Salmos\s+\d+:/u.test(verse.reference || "") &&
    String(verse.content || "").match(/^(.{1,420}?)\s*\[\d+\]\s+([\s\S]+)$/u);
  const heading = verse.heading;
  const content = marker ? marker[2].trim() : verse.content;
  container.classList.toggle("has-psalm-superscription", Boolean(marker));
  for (const [className, sectionContent] of [
    ["verse-heading", heading],
    ["psalm-superscription", marker?.[1]?.trim()],
    ["verse-body", content],
    ["verse-note", verse.note],
  ]) {
    if (!sectionContent) continue;
    const section = document.createElement("div");
    section.className = className;
    section.textContent = sectionContent;
    text.append(section);
  }
}

function updatePreview() {
  // GUARD: si los contenedores del preview no están listos, no pintamos
  if (!elements.previewCurrent || !elements.previewNext) return;

  const { book, chapter, verse } = currentPassage();
  const following = adjacentPassage(1);
  renderPreviewPassage(
    elements.previewCurrent,
    verse,
    "Selecciona un versículo",
  );
  const currentRef = elements.previewCurrent.querySelector(".verse-ref");
  if (currentRef) {
    currentRef.textContent = verse ? `Actual: ${verse.reference}` : "Actual";
  }
  renderPreviewPassage(
    elements.previewNext,
    following?.verse,
    "Fin de la Biblia",
  );
  const nextRef = elements.previewNext.querySelector(".verse-ref");
  if (nextRef) {
    nextRef.textContent = following
      ? `Siguiente: ${following.verse.reference}`
      : "Siguiente";
  }

  if (elements.reference) {
    elements.reference.textContent = verse?.reference || "—";
  }
  if (elements.bookMeta) {
    elements.bookMeta.textContent =
      book && chapter
        ? `${book.nameLong} · ${chapter.verses.length} versículos en el capítulo · ${database.translation.name}`
        : "Selecciona un libro, capítulo y versículo";
  }
  if (elements.counter) {
    elements.counter.textContent =
      chapter && verse ? `${verse.number} / ${chapter.verses.length}` : "— / —";
  }
  if (elements.previous) {
    elements.previous.disabled = !adjacentPassage(-1);
  }
  if (elements.next) {
    elements.next.disabled = !following;
  }
}

function populateChapters(preferredChapter = 1) {
  const book = bookById.get(currentBook);
  elements.chapter.innerHTML = (book?.chapters || [])
    .map(
      (chapter) =>
        `<option value="${chapter.number}">${chapter.number}</option>`,
    )
    .join("");
  const available = book?.chapters.some(
    (chapter) => chapter.number === Number(preferredChapter),
  );
  currentChapter = available
    ? Number(preferredChapter)
    : book?.chapters[0]?.number || 1;
  elements.chapter.value = String(currentChapter);
}

function populateVerses(preferredVerse = 1) {
  const { chapter } = currentPassage();
  elements.verse.innerHTML = (chapter?.verses || [])
    .map((verse) => `<option value="${verse.number}">${verse.number}</option>`)
    .join("");
  const available = chapter?.verses.some(
    (verse) => verse.number === Number(preferredVerse),
  );
  currentVerse = available
    ? Number(preferredVerse)
    : chapter?.verses[0]?.number || 1;
  elements.verse.value = String(currentVerse);
}

function selectPassage(
  bookId,
  chapterNumber = 1,
  verseNumber = 1,
  options = {},
) {
  const book = bookById.get(bookId);
  if (!book) return;
  currentBook = book.id;
  elements.bookSearch.value = book.name;
  setClearButton(elements.bookSearch, elements.bookSearchClear);
  elements.bookDropdown.classList.remove("visible");
  populateChapters(chapterNumber);
  populateVerses(verseNumber);
  updatePreview();
  if (isVisible) sendCurrentVerse();
  if (options.closeTextSearch)
    elements.textDropdown.classList.remove("visible");
  saveState();
}

function navigate(direction) {
  const passage = adjacentPassage(direction);
  if (passage)
    selectPassage(
      passage.book.id,
      passage.chapter.number,
      passage.verse.number,
    );
}

function renderBookResults(items) {
  bookResults = items;
  elements.bookDropdown.innerHTML = items.length
    ? items
        .map(
          (book, index) => `
      <div class="search-dropdown-item${index === 0 ? " active" : ""}" data-index="${index}">
        <div class="hymn-result"><strong>${escapeHtml(book.name)}</strong><small>${escapeHtml(book.id)} · ${book.chapterCount} capítulos</small></div>
      </div>`,
        )
        .join("")
    : '<div class="no-results">No se encontraron libros</div>';
  elements.bookDropdown
    .querySelectorAll(".search-dropdown-item")
    .forEach((node) => {
      node.addEventListener("click", () =>
        selectPassage(bookResults[Number(node.dataset.index)].id),
      );
    });
  elements.bookDropdown.classList.add("visible");
}

function searchBooks(query = "") {
  const term = normalizeSearch(query);
  renderBookResults(
    books.filter(
      (book) =>
        !term ||
        normalizeSearch(
          `${book.name} ${book.nameLong} ${book.id} ${book.abbreviation}`,
        ).includes(term),
    ),
  );
}

function renderTextResults(items, query) {
  textResults = items;
  if (normalizeSearch(query).length < 3) {
    elements.textDropdown.innerHTML =
      '<div class="no-results">Escribe al menos 3 caracteres para buscar</div>';
  } else if (!items.length) {
    elements.textDropdown.innerHTML =
      '<div class="no-results">No se encontraron versículos con ese texto</div>';
  } else {
    elements.textDropdown.innerHTML = items
      .map(
        (item, index) => `
      <div class="search-dropdown-item verse-result-item${index === 0 ? " active" : ""}" data-index="${index}">
        <div class="verse-result"><strong>${escapeHtml(item.reference)}</strong><small>${escapeHtml(item.content)}</small></div>
      </div>`,
      )
      .join("");
    elements.textDropdown
      .querySelectorAll(".search-dropdown-item")
      .forEach((node) => {
        node.addEventListener("click", () => {
          const result = textResults[Number(node.dataset.index)];
          selectPassage(result.bookId, result.chapter, result.verse, {
            closeTextSearch: true,
          });
        });
      });
  }
  elements.textDropdown.classList.add("visible");
}

function searchBible(query = "") {
  const normalized = normalizeSearch(query);
  if (normalized.length < 3) return renderTextResults([], query);
  const terms = [...new Set(normalized.split(/\s+/u))];
  const results = [];
  for (const verse of searchableVerses) {
    const positions = terms.map((term) =>
      verse.searchWords.findIndex(
        (word) => word === term || word.startsWith(term),
      ),
    );
    if (positions.every((position) => position >= 0))
      results.push({
        ...verse,
        score: positions.reduce((total, position) => total + position, 0),
      });
  }
  results.sort(
    (a, b) => a.score - b.score || a.reference.localeCompare(b.reference, "es"),
  );
  renderTextResults(results.slice(0, 50), query);
}

async function loadDatabase() {
  const response = await fetch(DATABASE_URL);

  if (!response.ok) {
    throw new Error(`No se pudo leer la base local (${response.status})`);
  }

  database = await response.json();

  if (database.schemaVersion !== 1 || !Array.isArray(database.books)) {
    throw new Error("La base local no tiene un formato compatible");
  }

  books = database.books;

  bookById = new Map(books.map((book) => [book.id, book]));

  searchableVerses = books.flatMap((book) =>
    book.chapters.flatMap((chapter) =>
      chapter.verses.map((verse) => ({
        bookId: book.id,
        chapter: chapter.number,
        verse: verse.number,
        reference: verse.reference,
        content: verse.content,
        searchWords: normalizeSearch(
          `${verse.reference} ${verse.content}`,
        ).split(/\s+/u),
      })),
    ),
  );

  setDatabaseStatus(
    "connected",
    `${database.stats.verses.toLocaleString("es-MX")} versículos en la base local`,
  );
}

databaseLoadPromise = loadDatabase().catch((error) => {
  console.error(error);

  setDatabaseStatus("error", "No se pudo cargar la base local");

  throw error;
});

async function initializeDatabase(saved) {
  try {
    await databaseLoadPromise;

    selectPassage(saved.book || "GEN", saved.chapter || 1, saved.verse || 1);
  } catch {
    const preview =
      elements.previewCurrent || document.getElementById("preview-current");

    preview
      ?.querySelector(".verse-text")
      ?.replaceChildren(
        document.createTextNode("No se pudo cargar la Biblia local"),
      );
  }
  setAppReady();
}

function getThemeDefaults() {
  const theme = window.BibleThemeRegistry.get(selectedThemeId);
  return { ...window.BibleThemeDefaults, ...(theme ? theme.defaults : {}) };
}

function updateSettingOutputs() {
  const units = {
    "font-size": " px",
    "line-height": "",
    "letter-spacing": " px",
    "background-opacity": "%",
    "background-overlay-opacity": "%",
    padding: " px",
    "max-width": " px",
    "transition-duration": " ms",
  };
  Object.entries(units).forEach(([id, unit]) => {
    $(`${id}-value`).textContent = `${$(id).value}${unit}`;
  });
}

function updateBackgroundUI() {
  const isImage = themeSettings.backgroundType === "image";
  const hasBackgroundImage = Boolean(themeSettings.imageFileName);
  $("background-media-fields").hidden = !isImage;
  $("background-color-fields").hidden = isImage;
  $("background-file-button").classList.toggle("has-file", hasBackgroundImage);
  $("background-file-name").textContent =
    themeSettings.imageFileName || "Sin imagen";
  $("anchor-button").hidden =
    !isImage || themeSettings.backgroundFit !== "cover";
  if (!isImage || themeSettings.backgroundFit !== "cover") toggleAnchor(false);
  document.querySelectorAll(".anchor-grid button").forEach((button) => {
    button.classList.toggle(
      "selected",
      button.dataset.position === themeSettings.backgroundPosition,
    );
  });
}

function toggleAnchor(open) {
  $("anchor-popover").hidden = !open;
  $("anchor-button").setAttribute("aria-expanded", String(open));
}

function openAssetDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ASSET_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("assets");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveBackgroundImage(file) {
  const database = await openAssetDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction("assets", "readwrite");
    transaction.objectStore("assets").put(file, "background-image");
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  themeSettings = {
    ...themeSettings,
    backgroundType: "image",
    imageFileName: file.name,
    imageAssetVersion: Date.now(),
  };
  syncThemeSettingsUI();
  sendThemeSettings();
  if (isVisible) sendCurrentVerse();
  saveState();
}

async function clearBackgroundImage() {
  const database = await openAssetDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction("assets", "readwrite");
    transaction.objectStore("assets").delete("background-image");
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  themeSettings = {
    ...themeSettings,
    imageFileName: "",
    imageAssetVersion: Date.now(),
  };
  syncThemeSettingsUI();
  sendThemeSettings();
  if (isVisible) sendCurrentVerse();
  saveState();
}

function syncThemeSettingsUI() {
  const values = {
    horizontalAlign: themeSettings.horizontalAlign,
    verticalAlign: themeSettings.verticalAlign,
    fontWeight: themeSettings.fontWeight,
    fontSize: themeSettings.fontSize,
    textColor: themeSettings.textColor,
    textAlign: themeSettings.textAlign,
    lineHeight: themeSettings.lineHeight,
    letterSpacing: themeSettings.letterSpacing,
    backgroundColor: themeSettings.backgroundColor,
    backgroundOpacity: themeSettings.backgroundOpacity,
    padding: themeSettings.padding,
    maxWidth: themeSettings.maxWidth,
    textEffect: themeSettings.textEffect,
    transition: themeSettings.transition,
    transitionDuration: themeSettings.transitionDuration,
    backgroundType: themeSettings.backgroundType,
    backgroundFit: themeSettings.backgroundFit,
    backgroundPosition: themeSettings.backgroundPosition,
    backgroundOverlayOpacity: themeSettings.backgroundOverlayOpacity,
  };
  Object.entries(values).forEach(([key, value]) => {
    controls[key].value = value;
  });
  controls.backgroundVisible.checked =
    themeSettings.backgroundVisible !== false;
  controls.autoFit.checked = themeSettings.autoFit !== false;
  controls.fontSize.disabled = controls.autoFit.checked;
  controls.fontSize
    .closest(".settings-grid")
    ?.classList.toggle("auto-fit-active", controls.autoFit.checked);
  const theme = window.BibleThemeRegistry.get(selectedThemeId);
  controls.fontFamily.innerHTML = "";
  (window.BibleFontCatalog || theme.fonts || []).forEach((font) =>
    controls.fontFamily.add(
      new Option(font.split(",")[0].replaceAll("'", ""), font),
    ),
  );
  if (
    ![...controls.fontFamily.options].some(
      (option) => option.value === themeSettings.fontFamily,
    )
  )
    controls.fontFamily.add(
      new Option(
        themeSettings.fontFamily.split(",")[0],
        themeSettings.fontFamily,
      ),
    );
  controls.fontFamily.value = themeSettings.fontFamily;
  updateSettingOutputs();
  controls.imageAnimation.checked = Boolean(themeSettings.imageAnimation);
  updateBackgroundUI();
}

function renderThemeCards() {
  elements.themeList.innerHTML = window.BibleThemeRegistry.all()
    .map(
      (theme) => `
    <button type="button" class="theme-card${theme.id === selectedThemeId ? " selected" : ""}" data-theme="${theme.id}" role="radio" aria-checked="${theme.id === selectedThemeId}">
      <span class="theme-swatch theme-swatch-${theme.id}"></span><span><strong>${theme.name}</strong></span>
    </button>`,
    )
    .join("");
  elements.themeList.querySelectorAll(".theme-card").forEach((card) =>
    card.addEventListener("click", () => {
      const sharedBackground = Object.fromEntries(
        [
          "backgroundType",
          "backgroundFit",
          "backgroundPosition",
          "backgroundOverlayOpacity",
          "imageAnimation",
          "imageFileName",
          "imageAssetVersion",
        ].map((key) => [key, themeSettings[key]]),
      );
      selectedThemeId = card.dataset.theme;
      themeSettings = { ...getThemeDefaults(), ...sharedBackground };
      renderThemeCards();
      syncThemeSettingsUI();
      sendThemeSettings();
      if (isVisible) sendCurrentVerse();
      saveState();
    }),
  );
}

function updateThemeSettings() {
  themeSettings = {
    horizontalAlign: controls.horizontalAlign.value,
    verticalAlign: controls.verticalAlign.value,
    autoFit: controls.autoFit.checked,
    fontFamily: controls.fontFamily.value,
    fontWeight: Number(controls.fontWeight.value),
    fontSize: Number(controls.fontSize.value),
    textColor: controls.textColor.value,
    textAlign: controls.textAlign.value,
    lineHeight: Number(controls.lineHeight.value),
    letterSpacing: Number(controls.letterSpacing.value),
    backgroundColor: controls.backgroundColor.value,
    backgroundOpacity: Number(controls.backgroundOpacity.value),
    backgroundVisible: controls.backgroundVisible.checked,
    padding: Number(controls.padding.value),
    maxWidth: Number(controls.maxWidth.value),
    textEffect: controls.textEffect.value,
    transition: controls.transition.value,
    transitionDuration: Number(controls.transitionDuration.value),
    backgroundType: controls.backgroundType.value,
    backgroundFit: controls.backgroundFit.value,
    backgroundPosition: controls.backgroundPosition.value,
    backgroundOverlayOpacity: Number(controls.backgroundOverlayOpacity.value),
    imageAnimation: controls.imageAnimation.checked,
    imageFileName: themeSettings.imageFileName,
    imageAssetVersion: themeSettings.imageAssetVersion,
  };
  controls.fontSize.disabled = controls.autoFit.checked;
  controls.fontSize
    .closest(".settings-grid")
    ?.classList.toggle("auto-fit-active", controls.autoFit.checked);
  updateSettingOutputs();
  updateBackgroundUI();
  sendThemeSettings();
  if (isVisible) sendCurrentVerse();
  saveState();
}

function toggleSettings(open) {
  elements.settingsDrawer.classList.toggle("open", open);
  elements.settingsDrawer.setAttribute("aria-hidden", String(!open));
  elements.settingsButton.setAttribute("aria-expanded", String(open));
  elements.settingsScrim.hidden = !open;
}

document.addEventListener("DOMContentLoaded", async () => {
  document.body.classList.add("loading");
  try {
    await waitForThemes();
    // 2. Inicializar elementos AQUÍ, cuando el DOM ya está garantizado
    Object.assign(elements, {
      bookSearch: $("book-search"),
      bookSearchClear: $("book-search-clear"),
      bookDropdown: $("book-dropdown"),
      chapter: $("chapter-select"),
      verse: $("verse-select"),
      textSearch: $("text-search"),
      textSearchClear: $("text-search-clear"),
      textDropdown: $("text-dropdown"),
      previous: $("prev-verse"),
      next: $("next-verse"),
      visibility: $("visibility-toggle"),
      counter: $("verse-counter"),
      reference: $("selected-reference"),
      bookMeta: $("selected-book-meta"),
      previewCurrent: $("preview-current"),
      previewNext: $("preview-next"),
      databaseStatus: $("database-status"),
      themeList: $("theme-list"),
      settingsButton: $("settings-button"),
      settingsDrawer: $("settings-drawer"),
      settingsClose: $("settings-close"),
      settingsScrim: $("settings-scrim"),
      reset: $("reset-theme-settings"),
    });

    Object.assign(controls, {
      horizontalAlign: $("horizontal-align"),
      verticalAlign: $("vertical-align"),
      autoFit: $("auto-fit-toggle"),
      fontFamily: $("font-family"),
      fontWeight: $("font-weight"),
      fontSize: $("font-size"),
      textColor: $("text-color"),
      textAlign: $("text-align"),
      lineHeight: $("line-height"),
      letterSpacing: $("letter-spacing"),
      backgroundColor: $("background-color"),
      backgroundOpacity: $("background-opacity"),
      backgroundType: $("background-type"),
      backgroundFit: $("background-fit"),
      backgroundPosition: $("background-position"),
      backgroundOverlayOpacity: $("background-overlay-opacity"),
      imageAnimation: $("image-animation"),
      backgroundVisible: $("background-toggle"),
      padding: $("padding"),
      maxWidth: $("max-width"),
      textEffect: $("text-effect"),
      transition: $("transition"),
      transitionDuration: $("transition-duration"),
    });

    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem("bibleControlState") || "{}");
    } catch {}
    selectedThemeId = window.BibleThemeRegistry.has(saved.themeId)
      ? saved.themeId
      : "modern";
    themeSettings = { ...getThemeDefaults(), ...(saved.themeSettings || {}) };
    isVisible = Boolean(saved.visible);
    if (elements.visibility) elements.visibility.checked = isVisible;
    const obsUrl = $("obs-url");
    if (obsUrl) obsUrl.textContent = `${window.location.origin}/visualizador/`;

    renderThemeCards();
    syncThemeSettingsUI();
    sendThemeSettings();

    elements.bookSearch.addEventListener("input", () => {
      setClearButton(elements.bookSearch, elements.bookSearchClear);
      searchBooks(elements.bookSearch.value);
    });
    elements.bookSearch.addEventListener("focus", () =>
      searchBooks(
        elements.bookSearch.value === bookById.get(currentBook)?.name
          ? ""
          : elements.bookSearch.value,
      ),
    );
    elements.bookSearch.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && bookResults[0]) {
        event.preventDefault();
        selectPassage(bookResults[0].id);
      }
      if (event.key === "Escape")
        elements.bookDropdown.classList.remove("visible");
    });
    elements.chapter.addEventListener("change", () =>
      selectPassage(currentBook, Number(elements.chapter.value), 1),
    );
    elements.verse.addEventListener("change", () =>
      selectPassage(currentBook, currentChapter, Number(elements.verse.value)),
    );
    elements.textSearch.addEventListener("input", () => {
      setClearButton(elements.textSearch, elements.textSearchClear);
      clearTimeout(searchTimer);
      searchTimer = setTimeout(
        () => searchBible(elements.textSearch.value),
        160,
      );
    });
    elements.bookSearchClear.addEventListener("click", () => {
      elements.bookSearch.value = "";
      setClearButton(elements.bookSearch, elements.bookSearchClear);
      elements.bookSearch.focus();
      searchBooks();
    });
    elements.textSearchClear.addEventListener("click", () => {
      clearTimeout(searchTimer);
      elements.textSearch.value = "";
      setClearButton(elements.textSearch, elements.textSearchClear);
      elements.textSearch.focus();
      searchBible();
    });
    elements.textSearch.addEventListener("focus", () =>
      searchBible(elements.textSearch.value),
    );
    elements.textSearch.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && textResults[0]) {
        event.preventDefault();
        const result = textResults[0];
        selectPassage(result.bookId, result.chapter, result.verse, {
          closeTextSearch: true,
        });
      }
      if (event.key === "Escape")
        elements.textDropdown.classList.remove("visible");
    });
    document.addEventListener("click", (event) => {
      if (
        !elements.bookSearch.contains(event.target) &&
        !elements.bookDropdown.contains(event.target)
      )
        elements.bookDropdown.classList.remove("visible");
      if (
        !elements.textSearch.contains(event.target) &&
        !elements.textDropdown.contains(event.target)
      )
        elements.textDropdown.classList.remove("visible");
      if (!event.target.closest(".anchor-wrap")) toggleAnchor(false);
    });
    elements.previous.addEventListener("click", () => navigate(-1));
    elements.next.addEventListener("click", () => navigate(1));
    elements.visibility.addEventListener("change", () => {
      isVisible = elements.visibility.checked;
      if (isVisible) sendCurrentVerse();
      else sendCommand({ action: "hide" });
      saveState();
    });

    [
      controls.fontSize,
      controls.lineHeight,
      controls.letterSpacing,
      controls.backgroundOpacity,
      controls.backgroundColor,
      controls.padding,
      controls.maxWidth,
      controls.transitionDuration,
    ].forEach((input) => input.addEventListener("input", updateThemeSettings));
    [controls.backgroundOverlayOpacity].forEach((input) =>
      input.addEventListener("input", updateThemeSettings),
    );
    [
      controls.horizontalAlign,
      controls.verticalAlign,
      controls.autoFit,
      controls.fontFamily,
      controls.fontWeight,
      controls.textColor,
      controls.textAlign,
      controls.backgroundVisible,
      controls.textEffect,
      controls.transition,
      controls.backgroundType,
      controls.backgroundFit,
      controls.backgroundPosition,
      controls.imageAnimation,
    ].forEach((input) => input.addEventListener("change", updateThemeSettings));
    $("background-file-button").addEventListener("click", () => {
      if (themeSettings.imageFileName) {
        clearBackgroundImage().catch((error) =>
          console.error("No se pudo quitar la imagen:", error),
        );
      } else {
        $("background-input").click();
      }
    });
    $("background-input").addEventListener("change", (event) => {
      const [file] = event.target.files;
      if (file)
        saveBackgroundImage(file).catch((error) =>
          console.error("No se pudo guardar la imagen:", error),
        );
      event.target.value = "";
    });
    ["dragenter", "dragover"].forEach((type) =>
      $("background-file-button").addEventListener(type, (event) => {
        event.preventDefault();
        $("background-file-button").classList.add("is-dragging");
      }),
    );
    ["dragleave", "drop"].forEach((type) =>
      $("background-file-button").addEventListener(type, (event) => {
        event.preventDefault();
        $("background-file-button").classList.remove("is-dragging");
      }),
    );
    $("background-file-button").addEventListener("drop", (event) => {
      const [file] = event.dataTransfer.files;
      if (file?.type.startsWith("image/"))
        saveBackgroundImage(file).catch((error) =>
          console.error("No se pudo guardar la imagen:", error),
        );
    });
    backgroundAnchors.forEach(([position, symbol]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.position = position;
      button.textContent = symbol;
      button.title = position;
      button.setAttribute("aria-label", `Mostrar ${position}`);
      button.addEventListener("click", () => {
        controls.backgroundPosition.value = position;
        toggleAnchor(false);
        updateThemeSettings();
      });
      document.querySelector(".anchor-grid").append(button);
    });
    updateBackgroundUI();
    $("anchor-button").addEventListener("click", () =>
      toggleAnchor($("anchor-popover").hidden),
    );
    elements.reset.addEventListener("click", () => {
      themeSettings = getThemeDefaults();
      syncThemeSettingsUI();
      sendThemeSettings();
      if (isVisible) sendCurrentVerse();
      saveState();
    });
    elements.settingsButton.addEventListener("click", () =>
      toggleSettings(!elements.settingsDrawer.classList.contains("open")),
    );
    elements.settingsClose.addEventListener("click", () =>
      toggleSettings(false),
    );
    elements.settingsScrim.addEventListener("click", () =>
      toggleSettings(false),
    );
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") toggleSettings(false);
      if (
        event.key === "ArrowLeft" &&
        !["INPUT", "SELECT", "TEXTAREA"].includes(
          document.activeElement.tagName,
        )
      )
        navigate(-1);
      if (
        event.key === "ArrowRight" &&
        !["INPUT", "SELECT", "TEXTAREA"].includes(
          document.activeElement.tagName,
        )
      )
        navigate(1);
    });

    await initializeDatabase(saved);
  } finally {
    setAppReady();
  }
});
