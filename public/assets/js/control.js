const DATABASE_URL = '/data/bible.db.json';
const $ = id => document.getElementById(id);

const elements = {
  bookSearch: $('book-search'), bookDropdown: $('book-dropdown'),
  chapter: $('chapter-select'), verse: $('verse-select'),
  textSearch: $('text-search'), textDropdown: $('text-dropdown'),
  previous: $('prev-verse'), next: $('next-verse'), visibility: $('visibility-toggle'),
  counter: $('verse-counter'), reference: $('selected-reference'), bookMeta: $('selected-book-meta'),
  previewCurrent: $('preview-current'), previewNext: $('preview-next'),
  databaseStatus: $('database-status'), themeList: $('theme-list'),
  settingsButton: $('settings-button'), settingsDrawer: $('settings-drawer'), settingsClose: $('settings-close'),
  settingsScrim: $('settings-scrim'), reset: $('reset-theme-settings')
};

const controls = {
  horizontalAlign: $('horizontal-align'), verticalAlign: $('vertical-align'), autoFit: $('auto-fit-toggle'),
  fontFamily: $('font-family'), fontSize: $('font-size'),
  textColor: $('text-color'), textAlign: $('text-align'), lineHeight: $('line-height'),
  backgroundColor: $('background-color'), backgroundOpacity: $('background-opacity'),
  backgroundVisible: $('background-toggle'), padding: $('padding'), maxWidth: $('max-width'), textEffect: $('text-effect')
};

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
let selectedThemeId = 'classic';
let themeSettings = { ...window.BibleThemeDefaults };
let searchTimer;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLocaleLowerCase('es-MX');
}

function setDatabaseStatus(state, message) {
  elements.databaseStatus.className = `database-status ${state}`;
  elements.databaseStatus.querySelector('span:last-child').textContent = message;
}

function currentPassage() {
  const book = bookById.get(currentBook);
  const chapter = book?.chapters.find(item => item.number === currentChapter);
  const verse = chapter?.verses.find(item => item.number === currentVerse);
  return { book, chapter, verse };
}

function adjacentPassage(direction) {
  const { book, chapter } = currentPassage();
  if (!book || !chapter) return null;
  const verseIndex = chapter.verses.findIndex(item => item.number === currentVerse);
  const nextVerse = chapter.verses[verseIndex + direction];
  if (nextVerse) return { book, chapter, verse: nextVerse };

  const chapterIndex = book.chapters.findIndex(item => item.number === currentChapter);
  const nextChapter = book.chapters[chapterIndex + direction];
  if (nextChapter) {
    const verse = direction > 0 ? nextChapter.verses[0] : nextChapter.verses.at(-1);
    return verse ? { book, chapter: nextChapter, verse } : null;
  }

  const bookIndex = books.findIndex(item => item.id === currentBook);
  const nextBook = books[bookIndex + direction];
  if (!nextBook) return null;
  const edgeChapter = direction > 0 ? nextBook.chapters[0] : nextBook.chapters.at(-1);
  const edgeVerse = direction > 0 ? edgeChapter?.verses[0] : edgeChapter?.verses.at(-1);
  return edgeVerse ? { book: nextBook, chapter: edgeChapter, verse: edgeVerse } : null;
}

function saveState() {
  localStorage.setItem('bibleControlState', JSON.stringify({
    book: currentBook,
    chapter: currentChapter,
    verse: currentVerse,
    visible: isVisible,
    themeId: selectedThemeId,
    themeSettings
  }));
}

function sendCommand(command) {
  localStorage.setItem('bibleDisplayCommand', JSON.stringify({ ...command, sentAt: Date.now() }));
}

function sendThemeSettings() {
  localStorage.setItem('bibleSelectedTheme', selectedThemeId);
  localStorage.setItem('bibleThemeSettings', JSON.stringify({ themeId: selectedThemeId, settings: themeSettings }));
  sendCommand({ action: 'theme-settings', themeId: selectedThemeId, settings: themeSettings });
}

function sendCurrentVerse() {
  const { verse } = currentPassage();
  if (!verse) return;
  sendCommand({
    action: 'load',
    content: verse.content,
    heading: verse.heading,
    note: verse.note,
    reference: `${verse.reference} · ${database.translation.abbreviation}`,
    show: isVisible,
    themeId: selectedThemeId,
    settings: themeSettings
  });
}

function renderPreviewPassage(container, verse, fallback) {
  const text = container.querySelector('.verse-text');
  text.replaceChildren();
  if (!verse) {
    text.textContent = fallback;
    return;
  }
  for (const [className, content] of [['verse-heading', verse.heading], ['verse-body', verse.content], ['verse-note', verse.note]]) {
    if (!content) continue;
    const section = document.createElement('div');
    section.className = className;
    section.textContent = content;
    text.append(section);
  }
}

