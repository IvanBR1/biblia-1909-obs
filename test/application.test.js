const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { PUBLIC_DATABASE_PATH, copyDatabase } = require('../src/build-static');
const { createServer, resolvePublicPath } = require('../src/server');
const {
  DATABASE_PATH,
  SOURCE_DATABASE_PATH,
  buildDatabase,
  cleanContent,
  parseVerseContent,
  importDatabase
} = require('../src/import-bible');

const ROOT = path.resolve(__dirname, '..');

test('importa la Reina-Valera 1909 completa desde el SQLite local', () => {
  assert.ok(fs.existsSync(SOURCE_DATABASE_PATH));
  const database = buildDatabase();
  assert.equal(database.translation.id, 'RVR09');
  assert.equal(database.stats.books, 66);
  assert.equal(database.stats.chapters, 1189);
  assert.equal(database.stats.verses, 31102);
  assert.equal(database.books[0].id, 'GEN');
  assert.equal(database.books.at(-1).id, 'REV');
  assert.equal(database.books[0].chapters[0].verses[0].reference, 'Génesis 1:1');
  assert.equal(database.books[0].chapters[0].verses[0].content, 'EN el principio crió Dios los cielos y la tierra.');
  assert.equal(cleanContent('[12]  Texto   con espacios.'), 'Texto con espacios.');
  assert.deepEqual(
    parseVerseContent('1 Fortaleza y constancia\n2 en el trabajo cristiano.\n     [19] Atesorando para sí buen fundamento para lo por venir.'),
    { heading: 'Fortaleza y constancia en el trabajo cristiano.', content: 'Atesorando para sí buen fundamento para lo por venir.', note: '' }
  );
  assert.deepEqual(
    parseVerseContent('[22] El Señor Jesucristo sea con tu espíritu.\n    \n    Nota final de la epístola.'),
    { heading: '', content: 'El Señor Jesucristo sea con tu espíritu.', note: 'Nota final de la epístola.' }
  );
});

test('genera y publica una base navegable determinista', () => {
  const temporaryPath = path.join(ROOT, 'data', 'bible.test.db.json');
  const stats = importDatabase(temporaryPath);
  assert.deepEqual(stats, { books: 66, chapters: 1189, verses: 31102 });
  const generated = JSON.parse(fs.readFileSync(temporaryPath, 'utf8'));
  assert.equal(generated.books[42].name, 'San Juan');
  fs.rmSync(temporaryPath, { force: true });

  copyDatabase();
  const digest = value => crypto.createHash('sha256').update(value).digest('hex');
  assert.equal(digest(fs.readFileSync(DATABASE_PATH)), digest(fs.readFileSync(PUBLIC_DATABASE_PATH)));
});

test('sirve presentación, panel, visualizador y base desde un solo proceso', async context => {
  assert.equal(resolvePublicPath('/'), path.join(ROOT, 'public', 'index.html'));
  assert.equal(resolvePublicPath('/panel/'), path.join(ROOT, 'public', 'panel', 'index.html'));
  assert.equal(resolvePublicPath('/visualizador/'), path.join(ROOT, 'public', 'visualizador', 'index.html'));
  assert.equal(resolvePublicPath('/../../etc/passwd'), null);

  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise(resolve => server.close(resolve)));
  const { port } = server.address();
  const get = pathname => fetch(`http://127.0.0.1:${port}${pathname}`);

  const presentation = await get('/');
  assert.equal(presentation.status, 200);
  assert.match(await presentation.text(), /Iván Bermúdez Regino/u);

  const panel = await get('/panel/');
  assert.equal(panel.status, 200);
  assert.match(await panel.text(), /Búsqueda avanzada\s+por texto/u);

  const viewer = await get('/visualizador/');
  assert.equal(viewer.status, 200);
  assert.match(await viewer.text(), /theme-root/u);

  const database = await get('/data/bible.db.json');
  assert.equal(database.status, 200);
  assert.equal((await database.json()).stats.verses, 31102);
});

