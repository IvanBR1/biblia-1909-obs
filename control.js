// Elementos del DOM
const bookSelect = document.getElementById('book-select');
const chapterInput = document.getElementById('chapter-input');
const verseInput = document.getElementById('verse-input');
const prevVerseBtn = document.getElementById('prev-verse');
const nextVerseBtn = document.getElementById('next-verse');
const visibilityToggle = document.getElementById('visibility-toggle');
const historyList = document.getElementById('history-list');
const previewCurrent = document.getElementById('preview-current');
const bookSearchInput = document.getElementById('book-search');
const bookDropdown = document.getElementById('book-dropdown');

// Estado actual
let currentBook = 'GEN';
let currentChapter = 1;
let currentVerse = 1;
let isVisible = false;

// Historial de búsquedas (máximo 10)
let searchHistory = [];

// Estructura de la Biblia - número de capítulos por libro
const bookChapters = {
    'GEN': 50, 'EXO': 40, 'LEV': 27, 'NUM': 36, 'DEU': 34,
    'JOS': 24, 'JDG': 21, 'RUT': 4, '1SA': 31, '2SA': 24,
    '1KI': 22, '2KI': 25, '1CH': 29, '2CH': 36, 'EZR': 10,
    'NEH': 13, 'EST': 10, 'JOB': 42, 'PSA': 150, 'PRO': 31,
    'ECC': 12, 'SNG': 8, 'ISA': 66, 'JER': 52, 'LAM': 5,
    'EZK': 48, 'DAN': 12, 'HOS': 14, 'JOL': 3, 'AMO': 9,
    'OBA': 1, 'JON': 4, 'MIC': 7, 'NAM': 3, 'HAB': 3,
    'ZEP': 3, 'HAG': 2, 'ZEC': 14, 'MAL': 4, 'MAT': 28,
    'MRK': 16, 'LUK': 24, 'JHN': 21, 'ACT': 28, 'ROM': 16,
    '1CO': 16, '2CO': 13, 'GAL': 6, 'EPH': 6, 'PHP': 4,
    'COL': 4, '1TH': 5, '2TH': 3, '1TI': 6, '2TI': 4,
    'TIT': 3, 'PHM': 1, 'HEB': 13, 'JAS': 5, '1PE': 5,
    '2PE': 3, '1JN': 5, '2JN': 1, '3JN': 1, 'JUD': 1,
    'REV': 22
};

// Lista de libros en orden
const bookOrder = [
    'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
    '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
    'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
    'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT',
    'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP',
    'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE',
    '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
];

// Cache para almacenar el número de versículos por capítulo
const verseCountCache = {};

