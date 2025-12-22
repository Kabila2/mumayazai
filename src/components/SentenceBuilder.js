import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceOver } from '../hooks/useVoiceOver';
import CelebrationPopup from './CelebrationPopup';
import './SentenceBuilder.css';

const SentenceBuilder = ({ language, fontSize, highContrast }) => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedSentences, setCompletedSentences] = useState([]);
  const [showCelebrationPopup, setShowCelebrationPopup] = useState(false);

  // Voice Over hook for Arabic pronunciation
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  // All sentences from the sentences section
  const sentences = [
    // Greetings
    {
      arabic: 'السَّلامُ عَلَيْكُم',
      english: 'Peace be upon you',
      words: ['السَّلامُ', 'عَلَيْكُم'],
      category: { nameEn: 'Greetings', nameAr: 'التحيات', icon: '👋', color: '#10b981' }
    },
    {
      arabic: 'صَباحُ الخَيْر',
      english: 'Good morning',
      words: ['صَباحُ', 'الخَيْر'],
      category: { nameEn: 'Greetings', nameAr: 'التحيات', icon: '👋', color: '#10b981' }
    },
    {
      arabic: 'كَيْفَ حالُكَ؟',
      english: 'How are you?',
      words: ['كَيْفَ', 'حالُكَ؟'],
      category: { nameEn: 'Greetings', nameAr: 'التحيات', icon: '👋', color: '#10b981' }
    },
    {
      arabic: 'أَنا بِخَيْر',
      english: "I'm fine",
      words: ['أَنا', 'بِخَيْر'],
      category: { nameEn: 'Greetings', nameAr: 'التحيات', icon: '👋', color: '#10b981' }
    },
    // Daily Life
    {
      arabic: 'أُحِبُّ الطَّعام',
      english: 'I love food',
      words: ['أُحِبُّ', 'الطَّعام'],
      category: { nameEn: 'Daily Life', nameAr: 'الحياة اليومية', icon: '🏠', color: '#f59e0b' }
    },
    {
      arabic: 'أُريدُ ماء',
      english: 'I want water',
      words: ['أُريدُ', 'ماء'],
      category: { nameEn: 'Daily Life', nameAr: 'الحياة اليومية', icon: '🏠', color: '#f59e0b' }
    },
    {
      arabic: 'البَيْتُ جَميل',
      english: 'The house is beautiful',
      words: ['البَيْتُ', 'جَميل'],
      category: { nameEn: 'Daily Life', nameAr: 'الحياة اليومية', icon: '🏠', color: '#f59e0b' }
    },
    {
      arabic: 'عائِلَتي كَبيرة',
      english: 'My family is big',
      words: ['عائِلَتي', 'كَبيرة'],
      category: { nameEn: 'Daily Life', nameAr: 'الحياة اليومية', icon: '🏠', color: '#f59e0b' }
    },
    // Feelings
    {
      arabic: 'أَنا سَعيد',
      english: 'I am happy',
      words: ['أَنا', 'سَعيد'],
      category: { nameEn: 'Feelings', nameAr: 'المشاعر', icon: '😊', color: '#ec4899' }
    },
    {
      arabic: 'أُحِبُّكَ كَثيراً',
      english: 'I love you very much',
      words: ['أُحِبُّكَ', 'كَثيراً'],
      category: { nameEn: 'Feelings', nameAr: 'المشاعر', icon: '😊', color: '#ec4899' }
    },
    {
      arabic: 'صَديقي لَطيف',
      english: 'My friend is kind',
      words: ['صَديقي', 'لَطيف'],
      category: { nameEn: 'Feelings', nameAr: 'المشاعر', icon: '😊', color: '#ec4899' }
    },
    {
      arabic: 'شُكْراً جَزيلاً',
      english: 'Thank you very much',
      words: ['شُكْراً', 'جَزيلاً'],
      category: { nameEn: 'Feelings', nameAr: 'المشاعر', icon: '😊', color: '#ec4899' }
    },
    // Actions
    {
      arabic: 'أَذْهَبُ إلى المَدْرَسة',
      english: 'I go to school',
      words: ['أَذْهَبُ', 'إلى', 'المَدْرَسة'],
      category: { nameEn: 'Actions', nameAr: 'الأفعال', icon: '🎯', color: '#8b5cf6' }
    },
    {
      arabic: 'أَلْعَبُ مَعَ أَصْدِقائي',
      english: 'I play with my friends',
      words: ['أَلْعَبُ', 'مَعَ', 'أَصْدِقائي'],
      category: { nameEn: 'Actions', nameAr: 'الأفعال', icon: '🎯', color: '#8b5cf6' }
    },
    {
      arabic: 'أَقْرَأُ كِتاباً',
      english: 'I read a book',
      words: ['أَقْرَأُ', 'كِتاباً'],
      category: { nameEn: 'Actions', nameAr: 'الأفعال', icon: '🎯', color: '#8b5cf6' }
    },
    {
      arabic: 'أَكْتُبُ الدَّرْس',
      english: 'I write the lesson',
      words: ['أَكْتُبُ', 'الدَّرْس'],
      category: { nameEn: 'Actions', nameAr: 'الأفعال', icon: '🎯', color: '#8b5cf6' }
    }
  ];

  const currentSentence = sentences[currentSentenceIndex];

  useEffect(() => {
    // Shuffle words when sentence changes
    const shuffled = [...currentSentence.words].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setSelectedWords([]);
    setIsCorrect(false);
  }, [currentSentenceIndex]);

  const handleWordClick = (word, fromAvailable = true) => {
    if (fromAvailable) {
      setSelectedWords([...selectedWords, word]);
      setAvailableWords(availableWords.filter(w => w !== word));
    } else {
      setAvailableWords([...availableWords, word]);
      setSelectedWords(selectedWords.filter(w => w !== word));
    }
    setIsCorrect(false);
  };

  const checkAnswer = () => {
    const userSentence = selectedWords.join(' ');
    const correct = userSentence === currentSentence.arabic;

    if (correct) {
      // Speak the sentence in Arabic
      voiceOver.speak(currentSentence.arabic, true);

      setIsCorrect(true);
      setShowCelebration(true);
      setShowCelebrationPopup(true); // Show celebration popup!
      if (!completedSentences.includes(currentSentenceIndex)) {
        setCompletedSentences([...completedSentences, currentSentenceIndex]);
      }

      // After a short delay, speak the English meaning
      setTimeout(() => {
        const message = language === 'ar'
          ? `ممتاز! ${currentSentence.english}`
          : `Excellent! ${currentSentence.english}`;
        voiceOver.speak(message, true);
      }, 1500);

      setTimeout(() => {
        setShowCelebration(false);
      }, 2500);
    } else {
      // Shake animation for wrong answer
      setIsCorrect(false);
    }
  };

  const resetSentence = () => {
    setAvailableWords([...currentSentence.words].sort(() => Math.random() - 0.5));
    setSelectedWords([]);
    setIsCorrect(false);
  };

  const nextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    }
  };

  const previousSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1);
    }
  };

  return (
    <div className="sentence-builder">
      <motion.div
        className="builder-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="builder-title">
          {language === 'ar' ? 'بناء الجمل' : 'Sentence Builder'}
        </h1>
        <p className="builder-subtitle">
          {language === 'ar'
            ? 'رتب الكلمات لتكوين جملة صحيحة'
            : 'Arrange the words to form a correct sentence'
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
            {currentSentenceIndex + 1} / {sentences.length}
          </span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{
              width: `${((currentSentenceIndex + 1) / sentences.length) * 100}%`,
              background: currentSentence.category.color
            }}
          />
        </div>
        <div className="completed-count">
          ✓ {completedSentences.length} {language === 'ar' ? 'مكتمل' : 'Completed'}
        </div>
      </div>

      {/* Category Badge */}
      <div
        className="category-badge-builder"
        style={{ background: currentSentence.category.color }}
      >
        {currentSentence.category.icon} {language === 'ar' ? currentSentence.category.nameAr : currentSentence.category.nameEn}
      </div>

      {/* Target Sentence Display */}
      <motion.div
        className="target-sentence"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3 className="target-label">
          {language === 'ar' ? 'الجملة المطلوبة:' : 'Target Sentence:'}
        </h3>
        <div className="target-english">{currentSentence.english}</div>
      </motion.div>

      {/* Building Area */}
      <div className="building-area">
        <h3 className="area-label">
          {language === 'ar' ? 'الجملة الخاصة بك:' : 'Your Sentence:'}
        </h3>
        <div className={`selected-words-container ${isCorrect ? 'correct' : ''}`}>
          {selectedWords.length === 0 ? (
            <div className="placeholder-text">
              {language === 'ar' ? 'اسحب الكلمات هنا...' : 'Drag words here...'}
            </div>
          ) : (
            selectedWords.map((word, index) => (
              <motion.div
                key={`selected-${index}`}
                className="word-chip selected"
                onClick={() => handleWordClick(word, false)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ borderColor: currentSentence.category.color }}
              >
                {word}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Available Words */}
      <div className="available-words-area">
        <h3 className="area-label">
          {language === 'ar' ? 'الكلمات المتاحة:' : 'Available Words:'}
        </h3>
        <div className="available-words-container">
          {availableWords.map((word, index) => (
            <motion.div
              key={`available-${index}`}
              className="word-chip available"
              onClick={() => handleWordClick(word, true)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ background: currentSentence.category.color }}
            >
              {word}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="builder-actions">
        <motion.button
          className="action-btn reset-btn"
          onClick={resetSentence}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
        </motion.button>

        <motion.button
          className="action-btn check-btn"
          onClick={checkAnswer}
          disabled={selectedWords.length !== currentSentence.words.length}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: selectedWords.length === currentSentence.words.length
              ? currentSentence.category.color
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
          onClick={previousSentence}
          disabled={currentSentenceIndex === 0}
        >
          ← {language === 'ar' ? 'السابق' : 'Previous'}
        </button>

        <button
          className="nav-btn-builder"
          onClick={nextSentence}
          disabled={currentSentenceIndex === sentences.length - 1}
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
                🎉 🌟 🎊
              </motion.div>
              <div className="celebration-text">
                {language === 'ar' ? 'ممتاز!' : 'Perfect!'}
              </div>
              <div className="celebration-subtext">
                {language === 'ar' ? 'لقد كونت الجملة بشكل صحيح!' : 'You built the sentence correctly!'}
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

export default SentenceBuilder;
