import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceOver } from '../hooks/useVoiceOver';
import { recordModuleItemLearned, getLearnedItems } from '../utils/progressUtils';
import { awardPoints, POINT_VALUES } from '../utils/pointsUtils';
import { checkAchievements } from '../utils/achievementsSystem';
import { PASS_PERCENT } from '../utils/moduleUnlockUtils';
import { learnedPhrase, moduleCompletePhrase, pronouncePhrase } from '../utils/speechPhrasing';
import { playClickSound } from '../utils/soundEffects';
import CelebrationPopup from './CelebrationPopup';
import './ArabicWordsLearning.css';

/**
 * The vocabulary this module teaches.
 *
 * At module scope and exported because the Quiz Centre now builds its unit
 * test from the learner’s own completed items, and the ids it has to match
 * (`<category>_<index>`) are positions in THIS array. Reading the real list is
 * the only way the two stay in step — a second hand-maintained copy would
 * drift the first time a word was added.
 */
export const wordCategories = [
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


const ArabicWordsLearning = ({ t, language, fontSize, highContrast, reducedMotion, speak }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [learnedWords, setLearnedWords] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  // Voice Over hook for Arabic pronunciation
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  // Load user and restore previously learned words so progress persists
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('stellar_session') || '{}');
      if (session.email) {
        setUserEmail(session.email);
        setLearnedWords(getLearnedItems(session.email, 'words'));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }, []);

  // Mark word as learned
  const markWordAsLearned = (categoryId, wordIndex) => {
    const wordKey = `${categoryId}_${wordIndex}`;
    if (!learnedWords.includes(wordKey)) {
      const newLearned = [...learnedWords, wordKey];
      setLearnedWords(newLearned);
      setShowCelebration(true);
      // The popup closes itself after its own hold (see CelebrationPopup); the
      // 2s timer that used to also close it raced that and cut the exit
      // animation short.

      // Track for the Progress Dashboard
      const totalWords = wordCategories.reduce((sum, cat) => sum + cat.words.length, 0);
      recordModuleItemLearned(userEmail, 'words', wordKey, totalWords);

      // Award points, same as the alphabet module, so the progress dashboard
      // and the Explore leaderboard both move when a word is learned.
      if (userEmail) {
        awardPoints(userEmail, 'WORD_LEARNED');

        // Awards `words_complete`, which opens the Sentences module on the
        // learning path (moduleUnlockUtils.js).
        checkAchievements(userEmail, 'module_progress', {
          moduleId: 'words',
          learnedCount: newLearned.length,
          totalCount: totalWords,
          passPercent: PASS_PERCENT
        });

        if (newLearned.length === totalWords) {
          awardPoints(userEmail, 'MODULE_COMPLETED');
        }
      }

      const word = wordCategories.find((c) => c.id === categoryId)?.words[wordIndex];
      voiceOver.speak(
        learnedPhrase({
          language,
          kind: 'word',
          name: language === 'ar' ? word?.arabic : word?.english,
          points: POINT_VALUES.WORD_LEARNED
        }),
        true
      );

      if (newLearned.length === totalWords) {
        setTimeout(() => {
          voiceOver.speak(
            moduleCompletePhrase({
              language,
              moduleName: language === 'ar' ? 'الكلمات' : 'words lesson'
            }),
            true
          );
        }, 1500);
      }
    }
  };

  // Word categories with real image URLs from Unsplash - Simplified to 4 categories, 4 words each

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentWordIndex(0);
  };

  const handleNextWord = () => {
    if (selectedCategory && currentWordIndex < selectedCategory.words.length - 1) {
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

  // Hear the current word. Bound to the whole card AND to an explicit speaker
  // button: the card was already clickable before, but nothing on screen said
  // so, so nobody found it. The button is the affordance; the card stays
  // clickable because a large target is easier for a child to hit.
  const speakCurrentWord = (withMeaning = false) => {
    if (!selectedCategory) return;
    const word = selectedCategory.words[currentWordIndex];
    playClickSound();
    voiceOver.speak(
      withMeaning
        ? pronouncePhrase({ language, arabic: word.arabic, english: word.english })
        : word.arabic,
      true
    );
  };

  const handleWordClick = () => speakCurrentWord(false);

  // Hear a single word straight from the category grid, before committing to
  // working through it.
  const handlePreviewWord = (event, category, index) => {
    event.stopPropagation();
    playClickSound();
    voiceOver.speak(category.words[index].arabic, true);
  };

  // Auto-speak word when category is first selected
  useEffect(() => {
    if (selectedCategory && currentWordIndex === 0) {
      setTimeout(() => {
        voiceOver.speak(selectedCategory.words[0].arabic, true);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

            {/* Hear any word in the category without opening it first. */}
            <div className="category-preview-row">
              {category.words.map((word, index) => (
                <button
                  key={word.arabic}
                  type="button"
                  className="category-preview-btn"
                  onClick={(e) => handlePreviewWord(e, category, index)}
                  title={`${word.arabic} — ${word.simplePronunciation}`}
                  aria-label={language === 'ar'
                    ? `اسمع ${word.arabic}`
                    : `Listen to ${word.english}`}
                >
                  <span aria-hidden="true">🔊</span>
                  <span className="category-preview-label">{word.arabic}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderWordLearning = () => {
    const currentWord = selectedCategory.words[currentWordIndex];
    const isLearned = learnedWords.includes(`${selectedCategory.id}_${currentWordIndex}`);
    const isLastWord = currentWordIndex === selectedCategory.words.length - 1;
    const categoryLearnedCount = selectedCategory.words.filter((_, index) =>
      learnedWords.includes(`${selectedCategory.id}_${index}`)).length;

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

        {/* Celebration Popup — portals itself to <body>, so it is no longer
            cropped by this module's layout (see CelebrationPopup.js). */}
        <CelebrationPopup
          show={showCelebration}
          language={language}
          userEmail={userEmail}
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

            {/* Explicit listen controls. Two buttons rather than one because
                "say the word" and "say the word and what it means" are
                different needs: the first is for copying the sound, the second
                for understanding it. */}
            <div className="word-listen-row">
              <button
                type="button"
                className="word-listen-btn"
                onClick={(e) => { e.stopPropagation(); speakCurrentWord(false); }}
                aria-label={language === 'ar'
                  ? `اسمع كلمة ${currentWord.arabic}`
                  : `Listen to the word ${currentWord.english}`}
              >
                <span className="word-listen-icon" aria-hidden="true">🔊</span>
                {language === 'ar' ? 'اسمع الكلمة' : 'Hear the word'}
              </button>
              <button
                type="button"
                className="word-listen-btn word-listen-btn--secondary"
                onClick={(e) => { e.stopPropagation(); speakCurrentWord(true); }}
                aria-label={language === 'ar'
                  ? `اسمع الكلمة ومعناها`
                  : `Listen to the word and its meaning`}
              >
                <span className="word-listen-icon" aria-hidden="true">💬</span>
                {language === 'ar' ? 'مع المعنى' : 'With meaning'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* The learner says when a word is learned — one big, explicit button,
            the same way the alphabet, colours and sentences modules work.
            Pressing "Next" used to be the only way to mark a word, which meant
            the LAST word of every category could never be learned at all (Next
            is disabled there) and the module topped out at 75%. */}
        <div className="word-learned-row">
          {isLearned ? (
            <div className="word-learned-done" role="status">
              ✓ {language === 'ar' ? 'تعلمت هذه الكلمة' : 'You learned this word'}
            </div>
          ) : (
            <motion.button
              type="button"
              className="word-learned-btn"
              onClick={() => markWordAsLearned(selectedCategory.id, currentWordIndex)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              ⭐ {language === 'ar' ? 'تعلمتها!' : 'I learned it!'}
              <span className="word-learned-points">+{POINT_VALUES.WORD_LEARNED}</span>
            </motion.button>
          )}
        </div>

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

          {isLastWord ? (
            <button
              className="nav-btn-large nav-next"
              onClick={() => setSelectedCategory(null)}
            >
              <span className="nav-text">{language === 'ar' ? 'فئة أخرى' : 'Another category'}</span>
              <span className="nav-icon">→</span>
            </button>
          ) : (
            <button
              className="nav-btn-large nav-next"
              onClick={handleNextWord}
            >
              <span className="nav-text">{language === 'ar' ? 'التالي' : 'Next'}</span>
              <span className="nav-icon">→</span>
            </button>
          )}
        </div>

        {/* Encouraging Message */}
        <div className="encouragement-message">
          {categoryLearnedCount === selectedCategory.words.length
            ? (language === 'ar' ? '🏆 أكملت هذه الفئة كلها!' : '🏆 You finished this whole category!')
            : (language === 'ar'
                ? `🌟 ${categoryLearnedCount} من ${selectedCategory.words.length} كلمات متعلمة — أنت تتعلم بشكل رائع!`
                : `🌟 ${categoryLearnedCount} of ${selectedCategory.words.length} words learned — you are doing wonderfully!`)}
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