// Datos de libros para la búsqueda
const allBooks = [
    { code: 'GEN', name: 'Génesis' },
    { code: 'EXO', name: 'Éxodo' },
    { code: 'LEV', name: 'Levítico' },
    { code: 'NUM', name: 'Números' },
    { code: 'DEU', name: 'Deuteronomio' },
    { code: 'JOS', name: 'Josué' },
    { code: 'JDG', name: 'Jueces' },
    { code: 'RUT', name: 'Rut' },
    { code: '1SA', name: '1 Samuel' },
    { code: '2SA', name: '2 Samuel' },
    { code: '1KI', name: '1 Reyes' },
    { code: '2KI', name: '2 Reyes' },
    { code: '1CH', name: '1 Crónicas' },
    { code: '2CH', name: '2 Crónicas' },
    { code: 'EZR', name: 'Esdras' },
    { code: 'NEH', name: 'Nehemías' },
    { code: 'EST', name: 'Ester' },
    { code: 'JOB', name: 'Job' },
    { code: 'PSA', name: 'Salmos' },
    { code: 'PRO', name: 'Proverbios' },
    { code: 'ECC', name: 'Eclesiastés' },
    { code: 'SNG', name: 'Cantares' },
    { code: 'ISA', name: 'Isaías' },
    { code: 'JER', name: 'Jeremías' },
    { code: 'LAM', name: 'Lamentaciones' },
    { code: 'EZK', name: 'Ezequiel' },
    { code: 'DAN', name: 'Daniel' },
    { code: 'HOS', name: 'Oseas' },
    { code: 'JOL', name: 'Joel' },
    { code: 'AMO', name: 'Amós' },
    { code: 'OBA', name: 'Abdías' },
    { code: 'JON', name: 'Jonás' },
    { code: 'MIC', name: 'Miqueas' },
    { code: 'NAM', name: 'Nahúm' },
    { code: 'HAB', name: 'Habacuc' },
    { code: 'ZEP', name: 'Sofonías' },
    { code: 'HAG', name: 'Hageo' },
    { code: 'ZEC', name: 'Zacarías' },
    { code: 'MAL', name: 'Malaquías' },
    { code: 'MAT', name: 'San Mateo' },
    { code: 'MRK', name: 'San Marcos' },
    { code: 'LUK', name: 'San Lucas' },
    { code: 'JHN', name: 'San Juan' },
    { code: 'ACT', name: 'Hechos' },
    { code: 'ROM', name: 'Romanos' },
    { code: '1CO', name: '1 Corintios' },
    { code: '2CO', name: '2 Corintios' },
    { code: 'GAL', name: 'Gálatas' },
    { code: 'EPH', name: 'Efesios' },
    { code: 'PHP', name: 'Filipenses' },
    { code: 'COL', name: 'Colosenses' },
    { code: '1TH', name: '1 Tesalonicenses' },
    { code: '2TH', name: '2 Tesalonicenses' },
    { code: '1TI', name: '1 Timoteo' },
    { code: '2TI', name: '2 Timoteo' },
    { code: 'TIT', name: 'Tito' },
    { code: 'PHM', name: 'Filemón' },
    { code: 'HEB', name: 'Hebreos' },
    { code: 'JAS', name: 'Santiago' },
    { code: '1PE', name: '1 Pedro' },
    { code: '2PE', name: '2 Pedro' },
    { code: '1JN', name: '1 Juan' },
    { code: '2JN', name: '2 Juan' },
    { code: '3JN', name: '3 Juan' },
    { code: 'JUD', name: 'Judas' },
    { code: 'REV', name: 'Apocalipsis' }
];

// Inicializar select oculto con todas las opciones
function initializeBookSelect() {
    bookSelect.innerHTML = '';
    allBooks.forEach(book => {
        const option = document.createElement('option');
        option.value = book.code;
        option.textContent = book.name;
        bookSelect.appendChild(option);
    });
}

// Función de búsqueda
function searchBooks(query) {
    query = query.toLowerCase().trim();
    if (query === '') {
        return allBooks.slice(0, 10);
    }
    return allBooks.filter(book => {
        return book.name.toLowerCase().includes(query) ||
            book.code.toLowerCase().includes(query);
    }).slice(0, 10);
}

// Mostrar resultados de búsqueda
function showSearchResults(results) {
    bookDropdown.innerHTML = '';
    if (results.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No se encontraron libros';
        bookDropdown.appendChild(noResults);
    } else {
        results.forEach((book, index) => {
            const item = document.createElement('div');
            item.className = 'search-dropdown-item';
            if (index === 0) item.classList.add('active');
            item.innerHTML = `
                <strong>${book.name}</strong>
                <span style="float: right; opacity: 0.7; font-size: 11px;">${book.code}</span>
            `;
            item.addEventListener('click', () => selectBook(book));
            item.addEventListener('mouseenter', () => {
                document.querySelectorAll('.search-dropdown-item').forEach(el => {
                    el.classList.remove('active');
                });
                item.classList.add('active');
            });
            bookDropdown.appendChild(item);
        });
    }
    bookDropdown.classList.add('visible');
}

// Seleccionar un libro
function selectBook(book) {
    bookSearchInput.value = book.name;
    bookSelect.value = book.code;
    currentBook = book.code;
    bookDropdown.classList.remove('visible');
    currentChapter = 1;
    currentVerse = 1;
    chapterInput.value = currentChapter;
    verseInput.value = currentVerse;
    updateButtonStates();
    updatePreview();
    saveState();
    bookSelect.dispatchEvent(new Event('change'));
    if (isVisible) {
        loadAndShowVerse();
    }
}