function updatePreview() {
  const { book, chapter, verse } = currentPassage();
  const following = adjacentPassage(1);
  renderPreviewPassage(elements.previewCurrent, verse, 'Selecciona un versículo');
  elements.previewCurrent.querySelector('.verse-ref').textContent = verse ? `Actual: ${verse.reference}` : 'Actual';
  renderPreviewPassage(elements.previewNext, following?.verse, 'Fin de la Biblia');
  elements.previewNext.querySelector('.verse-ref').textContent = following ? `Siguiente: ${following.verse.reference}` : 'Siguiente';
  elements.reference.textContent = verse?.reference || '—';
  elements.bookMeta.textContent = book && chapter
    ? `${book.nameLong} · ${chapter.verses.length} versículos en el capítulo · ${database.translation.name}`
    : 'Selecciona un libro, capítulo y versículo';
  elements.counter.textContent = chapter && verse ? `${verse.number} / ${chapter.verses.length}` : '— / —';
  elements.previous.disabled = !adjacentPassage(-1);
  elements.next.disabled = !following;
}

function populateChapters(preferredChapter = 1) {
  const book = bookById.get(currentBook);
  elements.chapter.innerHTML = (book?.chapters || [])
    .map(chapter => `<option value="${chapter.number}">${chapter.number}</option>`).join('');
  const available = book?.chapters.some(chapter => chapter.number === Number(preferredChapter));
  currentChapter = available ? Number(preferredChapter) : (book?.chapters[0]?.number || 1);
  elements.chapter.value = String(currentChapter);
}

function populateVerses(preferredVerse = 1) {
  const { chapter } = currentPassage();
  elements.verse.innerHTML = (chapter?.verses || [])
    .map(verse => `<option value="${verse.number}">${verse.number}</option>`).join('');
  const available = chapter?.verses.some(verse => verse.number === Number(preferredVerse));
  currentVerse = available ? Number(preferredVerse) : (chapter?.verses[0]?.number || 1);
  elements.verse.value = String(currentVerse);
}

function selectPassage(bookId, chapterNumber = 1, verseNumber = 1, options = {}) {
  const book = bookById.get(bookId);
  if (!book) return;
  currentBook = book.id;
  elements.bookSearch.value = book.name;
  elements.bookDropdown.classList.remove('visible');
  populateChapters(chapterNumber);
  populateVerses(verseNumber);
  updatePreview();
  if (isVisible) sendCurrentVerse();
  if (options.closeTextSearch) elements.textDropdown.classList.remove('visible');
  saveState();
}

function navigate(direction) {
  const passage = adjacentPassage(direction);
  if (passage) selectPassage(passage.book.id, passage.chapter.number, passage.verse.number);
}

function renderBookResults(items) {
  bookResults = items;
  elements.bookDropdown.innerHTML = items.length
    ? items.map((book, index) => `
      <div class="search-dropdown-item${index === 0 ? ' active' : ''}" data-index="${index}">
        <div class="hymn-result"><strong>${escapeHtml(book.name)}</strong><small>${escapeHtml(book.id)} · ${book.chapterCount} capítulos</small></div>
      </div>`).join('')
    : '<div class="no-results">No se encontraron libros</div>';
  elements.bookDropdown.querySelectorAll('.search-dropdown-item').forEach(node => {
    node.addEventListener('click', () => selectPassage(bookResults[Number(node.dataset.index)].id));
  });
  elements.bookDropdown.classList.add('visible');
}

function searchBooks(query = '') {
  const term = normalizeSearch(query);
  renderBookResults(books.filter(book => !term || normalizeSearch(`${book.name} ${book.nameLong} ${book.id} ${book.abbreviation}`).includes(term)));
}

function renderTextResults(items, query) {
  textResults = items;
  if (normalizeSearch(query).length < 3) {
    elements.textDropdown.innerHTML = '<div class="no-results">Escribe al menos 3 caracteres para buscar</div>';
  } else if (!items.length) {
    elements.textDropdown.innerHTML = '<div class="no-results">No se encontraron versículos con ese texto</div>';
  } else {
    elements.textDropdown.innerHTML = items.map((item, index) => `
      <div class="search-dropdown-item verse-result-item${index === 0 ? ' active' : ''}" data-index="${index}">
        <div class="verse-result"><strong>${escapeHtml(item.reference)}</strong><small>${escapeHtml(item.content)}</small></div>
      </div>`).join('');
    elements.textDropdown.querySelectorAll('.search-dropdown-item').forEach(node => {
      node.addEventListener('click', () => {
        const result = textResults[Number(node.dataset.index)];
        selectPassage(result.bookId, result.chapter, result.verse, { closeTextSearch: true });
      });
    });
  }
  elements.textDropdown.classList.add('visible');
}

