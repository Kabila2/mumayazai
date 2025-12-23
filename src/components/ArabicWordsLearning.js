import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceOver } from '../hooks/useVoiceOver';
import CelebrationPopup from './CelebrationPopup';
import './ArabicWordsLearning.css';

const ArabicWordsLearning = ({ t, language, fontSize, highContrast, reducedMotion, speak }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(true); // Always show translation for clarity
  const [learnedWords, setLearnedWords] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // Voice Over hook for Arabic pronunciation
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  // Mark word as learned
  const markWordAsLearned = (categoryId, wordIndex) => {
    const wordKey = `${categoryId}_${wordIndex}`;
    if (!learnedWords.includes(wordKey)) {
      setLearnedWords([...learnedWords, wordKey]);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  };

  // Word categories with real image URLs from Unsplash - Simplified to 4 categories, 4 words each
  const wordCategories = [
    {
      id: 'learning',
      nameEn: 'Learning',
      nameAr: 'التعلم',
      icon: '📖',
      color: '#10b981',
      words: [
        {
          arabic: 'تَعَلُّم',
          english: 'Learn',
          simplePronunciation: 'ta-al-lum',
          image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop'
        },
        {
          arabic: 'كِتَاب',
          english: 'Book',
          simplePronunciation: 'ki-tab',
          image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop'
        },
        {
          arabic: 'قَلَم',
          english: 'Pen',
          simplePronunciation: 'qa-lam',
          image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=300&fit=crop'
        },
        {
          arabic: 'قِرَاءَة',
          english: 'Reading',
          simplePronunciation: 'qi-ra-a',
          image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop'
        }
      ]
    },
    {
      id: 'feelings',
      nameEn: 'Feelings',
      nameAr: 'المشاعر',
      icon: '😊',
      color: '#f59e0b',
      words: [
        {
          arabic: 'سَعِيد',
          english: 'Happy',
          simplePronunciation: 'sa-eed',
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'
        },
        {
          arabic: 'حُبّ',
          english: 'Love',
          simplePronunciation: 'hubb',
          image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop'
        },
        {
          arabic: 'صَدِيق',
          english: 'Friend',
          simplePronunciation: 'sa-deeq',
          image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop'
        },
        {
          arabic: 'مُسَاعَدَة',
          english: 'Help',
          simplePronunciation: 'mu-sa-a-da',
          image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=300&fit=crop'
        }
      ]
    },
    {
      id: 'everyday',
      nameEn: 'Everyday',
      nameAr: 'يومي',
      icon: '🏠',
      color: '#ec4899',
      words: [
        {
          arabic: 'طَعَام',
          english: 'Food',
          simplePronunciation: 'ta-am',
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop'
        },
        {
          arabic: 'مَاء',
          english: 'Water',
          simplePronunciation: 'maa',
          image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop'
        },
        {
          arabic: 'بَيْت',
          english: 'Home',
          simplePronunciation: 'bayt',
          image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop'
        },
        {
          arabic: 'عَائِلَة',
          english: 'Family',
          simplePronunciation: 'aa-ee-la',
          image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop'
        }
      ]
    },
    {
      id: 'actions',
      nameEn: 'Actions',
      nameAr: 'الأفعال',
      icon: '🎯',
      color: '#8b5cf6',
      words: [
        {
          arabic: 'لَعِب',
          english: 'Play',
          simplePronunciation: 'la-ib',
          image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop'
        },
        {
          arabic: 'نَوْم',
          english: 'Sleep',
          simplePronunciation: 'nawm',
          image: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=400&h=300&fit=crop'
        },
        {
          arabic: 'أَكْل',
          english: 'Eat',
          simplePronunciation: 'akl',
          image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop'
        },
        {
          arabic: 'مَشْي',
          english: 'Walk',
          simplePronunciation: 'mash-ee',
          image: 'https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=400&h=300&fit=crop'
        }
      ]
    }
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentWordIndex(0);
    setReviewMode(false);
  };

  const handleNextWord = () => {
    if (selectedCategory && currentWordIndex < selectedCategory.words.length - 1) {
      markWordAsLearned(selectedCategory.id, currentWordIndex);
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      // Speak the next word
      setTimeout(() => {
        voiceOver.speak(selectedCategory.words[nextIndex].arabic, true);
      }, 300);
    }
  };

  const handlePreviousWord = () => {
    if (currentWordIndex > 0) {
      const prevIndex = currentWordIndex - 1;
      setCurrentWordIndex(prevIndex);
      // Speak the previous word
      setTimeout(() => {
        voiceOver.speak(selectedCategory.words[prevIndex].arabic, true);
      }, 300);
    }
  };

  // Speak word when card is clicked
  const handleWordClick = () => {
    if (selectedCategory) {
      const currentWord = selectedCategory.words[currentWordIndex];
      voiceOver.speak(currentWord.arabic, true);
    }
  };

  // Auto-speak word when category is first selected
  useEffect(() => {
    if (selectedCategory && currentWordIndex === 0) {
      setTimeout(() => {
        voiceOver.speak(selectedCategory.words[0].arabic, true);
      }, 500);
    }
  }, [selectedCategory]);

  const renderCategorySelection = () => (
    <div className="words-categories">
      <h2 className="categories-title">
        {language === 'ar' ? 'اختر فئة' : 'Choose a Category'}
      </h2>
      <div className="categories-grid">
        {wordCategories.map((category) => (
          <motion.div
            key={category.id}
            className="category-card"
            style={{ borderColor: category.color }}
            onClick={() => handleCategorySelect(category)}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="category-icon" style={{ background: category.color }}>
              {category.icon}
            </div>
            <h3 className="category-name">
              {language === 'ar' ? category.nameAr : category.nameEn}
            </h3>
            <p className="category-count">
              {category.words.length} {language === 'ar' ? 'كلمات' : 'words'}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderWordLearning = () => {
    const currentWord = selectedCategory.words[currentWordIndex];
    const isLearned = learnedWords.includes(`${selectedCategory.id}_${currentWordIndex}`);

    return (
      <div className="word-learning ds-friendly">
        <div className="learning-navigation">
          <button
            className="back-to-categories-btn ds-btn"
            onClick={() => setSelectedCategory(null)}
          >
            ← {language === 'ar' ? 'عودة' : 'Back'}
          </button>
          <div className="category-badge" style={{ background: selectedCategory.color }}>
            {selectedCategory.icon} {language === 'ar' ? selectedCategory.nameAr : selectedCategory.nameEn}
          </div>
        </div>

        {/* Simple Progress with Stars */}
        <div className="word-progress-stars">
          {selectedCategory.words.map((_, index) => (
            <span
              key={index}
              className={`progress-star ${index <= currentWordIndex ? 'active' : ''} ${learnedWords.includes(`${selectedCategory.id}_${index}`) ? 'learned' : ''}`}
              style={{ color: index <= currentWordIndex ? selectedCategory.color : '#d1d5db' }}
            >
              {learnedWords.includes(`${selectedCategory.id}_${index}`) ? '⭐' : index <= currentWordIndex ? '★' : '☆'}
            </span>
          ))}
        </div>

        {/* Celebration Popup */}
        <CelebrationPopup
          show={showCelebration}
          language={language}
          onClose={() => setShowCelebration(false)}
        />

        <motion.div
          key={currentWordIndex}
          className="word-card ds-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={handleWordClick}
          style={{ cursor: 'pointer' }}
          title={language === 'ar' ? 'انقر لسماع النطق' : 'Click to hear pronunciation'}
        >
          <div className="word-image-container">
            <img
              src={currentWord.image}
              alt={currentWord.english}
              className="word-image"
              loading="lazy"
            />
            {isLearned && (
              <div className="learned-badge">
                ✓ {language === 'ar' ? 'تعلمت!' : 'Learned!'}
              </div>
            )}
          </div>

          <div className="word-content ds-content">
            {/* Large Arabic Word */}
            <div className="arabic-word-large">
              {currentWord.arabic}
            </div>

            {/* Translation */}
            <div className="translation-large">
              {currentWord.english}
            </div>

            {/* Simple Pronunciation */}
            <div className="pronunciation-simple">
              {currentWord.simplePronunciation}
            </div>
          </div>
        </motion.div>

        {/* Large, Clear Navigation Buttons */}
        <div className="word-navigation-large">
          <button
            className="nav-btn-large nav-prev"
            onClick={handlePreviousWord}
            disabled={currentWordIndex === 0}
          >
            <span className="nav-icon">←</span>
            <span className="nav-text">{language === 'ar' ? 'السابق' : 'Back'}</span>
          </button>

          <button
            className="nav-btn-large nav-next"
            onClick={handleNextWord}
            disabled={currentWordIndex === selectedCategory.words.length - 1}
          >
            <span className="nav-text">{language === 'ar' ? 'التالي' : 'Next'}</span>
            <span className="nav-icon">→</span>
          </button>
        </div>

        {/* Encouraging Message */}
        <div className="encouragement-message">
          {language === 'ar' ? '🌟 أنت تتعلم بشكل رائع!' : '🌟 You are learning wonderfully!'}
        </div>
      </div>
    );
  };

  return (
    <div className="arabic-words-learning">
      <div className="words-header">
        <h1 className="words-title">
          {language === 'ar' ? 'تعلم الكلمات العربية' : 'Learn Arabic Words'}
        </h1>
        <p className="words-subtitle">
          {language === 'ar'
            ? 'تعلم الكلمات الأساسية مع الصور والنطق'
            : 'Learn essential words with pictures and pronunciation'
          }
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedCategory ? renderCategorySelection() : renderWordLearning()}
      </AnimatePresence>
    </div>
  );
};

export default ArabicWordsLearning;