test('incluye versión, datos del desarrollador, temas y búsqueda local', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const presentation = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
  const panel = fs.readFileSync(path.join(ROOT, 'public', 'panel', 'index.html'), 'utf8');
  const control = fs.readFileSync(path.join(ROOT, 'public', 'assets', 'js', 'control.js'), 'utf8');
  const runtime = fs.readFileSync(path.join(ROOT, 'public', 'themes', 'shared', 'preview-runtime.js'), 'utf8');
  const commonStyles = fs.readFileSync(path.join(ROOT, 'public', 'themes', 'shared', 'commonStyles.css'), 'utf8');

  assert.equal(packageJson.version, '2.1.2');
  assert.match(presentation, /Versión 2\.1\.2/u);
  assert.match(presentation, /Iván Bermúdez Regino/u);
  assert.match(panel, /id="text-search"/u);
  assert.doesNotMatch(panel, /type="search"/u);
  assert.equal((panel.match(/class="search-clear"/gu) || []).length, 2);
  assert.match(panel, /id="book-history-button"/u);
  assert.match(panel, /id="book-history-dropdown"/u);
  assert.match(panel, /id="panel-appearance"/u);
  assert.match(panel, /value="compact"/u);
  assert.match(panel, /value="minimal"/u);
  assert.match(panel, /id="anchor-popover"/u);
  assert.match(panel, /Personalización/u);
  assert.match(control, /\/data\/bible\.db\.json/u);
  assert.match(control, /searchableVerses/u);
  assert.doesNotMatch(control, /HISTORY_LIMIT/u);
  assert.match(panel, /id="passage-bookmark-button"/u);
  assert.match(control, /selectPassage\(result\.bookId, result\.chapter, result\.verse/u);
  assert.match(runtime, /bibleDisplayCommand/u);
  assert.match(runtime, /setPassageContent/u);
  assert.match(runtime, /measurePassage/u);
  assert.match(control, /renderPreviewPassage/u);
  assert.match(commonStyles, /\.verse-heading/u);
  assert.match(commonStyles, /\.verse-note/u);
  assert.doesNotMatch(runtime, /hymnal/u);
  for (const theme of ['classic', 'modern', 'minimal', 'cinematic', 'broadcast', 'glass', 'editorial', 'neon', 'ribbon', 'spotlight']) {
    assert.ok(fs.existsSync(path.join(ROOT, 'public', 'themes', theme, 'config.js')));
  }
});
const vm = require('node:vm');

test('historial guarda emisiones sin límite y conserva marcadores al limpiar', () => {
  const source = fs.readFileSync(path.join(ROOT, 'public/assets/js/control.js'), 'utf8');
  const storage = new Map();
  const context = vm.createContext({
    window: { BibleThemeDefaults: {} },
    document: { addEventListener() {} },
    localStorage: { setItem(key, value) { storage.set(key, value); } },
  });
  vm.runInContext(source.replace(/databaseLoadPromise = loadDatabase\(\)\.catch\([\s\S]*?\n\}\);/u, ""), context);
  vm.runInContext(`
    database = { translation: { abbreviation: 'RVR09' } };
    bookById.set('GEN', { id: 'GEN', chapters: [{ number: 1, verses: Array.from({length: 30}, (_, i) => ({ number: i + 1, reference: 'Génesis 1:' + (i + 1), content: 'Texto' })) }] });
    currentBook = 'GEN'; currentChapter = 1; currentVerse = 1;
    sendCurrentVerse();
  `, context);
  assert.equal(storage.has('biblePassageHistory'), false);
  vm.runInContext(`
    togglePassageBookmark();
    isVisible = true;
    for (currentVerse = 2; currentVerse <= 30; currentVerse++) sendCurrentVerse();
  `, context);
  let history = JSON.parse(storage.get('biblePassageHistory'));
  assert.equal(history.length, 30);
  assert.equal(history[0].verse, 30);
  assert.equal(history.find(entry => entry.verse === 1).presented, false);
  vm.runInContext('clearPassageHistory();', context);
  history = JSON.parse(storage.get('biblePassageHistory'));
  assert.equal(history.length, 1);
  assert.equal(history[0].verse, 1);
  assert.equal(history[0].bookmarked, true);
  vm.runInContext('currentVerse = 1; togglePassageBookmark();', context);
  assert.deepEqual(JSON.parse(storage.get('biblePassageHistory')), []);
  vm.runInContext('sendCurrentVerse(); sendCurrentVerse();', context);
  history = JSON.parse(storage.get('biblePassageHistory'));
  assert.equal(history.length, 1);
  assert.equal(history[0].presented, true);
  vm.runInContext(`
    books = [...bookById.values()];
    populateChapters = () => { currentChapter = 1; };
    populateVerses = number => { currentVerse = number; };
    updatePreview = () => {};
    elements.bookSearch = {};
    elements.bookSearchClear = {};
    elements.bookDropdown = { classList: { remove() {} } };
    navigate(1);
    sendCurrentVerse();
  `, context);
  history = JSON.parse(storage.get('biblePassageHistory'));
  assert.equal(history.length, 1);
  vm.runInContext('togglePassageBookmark();', context);
  history = JSON.parse(storage.get('biblePassageHistory'));
  assert.equal(history.length, 2);
  assert.equal(history[0].verse, 2);
  assert.equal(history[0].bookmarked, true);
  vm.runInContext('clearPassageHistory(true);', context);
  assert.deepEqual(JSON.parse(storage.get('biblePassageHistory')), []);
  vm.runInContext(`
    navigate(1);
    setPresentationVisible(false);
    navigate(1);
    setPresentationVisible(true);
  `, context);
  history = JSON.parse(storage.get('biblePassageHistory'));
  assert.equal(history.length, 1);
  assert.equal(history[0].verse, 4);
  vm.runInContext('navigate(1); sendCurrentVerse();', context);
  assert.equal(JSON.parse(storage.get('biblePassageHistory')).length, 1);
  vm.runInContext("selectPassage('GEN', 1, 10);", context);
  history = JSON.parse(storage.get('biblePassageHistory'));
  assert.equal(history.length, 2);
  assert.equal(history[0].verse, 10);

});