function searchBible(query = '') {
  const normalized = normalizeSearch(query);
  if (normalized.length < 3) return renderTextResults([], query);
  const terms = normalized.split(/\s+/u);
  const results = [];
  for (const verse of searchableVerses) {
    if (terms.every(term => verse.searchText.includes(term))) {
      results.push(verse);
      if (results.length === 50) break;
    }
  }
  renderTextResults(results, query);
}

async function initializeDatabase(saved) {
  try {
    const response = await fetch(DATABASE_URL);
    if (!response.ok) throw new Error(`No se pudo leer la base local (${response.status})`);
    database = await response.json();
    if (database.schemaVersion !== 1 || !Array.isArray(database.books)) throw new Error('La base local no tiene un formato compatible');
    books = database.books;
    bookById = new Map(books.map(book => [book.id, book]));
    searchableVerses = books.flatMap(book => book.chapters.flatMap(chapter => chapter.verses.map(verse => ({
      bookId: book.id,
      chapter: chapter.number,
      verse: verse.number,
      reference: verse.reference,
      content: verse.content,
      searchText: normalizeSearch(`${verse.reference} ${verse.content}`)
    }))));
    setDatabaseStatus('connected', `${database.stats.verses.toLocaleString('es-MX')} versículos en la base local`);
    selectPassage(saved.book || 'GEN', saved.chapter || 1, saved.verse || 1);
  } catch (error) {
    console.error(error);
    setDatabaseStatus('error', 'No se pudo cargar la base local');
    elements.previewCurrent.querySelector('.verse-text').textContent = 'No se pudo cargar la Biblia local';
  }
}

function getThemeDefaults() {
  const theme = window.BibleThemeRegistry.get(selectedThemeId);
  return { ...window.BibleThemeDefaults, ...(theme ? theme.defaults : {}) };
}

function updateSettingOutputs() {
  const units = { 'font-size': ' px', 'line-height': '', 'background-opacity': '%', padding: ' px', 'max-width': ' px' };
  Object.entries(units).forEach(([id, unit]) => { $(`${id}-value`).textContent = `${$(id).value}${unit}`; });
}

function syncThemeSettingsUI() {
  const values = {
    horizontalAlign: themeSettings.horizontalAlign, verticalAlign: themeSettings.verticalAlign,
    fontSize: themeSettings.fontSize, textColor: themeSettings.textColor,
    textAlign: themeSettings.textAlign, lineHeight: themeSettings.lineHeight, backgroundColor: themeSettings.backgroundColor,
    backgroundOpacity: themeSettings.backgroundOpacity, padding: themeSettings.padding, maxWidth: themeSettings.maxWidth, textEffect: themeSettings.textEffect
  };
  Object.entries(values).forEach(([key, value]) => { controls[key].value = value; });
  controls.backgroundVisible.checked = themeSettings.backgroundVisible !== false;
  controls.autoFit.checked = themeSettings.autoFit !== false;
  controls.fontSize.disabled = controls.autoFit.checked;
  controls.fontSize.closest('.settings-grid')?.classList.toggle('auto-fit-active', controls.autoFit.checked);
  const theme = window.BibleThemeRegistry.get(selectedThemeId);
  controls.fontFamily.innerHTML = '';
  (theme.fonts || []).forEach(font => controls.fontFamily.add(new Option(font.split(',')[0], font)));
  if (![...controls.fontFamily.options].some(option => option.value === themeSettings.fontFamily)) controls.fontFamily.add(new Option(themeSettings.fontFamily.split(',')[0], themeSettings.fontFamily));
  controls.fontFamily.value = themeSettings.fontFamily;
  updateSettingOutputs();
}

function renderThemeCards() {
  elements.themeList.innerHTML = window.BibleThemeRegistry.all().map(theme => `
    <button type="button" class="theme-card${theme.id === selectedThemeId ? ' selected' : ''}" data-theme="${theme.id}" role="radio" aria-checked="${theme.id === selectedThemeId}">
      <span class="theme-swatch theme-swatch-${theme.id}"></span><span><strong>${theme.name}</strong><small>${theme.description}</small></span>
    </button>`).join('');
  elements.themeList.querySelectorAll('.theme-card').forEach(card => card.addEventListener('click', () => {
    selectedThemeId = card.dataset.theme;
    themeSettings = getThemeDefaults();
    renderThemeCards();
    syncThemeSettingsUI();
    sendThemeSettings();
    if (isVisible) sendCurrentVerse();
    saveState();
  }));
}

