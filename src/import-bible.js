const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DATABASE_PATH = path.join(ROOT, 'data', 'bible.db');
const DATABASE_PATH = path.join(ROOT, 'data', 'bible.db.json');
const BOOK_ORDER = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT',
  'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP',
  'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE',
  '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
];

function cleanContent(content) {
  return String(content || '').replace(/^\s*\[\d+\]\s*/u, '').replace(/\s+/gu, ' ').trim();
}

function buildDatabase(sourcePath = SOURCE_DATABASE_PATH) {
  if (!fs.existsSync(sourcePath)) throw new Error(`No existe la base SQLite: ${sourcePath}`);
  const sqlite = new DatabaseSync(sourcePath, { readOnly: true });
  try {
    const bible = sqlite.prepare('SELECT * FROM bible LIMIT 1').get();
    const bookRows = sqlite.prepare('SELECT id, abbreviation, name, nameLong FROM book').all();
    const chapterRows = sqlite.prepare(
      "SELECT id, CAST(number AS INTEGER) AS number, reference, bookId FROM chapter WHERE number <> 'intro'"
    ).all();
    const verseRows = sqlite.prepare(
      "SELECT id, CAST(number AS INTEGER) AS number, reference, content, chapterId FROM verse WHERE CAST(number AS INTEGER) > 0"
    ).all();

    const chaptersByBook = new Map();
    for (const chapter of chapterRows) {
      if (!chaptersByBook.has(chapter.bookId)) chaptersByBook.set(chapter.bookId, []);
      chaptersByBook.get(chapter.bookId).push({ ...chapter, verses: [] });
    }
    const chaptersById = new Map();
    for (const chapters of chaptersByBook.values()) {
      chapters.sort((a, b) => a.number - b.number);
      chapters.forEach(chapter => chaptersById.set(chapter.id, chapter));
    }
    for (const verse of verseRows) {
      const chapter = chaptersById.get(verse.chapterId);
      if (!chapter) continue;
      chapter.verses.push({
        id: verse.id,
        number: verse.number,
        reference: verse.reference,
        content: cleanContent(verse.content)
      });
    }
    for (const chapter of chaptersById.values()) {
      chapter.verses.sort((a, b) => a.number - b.number);
      delete chapter.bookId;
    }

    const bookById = new Map(bookRows.map(book => [book.id, book]));
    const books = BOOK_ORDER.map((id, index) => {
      const book = bookById.get(id);
      if (!book) throw new Error(`Falta el libro ${id} en la base fuente`);
      const chapters = chaptersByBook.get(id) || [];
      return {
        ...book,
        order: index + 1,
        chapterCount: chapters.length,
        verseCount: chapters.reduce((total, chapter) => total + chapter.verses.length, 0),
        chapters
      };
    });

    return {
      schemaVersion: 1,
      translation: {
        id: bible.id,
        name: bible.name,
        abbreviation: bible.abbreviation,
        description: bible.description,
        language: bible.language,
        copyright: bible.copyright
      },
      source: {
        project: 'jh0rman/biblia-api',
        repository: 'https://github.com/jh0rman/biblia-api',
        license: 'ISC',
        importedFrom: 'src/database/bible.db'
      },
      stats: {
        books: books.length,
        chapters: books.reduce((total, book) => total + book.chapterCount, 0),
        verses: books.reduce((total, book) => total + book.verseCount, 0)
      },
      books
    };
  } finally {
    sqlite.close();
  }
}

function importDatabase(destination = DATABASE_PATH) {
  const database = buildDatabase();
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(database)}\n`);
  return database.stats;
}

if (require.main === module) {
  try {
    const stats = importDatabase();
    console.log(`Base bíblica preparada: ${stats.books} libros, ${stats.chapters} capítulos y ${stats.verses} versículos.`);
  } catch (error) {
    console.error(`Error al importar la Biblia: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  BOOK_ORDER,
  DATABASE_PATH,
  SOURCE_DATABASE_PATH,
  buildDatabase,
  cleanContent,
  importDatabase
};