// Navegación con teclado en el dropdown
function handleKeyboardNavigation(e) {
    if (!bookDropdown.classList.contains('visible')) return;
    const items = bookDropdown.querySelectorAll('.search-dropdown-item');
    if (items.length === 0) return;
    let activeIndex = -1;
    items.forEach((item, index) => {
        if (item.classList.contains('active')) {
            activeIndex = index;
        }
    });
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (activeIndex < items.length - 1) {
                items.forEach(item => item.classList.remove('active'));
                items[activeIndex + 1].classList.add('active');
                items[activeIndex + 1].scrollIntoView({ block: 'nearest' });
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (activeIndex > 0) {
                items.forEach(item => item.classList.remove('active'));
                items[activeIndex - 1].classList.add('active');
                items[activeIndex - 1].scrollIntoView({ block: 'nearest' });
            }
            break;
        case 'Enter':
            e.preventDefault();
            if (activeIndex >= 0) {
                const book = allBooks.find(b =>
                    b.name === items[activeIndex].querySelector('strong').textContent
                );
                if (book) selectBook(book);
            }
            break;
        case 'Escape':
            e.preventDefault();
            bookDropdown.classList.remove('visible');
            break;
    }
}

// Cargar estado guardado
function loadSavedState() {
    const savedState = localStorage.getItem('bibleControlState');
    const savedHistory = localStorage.getItem('bibleSearchHistory');
    if (savedState) {
        const state = JSON.parse(savedState);
        currentBook = state.book || 'GEN';
        currentChapter = state.chapter || 1;
        currentVerse = state.verse || 1;
        isVisible = state.visible || false;
        bookSelect.value = currentBook;
        const currentBookData = allBooks.find(b => b.code === currentBook);
        if (currentBookData) {
            bookSearchInput.value = currentBookData.name;
        }
        chapterInput.value = currentChapter;
        verseInput.value = currentVerse;
        visibilityToggle.checked = isVisible;
        updatePreview();
        updateButtonStates();
        if (isVisible) {
            loadAndShowVerse();
        }
    }
    if (savedHistory) {
        searchHistory = JSON.parse(savedHistory);
        renderHistory();
    }
}

// Guardar estado actual
function saveState() {
    const state = {
        book: currentBook,
        chapter: currentChapter,
        verse: currentVerse,
        visible: isVisible
    };
    localStorage.setItem('bibleControlState', JSON.stringify(state));
}

// Guardar historial
function saveHistory() {
    localStorage.setItem('bibleSearchHistory', JSON.stringify(searchHistory));
}

// Añadir al historial
function addToHistory(bookId, chapter, verse, content, reference) {
    const historyItem = {
        id: `${bookId}-${chapter}-${verse}`,
        book: bookId,
        chapter: chapter,
        verse: verse,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        reference: reference,
        timestamp: Date.now()
    };
    const existingIndex = searchHistory.findIndex(item => item.id === historyItem.id);
    if (existingIndex !== -1) {
        searchHistory.splice(existingIndex, 1);
    }
    searchHistory.unshift(historyItem);
    if (searchHistory.length > 10) {
        searchHistory.pop();
    }
    renderHistory();
    saveHistory();
}

// Renderizar historial
function renderHistory() {
    historyList.innerHTML = '';
    searchHistory.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        if (index === 0) li.classList.add('active');
        li.innerHTML = `
            <div class="verse-ref">${item.reference}</div>
            <div class="verse-text">${item.content}</div>
        `;
        li.addEventListener('click', () => loadFromHistory(item));
        historyList.appendChild(li);
    });
    if (searchHistory.length === 0) {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = '<div class="verse-text" style="opacity: 0.7; text-align: center;">No hay búsquedas recientes</div>';
        historyList.appendChild(li);
    }
}

// Cargar desde historial
function loadFromHistory(item) {
    currentBook = item.book;
    currentChapter = item.chapter;
    currentVerse = item.verse;
    bookSelect.value = currentBook;
    chapterInput.value = currentChapter;
    verseInput.value = currentVerse;
    const existingIndex = searchHistory.findIndex(h => h.id === item.id);
    if (existingIndex !== -1) {
        const [removed] = searchHistory.splice(existingIndex, 1);
        searchHistory.unshift(removed);
        renderHistory();
        saveHistory();
    }
    updatePreview();
    updateButtonStates();
    saveState();
    if (isVisible) {
        loadAndShowVerse();
    }
}

