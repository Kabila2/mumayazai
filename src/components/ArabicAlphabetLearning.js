import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import './ArabicAlphabetLearning.css';

const arabicAlphabet = [
  { letter: 'ا', name: 'ألف', pronunciation: 'alif', english: 'A', word: 'أسد', wordMeaning: 'lion', category: 'vowel' },
  { letter: 'ب', name: 'باء', pronunciation: 'baa', english: 'B', word: 'بطة', wordMeaning: 'duck', category: 'consonant' },
  { letter: 'ت', name: 'تاء', pronunciation: 'taa', english: 'T', word: 'تفاحة', wordMeaning: 'apple', category: 'consonant' },
  { letter: 'ث', name: 'ثاء', pronunciation: 'thaa', english: 'Th', word: 'ثلج', wordMeaning: 'snow', category: 'consonant' },
  { letter: 'ج', name: 'جيم', pronunciation: 'jeem', english: 'J', word: 'جمل', wordMeaning: 'camel', category: 'consonant' },
  { letter: 'ح', name: 'حاء', pronunciation: 'haa', english: 'H', word: 'حصان', wordMeaning: 'horse', category: 'consonant' },
  { letter: 'خ', name: 'خاء', pronunciation: 'khaa', english: 'Kh', word: 'خروف', wordMeaning: 'sheep', category: 'consonant' },
  { letter: 'د', name: 'دال', pronunciation: 'daal', english: 'D', word: 'دب', wordMeaning: 'bear', category: 'consonant' },
  { letter: 'ذ', name: 'ذال', pronunciation: 'dhaal', english: 'Dh', word: 'ذئب', wordMeaning: 'wolf', category: 'consonant' },
  { letter: 'ر', name: 'راء', pronunciation: 'raa', english: 'R', word: 'رقم', wordMeaning: 'number', category: 'consonant' },
  { letter: 'ز', name: 'زاي', pronunciation: 'zaay', english: 'Z', word: 'زهرة', wordMeaning: 'flower', category: 'consonant' },
  { letter: 'س', name: 'سين', pronunciation: 'seen', english: 'S', word: 'سمك', wordMeaning: 'fish', category: 'consonant' },
  { letter: 'ش', name: 'شين', pronunciation: 'sheen', english: 'Sh', word: 'شمس', wordMeaning: 'sun', category: 'consonant' },
  { letter: 'ص', name: 'صاد', pronunciation: 'saad', english: 'S', word: 'صقر', wordMeaning: 'falcon', category: 'consonant' },
  { letter: 'ض', name: 'ضاد', pronunciation: 'daad', english: 'D', word: 'ضفدع', wordMeaning: 'frog', category: 'consonant' },
  { letter: 'ط', name: 'طاء', pronunciation: 'taa', english: 'T', word: 'طائر', wordMeaning: 'bird', category: 'consonant' },
  { letter: 'ظ', name: 'ظاء', pronunciation: 'dhaa', english: 'Dh', word: 'ظبي', wordMeaning: 'deer', category: 'consonant' },
  { letter: 'ع', name: 'عين', pronunciation: 'ayn', english: 'A', word: 'عين', wordMeaning: 'eye', category: 'consonant' },
  { letter: 'غ', name: 'غين', pronunciation: 'ghayn', english: 'Gh', word: 'غراب', wordMeaning: 'crow', category: 'consonant' },
  { letter: 'ف', name: 'فاء', pronunciation: 'faa', english: 'F', word: 'فيل', wordMeaning: 'elephant', category: 'consonant' },
  { letter: 'ق', name: 'قاف', pronunciation: 'qaaf', english: 'Q', word: 'قطة', wordMeaning: 'cat', category: 'consonant' },
  { letter: 'ك', name: 'كاف', pronunciation: 'kaaf', english: 'K', word: 'كلب', wordMeaning: 'dog', category: 'consonant' },
  { letter: 'ل', name: 'لام', pronunciation: 'laam', english: 'L', word: 'ليمون', wordMeaning: 'lemon', category: 'consonant' },
  { letter: 'م', name: 'ميم', pronunciation: 'meem', english: 'M', word: 'ماء', wordMeaning: 'water', category: 'consonant' },
  { letter: 'ن', name: 'نون', pronunciation: 'noon', english: 'N', word: 'نمر', wordMeaning: 'tiger', category: 'consonant' },
  { letter: 'ه', name: 'هاء', pronunciation: 'haa', english: 'H', word: 'هدية', wordMeaning: 'gift', category: 'consonant' },
  { letter: 'و', name: 'واو', pronunciation: 'waaw', english: 'W', word: 'وردة', wordMeaning: 'rose', category: 'vowel' },
  { letter: 'ي', name: 'ياء', pronunciation: 'yaa', english: 'Y', word: 'يد', wordMeaning: 'hand', category: 'vowel' }
];

