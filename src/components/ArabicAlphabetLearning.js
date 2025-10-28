import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import './ArabicAlphabetLearning.css';

const arabicAlphabet = [
  { letter: 'ا', name: 'ألف', pronunciation: 'alif', english: 'A', word: 'أسد', wordMeaning: 'lion' },
  { letter: 'ب', name: 'باء', pronunciation: 'baa', english: 'B', word: 'بطة', wordMeaning: 'duck' },
  { letter: 'ت', name: 'تاء', pronunciation: 'taa', english: 'T', word: 'تفاحة', wordMeaning: 'apple' },
  { letter: 'ث', name: 'ثاء', pronunciation: 'thaa', english: 'Th', word: 'ثلج', wordMeaning: 'snow' },
  { letter: 'ج', name: 'جيم', pronunciation: 'jeem', english: 'J', word: 'جمل', wordMeaning: 'camel' },
  { letter: 'ح', name: 'حاء', pronunciation: 'haa', english: 'H', word: 'حصان', wordMeaning: 'horse' },
  { letter: 'خ', name: 'خاء', pronunciation: 'khaa', english: 'Kh', word: 'خروف', wordMeaning: 'sheep' },
  { letter: 'د', name: 'دال', pronunciation: 'daal', english: 'D', word: 'دب', wordMeaning: 'bear' },
  { letter: 'ذ', name: 'ذال', pronunciation: 'dhaal', english: 'Dh', word: 'ذئب', wordMeaning: 'wolf' },
  { letter: 'ر', name: 'راء', pronunciation: 'raa', english: 'R', word: 'رقم', wordMeaning: 'number' },
  { letter: 'ز', name: 'زاي', pronunciation: 'zaay', english: 'Z', word: 'زهرة', wordMeaning: 'flower' },
  { letter: 'س', name: 'سين', pronunciation: 'seen', english: 'S', word: 'سمك', wordMeaning: 'fish' },
  { letter: 'ش', name: 'شين', pronunciation: 'sheen', english: 'Sh', word: 'شمس', wordMeaning: 'sun' },
  { letter: 'ص', name: 'صاد', pronunciation: 'saad', english: 'S', word: 'صقر', wordMeaning: 'falcon' },
  { letter: 'ض', name: 'ضاد', pronunciation: 'daad', english: 'D', word: 'ضفدع', wordMeaning: 'frog' },
  { letter: 'ط', name: 'طاء', pronunciation: 'taa', english: 'T', word: 'طائر', wordMeaning: 'bird' },
  { letter: 'ظ', name: 'ظاء', pronunciation: 'dhaa', english: 'Dh', word: 'ظبي', wordMeaning: 'deer' },
  { letter: 'ع', name: 'عين', pronunciation: 'ayn', english: 'A', word: 'عين', wordMeaning: 'eye' },
  { letter: 'غ', name: 'غين', pronunciation: 'ghayn', english: 'Gh', word: 'غراب', wordMeaning: 'crow' },
  { letter: 'ف', name: 'فاء', pronunciation: 'faa', english: 'F', word: 'فيل', wordMeaning: 'elephant' },
  { letter: 'ق', name: 'قاف', pronunciation: 'qaaf', english: 'Q', word: 'قطة', wordMeaning: 'cat' },
  { letter: 'ك', name: 'كاف', pronunciation: 'kaaf', english: 'K', word: 'كلب', wordMeaning: 'dog' },
  { letter: 'ل', name: 'لام', pronunciation: 'laam', english: 'L', word: 'ليمون', wordMeaning: 'lemon' },
  { letter: 'م', name: 'ميم', pronunciation: 'meem', english: 'M', word: 'ماء', wordMeaning: 'water' },
  { letter: 'ن', name: 'نون', pronunciation: 'noon', english: 'N', word: 'نمر', wordMeaning: 'tiger' },
  { letter: 'ه', name: 'هاء', pronunciation: 'haa', english: 'H', word: 'هدية', wordMeaning: 'gift' },
  { letter: 'و', name: 'واو', pronunciation: 'waaw', english: 'W', word: 'وردة', wordMeaning: 'rose' },
  { letter: 'ي', name: 'ياء', pronunciation: 'yaa', english: 'Y', word: 'يد', wordMeaning: 'hand' }
];

const ArabicAlphabetLearning = ({ t, language, fontSize, highContrast, reducedMotion, speak }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWord, setShowWord] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const containerRef = useRef(null);

  const currentLetter = arabicAlphabet[currentIndex];

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
  }, [currentIndex]);

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
    // Letter click interaction - no voiceover
  };

  const handleWordClick = () => {
    // Word click interaction - no voiceover
  };

  const nextLetter = () => {
    setCurrentIndex((prev) => (prev + 1) % arabicAlphabet.length);
    setShowWord(false);
  };

  const previousLetter = () => {
    setCurrentIndex((prev) => (prev - 1 + arabicAlphabet.length) % arabicAlphabet.length);
    setShowWord(false);
  };

  return (
    <div className="arabic-alphabet-learning" ref={containerRef}>
      <div className="learning-header">
        <h2 className="learning-title">
          {language === 'ar' ? 'تعلم الحروف العربية' : 'Learn Arabic Alphabet'}
        </h2>
      </div>

      <div className="letter-container">
        <motion.div
          className="letter-card"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="letter-display" onClick={handleLetterClick}>
            <div className="arabic-letter">{currentLetter.letter}</div>
            <div className="letter-name">{currentLetter.name}</div>
            <div className="letter-pronunciation">
              {language === 'ar' ? currentLetter.pronunciation : `(${currentLetter.pronunciation})`}
            </div>
          </div>

          <div className="letter-info">
            <div className="english-equivalent">
              {language === 'ar' ? 'بالإنجليزية' : 'English'}: {currentLetter.english}
            </div>
          </div>

          <motion.div
            className="word-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              className="word-button"
              onClick={() => setShowWord(!showWord)}
            >
              {language === 'ar' ? 'مثال على الحرف' : 'Example Word'}
            </button>

            <AnimatePresence>
              {showWord && (
                <motion.div
                  className="word-display"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={handleWordClick}
                >
                  <div className="arabic-word">{currentLetter.word}</div>
                  <div className="word-meaning">
                    {language === 'ar' ? currentLetter.wordMeaning : `(${currentLetter.wordMeaning})`}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      <div className="navigation-controls">
        <button className="nav-btn prev" onClick={previousLetter}>
          {language === 'ar' ? '→' : '←'}
        </button>

        <div className="progress-indicator">
          {currentIndex + 1} / {arabicAlphabet.length}
        </div>

        <button className="nav-btn next" onClick={nextLetter}>
          {language === 'ar' ? '←' : '→'}
        </button>
      </div>

      <div className="alphabet-grid">
        {arabicAlphabet.map((letter, index) => (
          <button
            key={index}
            className={`alphabet-item ${index === currentIndex ? 'active' : ''}`}
            onClick={() => {
              setCurrentIndex(index);
              setShowWord(false);
            }}
          >
            {letter.letter}
          </button>
        ))}
      </div>

      {/* Scroll Down Indicator */}
      <AnimatePresence>
        {showScrollIndicator && (
          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToBottom}
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