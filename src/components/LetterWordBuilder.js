import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceOver } from '../hooks/useVoiceOver';
import CelebrationPopup from './CelebrationPopup';
import './LetterWordBuilder.css';

const LetterWordBuilder = ({ language, fontSize, highContrast }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [availableLetters, setAvailableLetters] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedWords, setCompletedWords] = useState([]);
  const [showCelebrationPopup, setShowCelebrationPopup] = useState(false);

  // Voice Over hook for Arabic pronunciation
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  // All words from the words section
  const words = [
    // Learning
    { arabic: 'تَعَلُّم', english: 'Learn', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop', category: { nameEn: 'Learning', nameAr: 'التعلم', icon: '📖', color: '#10b981' } },
    { arabic: 'كِتَاب', english: 'Book', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop', category: { nameEn: 'Learning', nameAr: 'التعلم', icon: '📖', color: '#10b981' } },
    { arabic: 'قَلَم', english: 'Pen', image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400&h=300&fit=crop', category: { nameEn: 'Learning', nameAr: 'التعلم', icon: '📖', color: '#10b981' } },
    { arabic: 'قِرَاءَة', english: 'Reading', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop', category: { nameEn: 'Learning', nameAr: 'التعلم', icon: '📖', color: '#10b981' } },
    // Feelings
    { arabic: 'سَعِيد', english: 'Happy', image: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=400&h=300&fit=crop', category: { nameEn: 'Feelings', nameAr: 'المشاعر', icon: '😊', color: '#f59e0b' } },
    { arabic: 'حُبّ', english: 'Love', image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop', category: { nameEn: 'Feelings', nameAr: 'المشاعر', icon: '😊', color: '#f59e0b' } },
    { arabic: 'صَدِيق', english: 'Friend', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop', category: { nameEn: 'Feelings', nameAr: 'المشاعر', icon: '😊', color: '#f59e0b' } },
    { arabic: 'مُسَاعَدَة', english: 'Help', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=300&fit=crop', category: { nameEn: 'Feelings', nameAr: 'المشاعر', icon: '😊', color: '#f59e0b' } },
    // Everyday
    { arabic: 'طَعَام', english: 'Food', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', category: { nameEn: 'Everyday', nameAr: 'يومي', icon: '🏠', color: '#ec4899' } },
    { arabic: 'مَاء', english: 'Water', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop', category: { nameEn: 'Everyday', nameAr: 'يومي', icon: '🏠', color: '#ec4899' } },
    { arabic: 'بَيْت', english: 'Home', image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop', category: { nameEn: 'Everyday', nameAr: 'يومي', icon: '🏠', color: '#ec4899' } },
    { arabic: 'عَائِلَة', english: 'Family', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop', category: { nameEn: 'Everyday', nameAr: 'يومي', icon: '🏠', color: '#ec4899' } },
    // Actions
    { arabic: 'لَعِب', english: 'Play', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop', category: { nameEn: 'Actions', nameAr: 'الأفعال', icon: '🎯', color: '#8b5cf6' } },
    { arabic: 'نَوْم', english: 'Sleep', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop', category: { nameEn: 'Actions', nameAr: 'الأفعال', icon: '🎯', color: '#8b5cf6' } },
    { arabic: 'أَكْل', english: 'Eat', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop', category: { nameEn: 'Actions', nameAr: 'الأفعال', icon: '🎯', color: '#8b5cf6' } },
    { arabic: 'كِتَابَة', english: 'Write', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop', category: { nameEn: 'Actions', nameAr: 'الأفعال', icon: '🎯', color: '#8b5cf6' } }
  ];

  const currentWord = words[currentWordIndex];

  useEffect(() => {
    // Split word into letters and shuffle
    const letters = currentWord.arabic.split('');
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    setAvailableLetters(shuffled);
    setSelectedLetters([]);
    setIsCorrect(false);
  }, [currentWordIndex]);

  const handleLetterClick = (letter, index, fromAvailable = true) => {
    if (fromAvailable) {
      setSelectedLetters([...selectedLetters, { letter, originalIndex: index }]);
      setAvailableLetters(availableLetters.filter((_, i) => i !== index));
    } else {
      const clickedLetter = selectedLetters[index];
      setAvailableLetters([...availableLetters, clickedLetter.letter]);
      setSelectedLetters(selectedLetters.filter((_, i) => i !== index));
    }
    setIsCorrect(false);
  };

  const checkAnswer = () => {
    const userWord = selectedLetters.map(item => item.letter).join('');
    const correct = userWord === currentWord.arabic;

    if (correct) {
      // Speak the word in Arabic
      voiceOver.speak(currentWord.arabic, true);

      setIsCorrect(true);
      setShowCelebration(true);
      setShowCelebrationPopup(true); // Show celebration popup!
      if (!completedWords.includes(currentWordIndex)) {
        setCompletedWords([...completedWords, currentWordIndex]);
      }

      // After a short delay, speak the English meaning
      setTimeout(() => {
        const message = language === 'ar'
          ? `رائع! ${currentWord.english}`
          : `Great! ${currentWord.english}`;
        voiceOver.speak(message, true);
      }, 1000);

      setTimeout(() => {
        setShowCelebration(false);
      }, 2500);
    } else {
      setIsCorrect(false);
    }
  };

  const resetWord = () => {
    const letters = currentWord.arabic.split('');
    setAvailableLetters([...letters].sort(() => Math.random() - 0.5));
    setSelectedLetters([]);
    setIsCorrect(false);
  };

  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    }
  };

  const previousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  return (
    <div className="letter-word-builder">
      <motion.div
        className="builder-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="builder-title">
          {language === 'ar' ? 'بناء الكلمات' : 'Word Builder'}
        </h1>
        <p className="builder-subtitle">
          {language === 'ar'
            ? 'رتب الحروف لتكوين كلمة صحيحة'
            : 'Arrange the letters to form a correct word'
          }
        </p>
      </motion.div>

      {/* Progress Indicator */}
      <div className="builder-progress">
        <div className="progress-info">
          <span className="progress-label">
            {language === 'ar' ? 'التقدم' : 'Progress'}
          </span>
          <span className="progress-count">
            {currentWordIndex + 1} / {words.length}
          </span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{
              width: `${((currentWordIndex + 1) / words.length) * 100}%`,
              background: currentWord.category.color
            }}
          />
        </div>
        <div className="completed-count">
          ✓ {completedWords.length} {language === 'ar' ? 'مكتمل' : 'Completed'}
        </div>
      </div>

      {/* Category Badge */}
      <div
        className="category-badge-builder"
        style={{ background: currentWord.category.color }}
      >
        {currentWord.category.icon} {language === 'ar' ? currentWord.category.nameAr : currentWord.category.nameEn}
      </div>

      {/* Word Image */}
      <motion.div
        className="word-image-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <img
          src={currentWord.image}
          alt={currentWord.english}
          className="word-builder-image"
        />
        <div className="word-hint">
          <h3 className="hint-label">
            {language === 'ar' ? 'الكلمة المطلوبة:' : 'Target Word:'}
          </h3>
          <div className="hint-english">{currentWord.english}</div>
        </div>
      </motion.div>

      {/* Building Area */}
      <div className="building-area">
        <h3 className="area-label">
          {language === 'ar' ? 'الكلمة الخاصة بك:' : 'Your Word:'}
        </h3>
        <div className={`selected-letters-container ${isCorrect ? 'correct' : ''}`}>
          {selectedLetters.length === 0 ? (
            <div className="placeholder-text">
              {language === 'ar' ? 'اسحب الحروف هنا...' : 'Drag letters here...'}
            </div>
          ) : (
            selectedLetters.map((item, index) => (
              <motion.div
                key={`selected-${index}`}
                className="letter-chip selected"
                onClick={() => handleLetterClick(item.letter, index, false)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ borderColor: currentWord.category.color }}
              >
                {item.letter}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Available Letters */}
      <div className="available-letters-area">
        <h3 className="area-label">
          {language === 'ar' ? 'الحروف المتاحة:' : 'Available Letters:'}
        </h3>
        <div className="available-letters-container">
          {availableLetters.map((letter, index) => (
            <motion.div
              key={`available-${index}`}
              className="letter-chip available"
              onClick={() => handleLetterClick(letter, index, true)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{ background: currentWord.category.color }}
            >
              {letter}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="builder-actions">
        <motion.button
          className="action-btn reset-btn"
          onClick={resetWord}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
        </motion.button>

        <motion.button
          className="action-btn check-btn"
          onClick={checkAnswer}
          disabled={selectedLetters.length !== currentWord.arabic.length}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: selectedLetters.length === currentWord.arabic.length
              ? currentWord.category.color
              : '#d1d5db'
          }}
        >
          ✓ {language === 'ar' ? 'تحقق' : 'Check'}
        </motion.button>
      </div>

      {/* Navigation */}
      <div className="builder-navigation">
        <button
          className="nav-btn-builder"
          onClick={previousWord}
          disabled={currentWordIndex === 0}
        >
          ← {language === 'ar' ? 'السابق' : 'Previous'}
        </button>

        <button
          className="nav-btn-builder"
          onClick={nextWord}
          disabled={currentWordIndex === words.length - 1}
        >
          {language === 'ar' ? 'التالي' : 'Next'} →
        </button>
      </div>

      {/* Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="celebration-overlay"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <div className="celebration-content">
              <motion.div
                className="celebration-emoji"
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                🎉 ⭐ 🎊
              </motion.div>
              <div className="celebration-text">
                {language === 'ar' ? 'رائع!' : 'Excellent!'}
              </div>
              <div className="celebration-subtext">
                {language === 'ar' ? 'لقد كونت الكلمة بشكل صحيح!' : 'You built the word correctly!'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Popup */}
      <CelebrationPopup
        show={showCelebrationPopup}
        language={language}
        onClose={() => setShowCelebrationPopup(false)}
      />
    </div>
  );
};

export default LetterWordBuilder;