const ArabicAlphabetLearning = ({ t, language, fontSize, highContrast, reducedMotion, speak }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWord, setShowWord] = useState(true);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'grid'
  const [recentLetters, setRecentLetters] = useState([]);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const currentLetter = arabicAlphabet[currentIndex];

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('arabic_alphabet_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    const savedRecent = localStorage.getItem('arabic_alphabet_recent');
    if (savedRecent) {
      setRecentLetters(JSON.parse(savedRecent));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('arabic_alphabet_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Track recent letters
  useEffect(() => {
    const letter = arabicAlphabet[currentIndex].letter;
    setRecentLetters(prev => {
      const updated = [letter, ...prev.filter(l => l !== letter)].slice(0, 5);
      localStorage.setItem('arabic_alphabet_recent', JSON.stringify(updated));
      return updated;
    });
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return; // Don't interfere with search input

      switch(e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextLetter();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousLetter();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setShowWord(true);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setShowWord(false);
          break;
        case ' ':
          e.preventDefault();
          setShowWord(prev => !prev);
          break;
        case 'f':
          e.preventDefault();
          toggleFavorite(currentIndex);
          break;
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  const toggleFavorite = (index) => {
    const letter = arabicAlphabet[index].letter;
    setFavorites(prev =>
      prev.includes(letter)
        ? prev.filter(l => l !== letter)
        : [...prev, letter]
    );
  };

  // Handle scroll indicator
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (container) {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // Show scroll indicator if content is scrollable and not at bottom
        const isScrollable = scrollHeight > clientHeight;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

        setShowScrollIndicator(isScrollable && !isAtBottom);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Check initial state
      handleScroll();

      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentIndex, viewMode]);

  // Smooth scroll to bottom function
  const scrollToBottom = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleLetterClick = () => {
    setShowWord(prev => !prev);
  };

  const handleWordClick = () => {
    // Word click interaction - no voiceover
  };

  const nextLetter = () => {
    setCurrentIndex((prev) => (prev + 1) % arabicAlphabet.length);
  };

  const previousLetter = () => {
    setCurrentIndex((prev) => (prev - 1 + arabicAlphabet.length) % arabicAlphabet.length);
  };

  // Filter letters based on search
  const filteredLetters = arabicAlphabet.filter(letter =>
    letter.letter.includes(searchQuery) ||
    letter.name.includes(searchQuery) ||
    letter.pronunciation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.word.includes(searchQuery) ||
    letter.wordMeaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isFavorite = favorites.includes(currentLetter.letter);

  return (
    <div className="arabic-alphabet-learning" ref={containerRef}>
      <div className="learning-header">
        <h2 className="learning-title">
          {language === 'ar' ? 'تعلم الحروف العربية' : 'Learn Arabic Alphabet'}
        </h2>

        {/* View Mode Toggle */}
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => setViewMode('card')}
            title={language === 'ar' ? 'عرض البطاقات' : 'Card View'}
          >
            📇
          </button>
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title={language === 'ar' ? 'عرض الشبكة' : 'Grid View'}
          >
            ▦
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <motion.div
        className="search-container"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <input
          ref={searchInputRef}
          type="text"
          className="search-input"
          placeholder={language === 'ar' ? 'ابحث عن حرف... (اضغط / للبحث)' : 'Search letters... (Press / to search)'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </motion.div>

      {/* Quick Access: Favorites and Recent */}
      {(favorites.length > 0 || recentLetters.length > 0) && !searchQuery && (
        <motion.div
          className="quick-access"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {favorites.length > 0 && (
            <div className="quick-section">
              <div className="quick-label">
                {language === 'ar' ? '⭐ المفضلة' : '⭐ Favorites'}
              </div>
              <div className="quick-letters">
                {favorites.map(favLetter => {
                  const index = arabicAlphabet.findIndex(l => l.letter === favLetter);
                  return index !== -1 ? (
                    <button
                      key={favLetter}
                      className={`quick-letter ${index === currentIndex ? 'active' : ''}`}
                      onClick={() => setCurrentIndex(index)}
                    >
                      {favLetter}
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {recentLetters.length > 0 && (
            <div className="quick-section">
              <div className="quick-label">
                {language === 'ar' ? '🕐 الأخيرة' : '🕐 Recent'}
              </div>
              <div className="quick-letters">
                {recentLetters.map(recentLetter => {
                  const index = arabicAlphabet.findIndex(l => l.letter === recentLetter);
                  return index !== -1 ? (
                    <button
                      key={recentLetter}
                      className={`quick-letter ${index === currentIndex ? 'active' : ''}`}
                      onClick={() => setCurrentIndex(index)}
                    >
                      {recentLetter}
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {viewMode === 'card' ? (
        <>
          {/* Card View */}
          <div className="letter-container">
            <motion.div
              key={currentIndex}
              className="letter-card"
              initial={{ scale: 0.9, opacity: 0, rotateY: -20 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 0.4, type: "spring" }}
            >
              {/* Favorite Button */}
              <button
                className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                onClick={() => toggleFavorite(currentIndex)}
                title={language === 'ar' ? (isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة') : (isFavorite ? 'Remove from favorites' : 'Add to favorites')}
              >
                {isFavorite ? '⭐' : '☆'}
              </button>

              <div className="letter-display" onClick={handleLetterClick}>
                <motion.div
                  className="arabic-letter"
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {currentLetter.letter}
                </motion.div>
                <div className="letter-name">{currentLetter.name}</div>
                <div className="letter-pronunciation">
                  {language === 'ar' ? currentLetter.pronunciation : `(${currentLetter.pronunciation})`}
                </div>
                <div className="letter-category-badge">
                  {currentLetter.category === 'vowel' ? '🔵' : '🟢'} {currentLetter.category}
                </div>
              </div>

              <div className="letter-info">
                <div className="english-equivalent">
                  {language === 'ar' ? 'بالإنجليزية' : 'English'}: <strong>{currentLetter.english}</strong>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {showWord && (
                  <motion.div
                    className="word-section"
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="word-label">
                      {language === 'ar' ? '📝 مثال' : '📝 Example'}
                    </div>
                    <div className="word-display" onClick={handleWordClick}>
                      <div className="arabic-word">{currentLetter.word}</div>
                      <div className="word-meaning">
                        {language === 'ar' ? currentLetter.wordMeaning : `(${currentLetter.wordMeaning})`}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Navigation Controls */}
          <div className="navigation-controls">
            <motion.button
              className="nav-btn prev"
              onClick={previousLetter}
              whileHover={{ scale: 1.1, x: -3 }}
              whileTap={{ scale: 0.9 }}
            >
              {language === 'ar' ? '→' : '←'}
            </motion.button>

            <div className="progress-section">
              <div className="progress-indicator">
                {currentIndex + 1} / {arabicAlphabet.length}
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / arabicAlphabet.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <motion.button
              className="nav-btn next"
              onClick={nextLetter}
              whileHover={{ scale: 1.1, x: 3 }}
              whileTap={{ scale: 0.9 }}
            >
              {language === 'ar' ? '←' : '→'}
            </motion.button>
          </div>
        </>
      ) : null}

      {/* Alphabet Grid */}
      <motion.div
        className="alphabet-grid-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {!searchQuery && viewMode === 'card' && (
          <div className="grid-header">
            {language === 'ar' ? '🔤 جميع الحروف' : '🔤 All Letters'}
          </div>
        )}
        <div className={`alphabet-grid ${viewMode === 'grid' ? 'grid-view-mode' : ''}`}>
          {filteredLetters.map((letter, index) => {
            const actualIndex = arabicAlphabet.indexOf(letter);
            const isActive = actualIndex === currentIndex;
            const isFav = favorites.includes(letter.letter);

            return (
              <motion.button
                key={actualIndex}
                className={`alphabet-item ${isActive ? 'active' : ''} ${isFav ? 'favorite' : ''}`}
                onClick={() => {
                  setCurrentIndex(actualIndex);
                  if (viewMode === 'grid') {
                    setShowWord(true);
                  }
                }}
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
              >
                {isFav && <span className="fav-badge">⭐</span>}
                <div className="letter-main">{letter.letter}</div>
                {viewMode === 'grid' && (
                  <div className="letter-details">
                    <div className="letter-name-small">{letter.name}</div>
                    <div className="letter-english-small">{letter.english}</div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {searchQuery && filteredLetters.length === 0 && (
          <div className="no-results">
            {language === 'ar' ? '😕 لم يتم العثور على نتائج' : '😕 No results found'}
          </div>
        )}
      </motion.div>

      {/* Keyboard Shortcuts Help */}
      <motion.div
        className="keyboard-hints"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1 }}
      >
        <div className="hint">
          {language === 'ar' ? '⌨️ ← → التنقل' : '⌨️ ← → Navigate'}
        </div>
        <div className="hint">
          {language === 'ar' ? 'Space عرض المثال' : 'Space Toggle Example'}
        </div>
        <div className="hint">
          {language === 'ar' ? 'F مفضلة' : 'F Favorite'}
        </div>
      </motion.div>

      {/* Scroll Down Indicator */}
      <AnimatePresence>
        {showScrollIndicator && (
          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToBottom}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <div className="scroll-arrow">
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ↓
              </motion.div>
            </div>
            <div className="scroll-text">
              {language === 'ar' ? 'مرر للأسفل' : 'Scroll down'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArabicAlphabetLearning;