import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import './ArabicColorsLearning.css';

const arabicColors = [
  {
    arabic: 'أحمر',
    english: 'Red',
    pronunciation: 'ahmar',
    pastelHex: '#ffb3ba',
    darkHex: '#ff8a95',
    objects: ['تفاحة', 'وردة', 'فراولة'],
    objectsEnglish: ['apple', 'rose', 'strawberry']
  },
  {
    arabic: 'أزرق',
    english: 'Blue',
    pronunciation: 'azraq',
    pastelHex: '#bae1ff',
    darkHex: '#87ceeb',
    objects: ['سماء', 'بحر', 'طائر'],
    objectsEnglish: ['sky', 'sea', 'bird']
  },
  {
    arabic: 'أخضر',
    english: 'Green',
    pronunciation: 'akhdar',
    pastelHex: '#baffc9',
    darkHex: '#98fb98',
    objects: ['شجرة', 'عشب', 'خضار'],
    objectsEnglish: ['tree', 'grass', 'vegetables']
  },
  {
    arabic: 'أصفر',
    english: 'Yellow',
    pronunciation: 'asfar',
    pastelHex: '#ffffba',
    darkHex: '#f0e68c',
    objects: ['شمس', 'ليمون', 'موز'],
    objectsEnglish: ['sun', 'lemon', 'banana']
  },
  {
    arabic: 'بنفسجي',
    english: 'Purple',
    pronunciation: 'banafsaji',
    pastelHex: '#e1baff',
    darkHex: '#dda0dd',
    objects: ['عنب', 'زهرة', 'فراشة'],
    objectsEnglish: ['grapes', 'flower', 'butterfly']
  },
  {
    arabic: 'وردي',
    english: 'Pink',
    pronunciation: 'wardi',
    pastelHex: '#ffb3e6',
    darkHex: '#ffc0cb',
    objects: ['وردة', 'فستان', 'حلوى'],
    objectsEnglish: ['rose', 'dress', 'candy']
  },
  {
    arabic: 'برتقالي',
    english: 'Orange',
    pronunciation: 'burtuqali',
    pastelHex: '#ffd9b3',
    darkHex: '#ffa07a',
    objects: ['برتقال', 'جزر', 'قرع'],
    objectsEnglish: ['orange', 'carrot', 'pumpkin']
  },
  {
    arabic: 'بني',
    english: 'Brown',
    pronunciation: 'bunni',
    pastelHex: '#d4c4a8',
    darkHex: '#d2b48c',
    objects: ['شجرة', 'شوكولاتة', 'أرض'],
    objectsEnglish: ['tree', 'chocolate', 'earth']
  },
  {
    arabic: 'أبيض',
    english: 'White',
    pronunciation: 'abyad',
    pastelHex: '#f8f8ff',
    darkHex: '#f5f5f5',
    objects: ['ثلج', 'حليب', 'سحاب'],
    objectsEnglish: ['snow', 'milk', 'cloud']
  },
  {
    arabic: 'أسود',
    english: 'Black',
    pronunciation: 'aswad',
    pastelHex: '#696969',
    darkHex: '#2f2f2f',
    objects: ['ليل', 'فحم', 'قط'],
    objectsEnglish: ['night', 'coal', 'cat']
  },
  {
    arabic: 'رمادي',
    english: 'Gray',
    pronunciation: 'ramadi',
    pastelHex: '#d3d3d3',
    darkHex: '#a9a9a9',
    objects: ['سحاب', 'فيل', 'حجر'],
    objectsEnglish: ['cloud', 'elephant', 'stone']
  },
  {
    arabic: 'ذهبي',
    english: 'Gold',
    pronunciation: 'dhahabi',
    pastelHex: '#f0e68c',
    darkHex: '#ffd700',
    objects: ['ذهب', 'تاج', 'شمس'],
    objectsEnglish: ['gold', 'crown', 'sun']
  }
];

const ArabicColorsLearning = ({ t, language, fontSize, highContrast, reducedMotion, speak }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameMode, setGameMode] = useState('learn'); // 'learn', 'quiz', 'match'
  const [score, setScore] = useState(0);
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showObjects, setShowObjects] = useState(false);
  const [matchingPairs, setMatchingPairs] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const containerRef = useRef(null);

  const currentColor = arabicColors[currentIndex];

  useEffect(() => {
    if (gameMode === 'quiz') {
      generateQuizOptions();
    } else if (gameMode === 'match') {
      generateMatchingGame();
    }
  }, [currentIndex, gameMode]);

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
  }, [gameMode, currentIndex]);

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

  const generateQuizOptions = () => {
    const correct = currentColor;
    const incorrectOptions = arabicColors
      .filter((_, index) => index !== currentIndex)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [correct, ...incorrectOptions].sort(() => Math.random() - 0.5);
    setQuizOptions(options);
  };

  const generateMatchingGame = () => {
    const selectedColors = arabicColors.slice(0, 6).sort(() => Math.random() - 0.5);
    const pairs = [];

    selectedColors.forEach((color, index) => {
      pairs.push(
        { id: `arabic-${index}`, type: 'arabic', content: color.arabic, color: color, matched: false },
        { id: `english-${index}`, type: 'english', content: color.english, color: color, matched: false }
      );
    });

    setMatchingPairs(pairs.sort(() => Math.random() - 0.5));
    setMatchedPairs([]);
    setSelectedCards([]);
  };

  const handleColorClick = () => {
    // Color click interaction - no voiceover
  };

  const handleObjectClick = (objectIndex) => {
    // Object click interaction - no voiceover
  };

  const nextColor = () => {
    setCurrentIndex((prev) => (prev + 1) % arabicColors.length);
    setShowObjects(false);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const previousColor = () => {
    setCurrentIndex((prev) => (prev - 1 + arabicColors.length) % arabicColors.length);
    setShowObjects(false);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleQuizAnswer = (option) => {
    setSelectedAnswer(option);
    setShowResult(true);

    if (option.arabic === currentColor.arabic) {
      setScore(prev => prev + 1);
    }
  };

  const handleCardClick = (card) => {
    if (card.matched || selectedCards.length >= 2) return;

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;

      if (first.color.arabic === second.color.arabic && first.type !== second.type) {
        // Match found
        setTimeout(() => {
          setMatchedPairs(prev => [...prev, first.id, second.id]);
          setSelectedCards([]);
          setScore(prev => prev + 1);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const switchMode = (mode) => {
    setGameMode(mode);
    setShowObjects(false);
    setSelectedAnswer(null);
    setShowResult(false);
    setSelectedCards([]);
    setMatchedPairs([]);
    if (mode !== 'learn') {
      setScore(0);
    }
  };

  const isCardSelected = (card) => selectedCards.some(selected => selected.id === card.id);
  const isCardMatched = (card) => matchedPairs.includes(card.id);

  return (
    <div className="arabic-colors-learning" ref={containerRef}>
      <div className="learning-header">
        <h2 className="learning-title">
          {language === 'ar' ? 'تعلم الألوان العربية' : 'Learn Arabic Colors'}
        </h2>

        <div className="mode-selector">
          <button
            className={`mode-btn ${gameMode === 'learn' ? 'active' : ''}`}
            onClick={() => switchMode('learn')}
          >
            {language === 'ar' ? 'تعلم' : 'Learn'}
          </button>
          <button
            className={`mode-btn ${gameMode === 'quiz' ? 'active' : ''}`}
            onClick={() => switchMode('quiz')}
          >
            {language === 'ar' ? 'اختبار' : 'Quiz'}
          </button>
          <button
            className={`mode-btn ${gameMode === 'match' ? 'active' : ''}`}
            onClick={() => switchMode('match')}
          >
            {language === 'ar' ? 'مطابقة' : 'Match'}
          </button>
        </div>

        {(gameMode === 'quiz' || gameMode === 'match') && (
          <div className="score-display">
            {language === 'ar' ? 'النقاط' : 'Score'}: {score}
          </div>
        )}
      </div>

      {gameMode === 'learn' && (
        <div className="color-container">
          <motion.div
            className="color-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="color-display"
              onClick={handleColorClick}
              style={{ backgroundColor: currentColor.pastelHex }}
            >
              <div className="color-swatch">
                <div
                  className="color-circle"
                  style={{ backgroundColor: currentColor.darkHex }}
                ></div>
              </div>

              <div className="color-info">
                <div className="arabic-color">{currentColor.arabic}</div>
                <div className="english-color">{currentColor.english}</div>
                <div className="color-pronunciation">
                  {language === 'ar' ? currentColor.pronunciation : `(${currentColor.pronunciation})`}
                </div>
              </div>
            </div>

            <motion.div
              className="objects-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                className="objects-button"
                onClick={() => setShowObjects(!showObjects)}
              >
                {language === 'ar' ? 'أشياء بهذا اللون' : 'Things with this color'}
              </button>

              <AnimatePresence>
                {showObjects && (
                  <motion.div
                    className="objects-display"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {currentColor.objects.map((object, index) => (
                      <div
                        key={index}
                        className="object-item"
                        onClick={() => handleObjectClick(index)}
                        style={{ borderColor: currentColor.darkHex }}
                      >
                        <div className="arabic-object">{object}</div>
                        <div className="english-object">
                          {currentColor.objectsEnglish[index]}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          <div className="navigation-controls">
            <button className="nav-btn prev" onClick={previousColor}>
              {language === 'ar' ? '→' : '←'}
            </button>

            <div className="progress-indicator">
              {currentIndex + 1} / {arabicColors.length}
            </div>

            <button className="nav-btn next" onClick={nextColor}>
              {language === 'ar' ? '←' : '→'}
            </button>
          </div>

          <div className="colors-grid">
            {arabicColors.map((color, index) => (
              <button
                key={index}
                className={`color-item ${index === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentIndex(index);
                  setShowObjects(false);
                }}
                style={{ backgroundColor: color.pastelHex }}
              >
                <div className="color-item-name">{color.arabic}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {gameMode === 'quiz' && (
        <div className="quiz-container">
          <div className="quiz-color-display">
            <div
              className="quiz-color-swatch"
              style={{ backgroundColor: currentColor.pastelHex }}
            >
              <div
                className="quiz-color-circle"
                style={{ backgroundColor: currentColor.darkHex }}
              ></div>
            </div>
          </div>

          <div className="quiz-question">
            {language === 'ar'
              ? 'ما هو اسم هذا اللون؟'
              : 'What is the name of this color?'
            }
          </div>

          <div className="quiz-options">
            {quizOptions.map((option, index) => (
              <button
                key={index}
                className={`quiz-option ${
                  selectedAnswer === option ?
                    (option.arabic === currentColor.arabic ? 'correct' : 'incorrect')
                    : ''
                }`}
                onClick={() => handleQuizAnswer(option)}
                disabled={showResult}
              >
                <span className="option-arabic">{option.arabic}</span>
                <span className="option-english">{option.english}</span>
              </button>
            ))}
          </div>

          {showResult && (
            <motion.div
              className="quiz-result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {selectedAnswer.arabic === currentColor.arabic ? (
                <div className="correct-answer">
                  ✓ {language === 'ar' ? 'إجابة صحيحة!' : 'Correct answer!'}
                </div>
              ) : (
                <div className="incorrect-answer">
                  ✗ {language === 'ar'
                    ? `الإجابة الصحيحة هي: ${currentColor.arabic}`
                    : `Correct answer is: ${currentColor.arabic}`
                  }
                </div>
              )}
            </motion.div>
          )}

          <div className="quiz-navigation">
            <button className="next-question-btn" onClick={nextColor}>
              {language === 'ar' ? 'السؤال التالي' : 'Next Question'}
            </button>
          </div>
        </div>
      )}

      {gameMode === 'match' && (
        <div className="matching-container">
          <div className="matching-instructions">
            {language === 'ar'
              ? 'اضغط على البطاقات لتجد التطابق بين اللون العربي والإنجليزي'
              : 'Click on cards to match Arabic and English color names'
            }
          </div>

          <div className="matching-grid">
            {matchingPairs.map((card) => (
              <motion.div
                key={card.id}
                className={`matching-card ${
                  isCardSelected(card) ? 'selected' : ''
                } ${isCardMatched(card) ? 'matched' : ''}`}
                onClick={() => handleCardClick(card)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  backgroundColor: isCardMatched(card) ? card.color.pastelHex : undefined,
                  borderColor: isCardSelected(card) ? card.color.darkHex : undefined
                }}
              >
                <div className="card-content">
                  {card.content}
                </div>
                {isCardMatched(card) && (
                  <div
                    className="card-color-indicator"
                    style={{ backgroundColor: card.color.darkHex }}
                  ></div>
                )}
              </motion.div>
            ))}
          </div>

          {matchedPairs.length === matchingPairs.length && matchingPairs.length > 0 && (
            <motion.div
              className="game-complete"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3>{language === 'ar' ? '🎉 أحسنت! لعبة مكتملة' : '🎉 Well done! Game complete'}</h3>
              <button
                className="play-again-btn"
                onClick={() => generateMatchingGame()}
              >
                {language === 'ar' ? 'العب مرة أخرى' : 'Play Again'}
              </button>
            </motion.div>
          )}
        </div>
      )}

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

export default ArabicColorsLearning;