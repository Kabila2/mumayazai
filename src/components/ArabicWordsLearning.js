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
          image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop'
        },
        {
          arabic: 'كِتَاب',
          english: 'Book',
          simplePronunciation: 'ki-tab',
          image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop'
        },
        {
          arabic: 'قَلَم',
          english: 'Pen',
          simplePronunciation: 'qa-lam',
          image: 'https://images.unsplash.com/photo-1563297007-0686b7003af7?w=400&h=300&fit=crop'
        },
        {
          arabic: 'قِرَاءَة',
          english: 'Reading',
          simplePronunciation: 'qi-ra-a',
          image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop'
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
          image: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=300&fit=crop'
        },
        {
          arabic: 'حُبّ',
          english: 'Love',
          simplePronunciation: 'hubb',
          image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=300&fit=crop'
        },
        {
          arabic: 'صَدِيق',
          english: 'Friend',
          simplePronunciation: 'sa-deeq',
          image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop'
        },
        {
          arabic: 'مُسَاعَدَة',
          english: 'Help',
          simplePronunciation: 'mu-sa-a-da',
          image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop'
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
          image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=300&fit=crop'
        },
        {
          arabic: 'مَاء',
          english: 'Water',
          simplePronunciation: 'maa',
          image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=300&fit=crop'
        },
        {
          arabic: 'بَيْت',
          english: 'Home',
          simplePronunciation: 'bayt',
          image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop'
        },
        {
          arabic: 'عَائِلَة',
          english: 'Family',
          simplePronunciation: 'aa-ee-la',
          image: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=300&fit=crop'
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
          image: 'https://images.unsplash.com/photo-1519163219899-21d2bb723b3e?w=400&h=300&fit=crop'
        },
        {
          arabic: 'نَوْم',
          english: 'Sleep',
          simplePronunciation: 'nawm',
          image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=300&fit=crop'
        },
        {
          arabic: 'أَكْل',
          english: 'Eat',
          simplePronunciation: 'akl',
          image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop'
        },
        {
          arabic: 'مَشْي',
          english: 'Walk',
          simplePronunciation: 'mash-ee',
          image: 'https://images.unsplash.com/photo-1588392382834-a891154bca4d?w=400&h=300&fit=crop'
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
