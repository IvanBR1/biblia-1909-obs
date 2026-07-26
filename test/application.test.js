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
  assert.match(await panel.text(), /Búsqueda avanzada por texto/u);

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

  assert.equal(packageJson.version, '2.1.1');
  assert.match(presentation, /Versión 2\.1\.1/u);
  assert.match(presentation, /Iván Bermúdez Regino/u);
  assert.match(panel, /id="text-search"/u);
  assert.match(panel, /id="panel-appearance"/u);
  assert.match(panel, /value="compact"/u);
  assert.match(panel, /value="minimal"/u);
  assert.match(panel, /id="anchor-popover"/u);
  assert.match(panel, /Apariencia del visualizador/u);
  assert.match(control, /\/data\/bible\.db\.json/u);
  assert.match(control, /searchableVerses/u);
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