test('busqueda tolera orden, palabras omitidas y errores y prioriza coincidencias', () => {
  const source = fs.readFileSync(path.join(ROOT, 'public/assets/js/control.js'), 'utf8');
  const context = vm.createContext({ window: { BibleThemeDefaults: {} }, document: { addEventListener() {} } });
  vm.runInContext(source.replace(/databaseLoadPromise = loadDatabase\(\)\.catch\([\s\S]*?\n\}\);/u, ''), context);
  context.fixture = [
    { reference: 'A', content: 'En el principio crio Dios los cielos y la tierra' },
    { reference: 'B', content: 'Dios mira la tierra' },
    { reference: 'C', content: 'En el principia crio Dios los cielos' },
    { reference: 'D', content: 'El amor permanece para siempre' },
  ];
  vm.runInContext('searchableVerses = fixture.map(verse => ({ ...verse, searchWords: normalizeSearch(verse.content).split(" ") }));', context);
  const references = query => Array.from(vm.runInContext(`findBibleMatches(${JSON.stringify(query)}).map(item => item.reference)`, context));
  assert.equal(references('tierra principio Dios')[0], 'A');
  assert.equal(references('principio Dios cielos')[0], 'A');
  assert.equal(references('princpio Dios cielos')[0], 'A');
  assert.equal(references('princpiio Dios cielos')[0], 'A');
  assert.equal(references('principio Dios cielos')[0], 'A');
  assert.equal(references('principio crioo Dios')[0], 'A');
  assert.equal(references('principio palabra Dios cielos')[0], 'A');
  assert.equal(references('en el principio')[0], 'A');
  assert.deepEqual(references('zzzzzz qqqqqq'), []);
  assert.deepEqual(references('ab'), []);
  context.fullBible = JSON.parse(fs.readFileSync(PUBLIC_DATABASE_PATH, 'utf8'));
  vm.runInContext('searchableVerses = fullBible.books.flatMap(book => book.chapters.flatMap(chapter => chapter.verses.map(verse => ({ ...verse, searchWords: normalizeSearch(verse.reference + " " + verse.content).split(" ") }))));', context);
  assert.equal(references('principio crio Dios')[0], 'G\u00e9nesis 1:1');
  assert.ok(references('princpio Dios cielos').includes('G\u00e9nesis 1:1'));
  vm.runInContext('books = fullBible.books;', context);
  assert.equal(references('Miserable de mi Corintios')[0], 'Romanos 7:24');
  assert.equal(references('Miserable de mi')[0], 'Romanos 7:24');
  assert.equal(references('Miserable de mi Romanos')[0], 'Romanos 7:24');
  assert.ok(references('Corintios')[0].includes('Corintios'));
});

test('historial muestra solo el cuerpo del versiculo sin titulos ni notas de cartas', () => {
  const source = fs.readFileSync(path.join(ROOT, 'public/assets/js/control.js'), 'utf8');
  const context = vm.createContext({ window: { BibleThemeDefaults: {} }, document: { addEventListener() {} } });
  vm.runInContext(source.replace(/databaseLoadPromise = loadDatabase\(\)\.catch\([\s\S]*?\n\}\);/u, ''), context);
  context.fullBible = JSON.parse(fs.readFileSync(PUBLIC_DATABASE_PATH, 'utf8'));
  vm.runInContext('bookById = new Map(fullBible.books.map(book => [book.id, book]));', context);
  const excerpt = item => {
    context.historyItem = item;
    return vm.runInContext('historyVerseText(historyItem)', context);
  };
  const psalm = excerpt({ bookId: 'PSA', chapter: 3, verse: 1 });
  assert.ok(psalm.startsWith('\u00a1OH Jehov\u00e1'));
  assert.doesNotMatch(psalm, /Salmo de David|Absalom|\[1\]/u);
  for (const bookId of ['ROM', '1CO', '2TI', 'PHM']) {
    const book = context.fullBible.books.find(book => book.id === bookId);
    const chapter = book.chapters.at(-1);
    const verse = chapter.verses.at(-1);
    assert.ok(verse.note.length);
    const text = excerpt({ bookId, chapter: chapter.number, verse: verse.number });
    assert.equal(text, verse.content);
    assert.ok(!text.includes(verse.note));
  }
  const headed = context.fullBible.books.flatMap(book => book.chapters.flatMap(chapter => chapter.verses
    .filter(verse => verse.heading).map(verse => ({ bookId: book.id, chapter: chapter.number, verse: verse.number, original: verse }))));
  assert.ok(headed.length);
  for (const item of headed) assert.equal(excerpt(item), item.original.content.replace(/\s+/gu, ' ').trim());
  assert.equal(excerpt({ bookId: 'missing', chapter: 1, verse: 1 }), '');
});