function updateThemeSettings() {
  themeSettings = {
    horizontalAlign: controls.horizontalAlign.value, verticalAlign: controls.verticalAlign.value,
    autoFit: controls.autoFit.checked, fontFamily: controls.fontFamily.value,
    fontSize: Number(controls.fontSize.value), textColor: controls.textColor.value, textAlign: controls.textAlign.value,
    lineHeight: Number(controls.lineHeight.value), backgroundColor: controls.backgroundColor.value,
    backgroundOpacity: Number(controls.backgroundOpacity.value), backgroundVisible: controls.backgroundVisible.checked,
    padding: Number(controls.padding.value), maxWidth: Number(controls.maxWidth.value), textEffect: controls.textEffect.value
  };
  controls.fontSize.disabled = controls.autoFit.checked;
  controls.fontSize.closest('.settings-grid')?.classList.toggle('auto-fit-active', controls.autoFit.checked);
  updateSettingOutputs();
  sendThemeSettings();
  if (isVisible) sendCurrentVerse();
  saveState();
}

function toggleSettings(open) {
  elements.settingsDrawer.classList.toggle('open', open);
  elements.settingsDrawer.setAttribute('aria-hidden', String(!open));
  elements.settingsButton.setAttribute('aria-expanded', String(open));
  elements.settingsScrim.hidden = !open;
}

document.addEventListener('DOMContentLoaded', async () => {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('bibleControlState') || '{}'); } catch {}
  selectedThemeId = window.BibleThemeRegistry.has(saved.themeId) ? saved.themeId : 'classic';
  themeSettings = { ...getThemeDefaults(), ...(saved.themeSettings || {}) };
  isVisible = Boolean(saved.visible);
  elements.visibility.checked = isVisible;
  $('obs-url').textContent = `${window.location.origin}/visualizador/`;

  renderThemeCards();
  syncThemeSettingsUI();
  sendThemeSettings();

  elements.bookSearch.addEventListener('input', () => searchBooks(elements.bookSearch.value));
  elements.bookSearch.addEventListener('focus', () => searchBooks(elements.bookSearch.value === bookById.get(currentBook)?.name ? '' : elements.bookSearch.value));
  elements.bookSearch.addEventListener('keydown', event => {
    if (event.key === 'Enter' && bookResults[0]) { event.preventDefault(); selectPassage(bookResults[0].id); }
    if (event.key === 'Escape') elements.bookDropdown.classList.remove('visible');
  });
  elements.chapter.addEventListener('change', () => selectPassage(currentBook, Number(elements.chapter.value), 1));
  elements.verse.addEventListener('change', () => selectPassage(currentBook, currentChapter, Number(elements.verse.value)));
  elements.textSearch.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchBible(elements.textSearch.value), 160);
  });
  elements.textSearch.addEventListener('focus', () => searchBible(elements.textSearch.value));
  elements.textSearch.addEventListener('keydown', event => {
    if (event.key === 'Enter' && textResults[0]) {
      event.preventDefault();
      const result = textResults[0];
      selectPassage(result.bookId, result.chapter, result.verse, { closeTextSearch: true });
    }
    if (event.key === 'Escape') elements.textDropdown.classList.remove('visible');
  });
  document.addEventListener('click', event => {
    if (!elements.bookSearch.contains(event.target) && !elements.bookDropdown.contains(event.target)) elements.bookDropdown.classList.remove('visible');
    if (!elements.textSearch.contains(event.target) && !elements.textDropdown.contains(event.target)) elements.textDropdown.classList.remove('visible');
  });
  elements.previous.addEventListener('click', () => navigate(-1));
  elements.next.addEventListener('click', () => navigate(1));
  elements.visibility.addEventListener('change', () => {
    isVisible = elements.visibility.checked;
    if (isVisible) sendCurrentVerse();
    else sendCommand({ action: 'hide' });
    saveState();
  });

  [controls.fontSize, controls.lineHeight, controls.backgroundOpacity, controls.padding, controls.maxWidth].forEach(input => input.addEventListener('input', updateThemeSettings));
  [controls.horizontalAlign, controls.verticalAlign, controls.autoFit, controls.fontFamily, controls.textColor, controls.textAlign, controls.backgroundColor, controls.backgroundVisible, controls.textEffect].forEach(input => input.addEventListener('change', updateThemeSettings));
  elements.reset.addEventListener('click', () => {
    themeSettings = getThemeDefaults();
    syncThemeSettingsUI();
    sendThemeSettings();
    if (isVisible) sendCurrentVerse();
    saveState();
  });
  elements.settingsButton.addEventListener('click', () => toggleSettings(!elements.settingsDrawer.classList.contains('open')));
  elements.settingsClose.addEventListener('click', () => toggleSettings(false));
  elements.settingsScrim.addEventListener('click', () => toggleSettings(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') toggleSettings(false);
    if (event.key === 'ArrowLeft' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) navigate(-1);
    if (event.key === 'ArrowRight' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) navigate(1);
  });

  await initializeDatabase(saved);
});