// Obtener el número de versículos de un capítulo
async function getVerseCount(bookId, chapterNumber) {
    const cacheKey = `${bookId}-${chapterNumber}`;
    if (verseCountCache[cacheKey]) {
        return verseCountCache[cacheKey];
    }
    try {
        const response = await fetch(`https://biblia-api.qhar.in/book/${bookId}/chapter/${chapterNumber}/verse`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const versesData = await response.json();
        const verseCount = versesData.length;
        verseCountCache[cacheKey] = verseCount;
        return verseCount;
    } catch (error) {
        console.error('Error al obtener el número de versículos:', error);
        return 30;
    }
}

// Actualizar estado de los botones de navegación
async function updateButtonStates() {
    const isFirstBook = currentBook === 'GEN';
    const isFirstChapter = currentChapter === 1;
    const isFirstVerse = currentVerse === 1;
    const isLastBook = currentBook === 'REV';
    const isLastChapter = currentChapter === bookChapters['REV'];
    const verseCount = await getVerseCount(currentBook, currentChapter);
    const isLastVerse = currentVerse === verseCount;
    prevVerseBtn.disabled = isFirstBook && isFirstChapter && isFirstVerse;
    nextVerseBtn.disabled = isLastBook && isLastChapter && isLastVerse;
}

// Actualizar vista previa
async function updatePreview() {
    try {
        const response = await fetch(`https://biblia-api.qhar.in/book/${currentBook}/chapter/${currentChapter}/verse/${currentVerse}`);
        if (response.ok) {
            const verseData = await response.json();
            if (verseData && verseData.length > 0) {
                let cleanedContent = verseData[0].content.trim();
                const closingBracketIndex = cleanedContent.indexOf(']');
                if (closingBracketIndex !== -1) {
                    cleanedContent = cleanedContent.substring(closingBracketIndex + 1).trim();
                }
                cleanedContent = cleanedContent.replace(/\s+/g, ' ');
                const previewText = cleanedContent.substring(0, 100) + (cleanedContent.length > 100 ? '...' : '');
                previewCurrent.querySelector('.verse-text').textContent = previewText;
                previewCurrent.querySelector('.verse-ref').textContent = `Actual: ${verseData[0].reference}`;
            }
        }
    } catch (error) {
        console.error('Error al cargar vista previa actual:', error);
        previewCurrent.querySelector('.verse-text').textContent = 'Error al cargar el versículo';
        previewCurrent.querySelector('.verse-ref').textContent = 'Actual: Error';
    }
}

// Función para enviar comandos al visualizador
function sendCommand(command) {
    localStorage.setItem('bibleVerseCommand', JSON.stringify(command));
    window.dispatchEvent(new Event('storage'));
}

// Navegar al versículo anterior
async function goToPreviousVerse() {
    if (currentVerse > 1) {
        currentVerse--;
    } else if (currentChapter > 1) {
        currentChapter--;
        const verseCount = await getVerseCount(currentBook, currentChapter);
        currentVerse = verseCount;
    } else {
        const currentBookIndex = bookOrder.indexOf(currentBook);
        if (currentBookIndex > 0) {
            currentBook = bookOrder[currentBookIndex - 1];
            bookSelect.value = currentBook;
            currentChapter = bookChapters[currentBook];
            const verseCount = await getVerseCount(currentBook, currentChapter);
            currentVerse = verseCount;
        }
    }
    chapterInput.value = currentChapter;
    verseInput.value = currentVerse;
    updateButtonStates();
    updatePreview();
    saveState();
    if (isVisible) {
        loadAndShowVerse();
    }
}

// Navegar al versículo siguiente
async function goToNextVerse() {
    const verseCount = await getVerseCount(currentBook, currentChapter);
    if (currentVerse < verseCount) {
        currentVerse++;
    } else if (currentChapter < bookChapters[currentBook]) {
        currentChapter++;
        currentVerse = 1;
    } else {
        const currentBookIndex = bookOrder.indexOf(currentBook);
        if (currentBookIndex < bookOrder.length - 1) {
            currentBook = bookOrder[currentBookIndex + 1];
            bookSelect.value = currentBook;
            currentChapter = 1;
            currentVerse = 1;
        }
    }
    chapterInput.value = currentChapter;
    verseInput.value = currentVerse;
    updateButtonStates();
    updatePreview();
    saveState();
    if (isVisible) {
        loadAndShowVerse();
    }
}

// Formatear contenido del versículo
function formatVerseContent(content) {
    if (!content) return 'Texto no disponible';
    let cleanedContent = content.trim();
    const closingBracketIndex = cleanedContent.indexOf(']');
    if (closingBracketIndex !== -1) {
        cleanedContent = cleanedContent.substring(closingBracketIndex + 1).trim();
    }
    cleanedContent = cleanedContent.replace(/\s+/g, ' ');
    return `<div style="font-size: 1.8rem; line-height: 1.6; text-align: left; font-family: 'Merriweather', serif;">${cleanedContent}</div>`;
}

// Cargar y mostrar el versículo actual
async function loadAndShowVerse() {
    const bookId = bookSelect.value || currentBook;
    const chapterNumber = chapterInput.value || currentChapter;
    const verseNumber = verseInput.value || currentVerse;
    if (!bookId || !chapterNumber || !verseNumber) {
        return;
    }
    try {
        const response = await fetch(`https://biblia-api.qhar.in/book/${bookId}/chapter/${chapterNumber}/verse/${verseNumber}`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const verseData = await response.json();
        if (!verseData || verseData.length === 0) {
            throw new Error('No se encontró el versículo');
        }
        const cleanContent = formatVerseContent(verseData[0].content);
        sendCommand({
            action: 'load',
            book: bookId,
            chapter: chapterNumber,
            verse: verseNumber,
            content: cleanContent,
            reference: verseData[0].reference,
            show: true
        });
        currentBook = bookId;
        currentChapter = parseInt(chapterNumber);
        currentVerse = parseInt(verseNumber);
        addToHistory(bookId, chapterNumber, verseNumber, cleanContent.replace(/<[^>]*>/g, ''), verseData[0].reference);
        updatePreview();
        saveState();
    } catch (error) {
        console.error('Error al cargar el versículo:', error);
    }
}

// Alternar visibilidad
function toggleVisibility() {
    isVisible = visibilityToggle.checked;
    if (isVisible) {
        loadAndShowVerse();
    } else {
        sendCommand({ action: 'hide' });
    }
    saveState();
}

// Configurar event listeners
document.addEventListener('DOMContentLoaded', function () {
    initializeBookSelect();
    loadSavedState();
    prevVerseBtn.addEventListener('click', goToPreviousVerse);
    nextVerseBtn.addEventListener('click', goToNextVerse);
    visibilityToggle.addEventListener('change', toggleVisibility);

    // Eventos para búsqueda de libros
    bookSearchInput.addEventListener('input', function () {
        const results = searchBooks(this.value);
        showSearchResults(results);
    });
    bookSearchInput.addEventListener('focus', function () {
        if (this.value === '') {
            const results = searchBooks('');
            showSearchResults(results);
        }
    });
    bookSearchInput.addEventListener('keydown', handleKeyboardNavigation);
    document.addEventListener('click', function (e) {
        if (!bookSearchInput.contains(e.target) && !bookDropdown.contains(e.target)) {
            bookDropdown.classList.remove('visible');
        }
    });

    // Eventos para cambios en select e inputs
    bookSelect.addEventListener('change', function () {
        currentBook = this.value;
        currentChapter = 1;
        currentVerse = 1;
        chapterInput.value = currentChapter;
        verseInput.value = currentVerse;
        updateButtonStates();
        updatePreview();
        saveState();
        const currentBookData = allBooks.find(b => b.code === currentBook);
        if (currentBookData) {
            bookSearchInput.value = currentBookData.name;
        }
        if (isVisible) {
            loadAndShowVerse();
        }
    });

    chapterInput.addEventListener('change', function () {
        currentChapter = Math.max(1, parseInt(this.value) || 1);
        currentVerse = 1;
        verseInput.value = currentVerse;
        updateButtonStates();
        updatePreview();
        saveState();
        if (isVisible) {
            loadAndShowVerse();
        }
    });

    verseInput.addEventListener('change', function () {
        currentVerse = Math.max(1, parseInt(this.value) || 1);
        updateButtonStates();
        updatePreview();
        saveState();
        if (isVisible) {
            loadAndShowVerse();
        }
    });
});