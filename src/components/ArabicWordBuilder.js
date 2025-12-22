import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceOver } from '../hooks/useVoiceOver';
import CelebrationPopup from './CelebrationPopup';
import './ArabicWordBuilder.css';

const ArabicWordBuilder = ({ t, language, fontSize, highContrast, reducedMotion, speak }) => {
  // Voice Over hook for Arabic pronunciation
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [availableLetters, setAvailableLetters] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Difficulty levels based on word length
  const difficultyLevels = [
    {
      id: 'easy',
      nameEn: 'Easy',
      nameAr: 'سهل',
      icon: '⭐',
      color: '#10b981',
      description: 'Short words (2-3 letters)',
      maxLength: 3
    },
    {
      id: 'medium',
      nameEn: 'Medium',
      nameAr: 'متوسط',
      icon: '⭐⭐',
      color: '#f59e0b',
      description: 'Medium words (4-5 letters)',
      minLength: 4,
      maxLength: 5
    },
    {
      id: 'hard',
      nameEn: 'Hard',
      nameAr: 'صعب',
      icon: '⭐⭐⭐',
      color: '#ef4444',
      description: 'Long words (6+ letters)',
      minLength: 6
    }
  ];

  const wordCategories = [
    {
      id: 'animals',
      nameEn: 'Animals',
      nameAr: 'الحيوانات',
      icon: '🦁',
      color: '#10b981',
      words: [
        // Easy (2-3 letters)
        {
          arabic: 'قط',
          english: 'Cat',
          image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop'
        },
        {
          arabic: 'فأر',
          english: 'Mouse',
          image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop'
        },
        {
          arabic: 'دب',
          english: 'Bear',
          image: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=400&h=300&fit=crop'
        },
        // Medium (4-5 letters)
        {
          arabic: 'أسد',
          english: 'Lion',
          image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=300&fit=crop'
        },
        {
          arabic: 'قطة',
          english: 'Kitten',
          image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop'
        },
        {
          arabic: 'كلب',
          english: 'Dog',
          image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop'
        },
        {
          arabic: 'فيل',
          english: 'Elephant',
          image: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=400&h=300&fit=crop'
        },
        // Hard (6+ letters)
        {
          arabic: 'حصان',
          english: 'Horse',
          image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&h=300&fit=crop'
        },
        {
          arabic: 'أرنب',
          english: 'Rabbit',
          image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop'
        },
        {
          arabic: 'طائر',
          english: 'Bird',
          image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&h=300&fit=crop'
        }
      ]
    },
    {
      id: 'food',
      nameEn: 'Food',
      nameAr: 'الطعام',
      icon: '🍎',
      color: '#f59e0b',
      words: [
        // Easy (2-3 letters)
        {
          arabic: 'خبز',
          english: 'Bread',
          image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop'
        },
        {
          arabic: 'ماء',
          english: 'Water',
          image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop'
        },
        {
          arabic: 'رز',
          english: 'Rice',
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop'
        },
        // Medium (4-5 letters)
        {
          arabic: 'تفاح',
          english: 'Apple',
          image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=300&fit=crop'
        },
        {
          arabic: 'حليب',
          english: 'Milk',
          image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop'
        },
        {
          arabic: 'عسل',
          english: 'Honey',
          image: 'https://images.unsplash.com/photo-1587049352846-4a222e784e38?w=400&h=300&fit=crop'
        },
        {
          arabic: 'جبن',
          english: 'Cheese',
          image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=300&fit=crop'
        },
        // Hard (6+ letters)
        {
          arabic: 'برتقال',
          english: 'Orange',
          image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=300&fit=crop'
        },
        {
          arabic: 'موزة',
          english: 'Banana',
          image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop'
        },
        {
          arabic: 'فراولة',
          english: 'Strawberry',
          image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop'
        }
      ]
    },
    {
      id: 'nature',
      nameEn: 'Nature',
      nameAr: 'الطبيعة',
      icon: '🌸',
      color: '#ec4899',
      words: [
        // Easy (2-3 letters)
        {
          arabic: 'شمس',
          english: 'Sun',
          image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop'
        },
        {
          arabic: 'قمر',
          english: 'Moon',
          image: 'https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?w=400&h=300&fit=crop'
        },
        {
          arabic: 'نجم',
          english: 'Star',
          image: 'https://images.unsplash.com/photo-1519981593452-666cf05569a9?w=400&h=300&fit=crop'
        },
        // Medium (4-5 letters)
        {
          arabic: 'زهرة',
          english: 'Flower',
          image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop'
        },
        {
          arabic: 'شجرة',
          english: 'Tree',
          image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop'
        },
        {
          arabic: 'نهر',
          english: 'River',
          image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=300&fit=crop'
        },
        {
          arabic: 'جبل',
          english: 'Mountain',
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
        },
        // Hard (6+ letters)
        {
          arabic: 'سحابة',
          english: 'Cloud',
          image: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=400&h=300&fit=crop'
        },
        {
          arabic: 'قوس قزح',
          english: 'Rainbow',
          image: 'https://images.unsplash.com/photo-1514897575457-c4db467cf78e?w=400&h=300&fit=crop'
        },
        {
          arabic: 'فراشة',
          english: 'Butterfly',
          image: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400&h=300&fit=crop'
        }
      ]
    },
    {
      id: 'objects',
      nameEn: 'Objects',
      nameAr: 'الأشياء',
      icon: '📚',
      color: '#8b5cf6',
      words: [
        // Easy (2-3 letters)
        {
          arabic: 'باب',
          english: 'Door',
          image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
        },
        {
          arabic: 'قلم',
          english: 'Pen',
          image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400&h=300&fit=crop'
        },
        {
          arabic: 'كأس',
          english: 'Cup',
          image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=300&fit=crop'
        },
        // Medium (4-5 letters)
        {
          arabic: 'كتاب',
          english: 'Book',
          image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop'
        },
        {
          arabic: 'كرسي',
          english: 'Chair',
          image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=300&fit=crop'
        },
        {
          arabic: 'طاولة',
          english: 'Table',
          image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=400&h=300&fit=crop'
        },
        {
          arabic: 'مفتاح',
          english: 'Key',
          image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=300&fit=crop'
        },
        // Hard (6+ letters)
        {
          arabic: 'حاسوب',
          english: 'Computer',
          image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=300&fit=crop'
        },
        {
          arabic: 'هاتف',
          english: 'Phone',
          image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop'
        },
        {
          arabic: 'نافذة',
          english: 'Window',
          image: 'https://images.unsplash.com/photo-1506880135364-e28660dc35fa?w=400&h=300&fit=crop'
        }
      ]
    }
  ];

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Load saved progress
  useEffect(() => {
    const savedProgress = localStorage.getItem('arabic_wordbuilder_progress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setTotalPoints(progress.totalPoints || 0);
        setBestStreak(progress.bestStreak || 0);
      } catch (error) {
        console.warn('Failed to load progress:', error);
      }
    }
  }, []);

  // Save progress
  const saveProgress = () => {
    const progress = {
      totalPoints,
      bestStreak,
      lastPlayed: new Date().toISOString()
    };
    localStorage.setItem('arabic_wordbuilder_progress', JSON.stringify(progress));
  };

  useEffect(() => {
    if (totalPoints > 0) {
      saveProgress();
    }
  }, [totalPoints, bestStreak]);

  // Filter words by difficulty level
  const getFilteredWords = (category, difficulty) => {
    if (!difficulty) return category.words;

    return category.words.filter(word => {
      const wordLength = word.arabic.length;

      if (difficulty.id === 'easy') {
        return wordLength <= difficulty.maxLength;
      } else if (difficulty.id === 'medium') {
        return wordLength >= difficulty.minLength && wordLength <= difficulty.maxLength;
      } else if (difficulty.id === 'hard') {
        return wordLength >= difficulty.minLength;
      }

      return true;
    });
  };

  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const handleCategorySelect = (category) => {
    const filteredWords = getFilteredWords(category, selectedDifficulty);
    const categoryWithFilteredWords = {
      ...category,
      words: filteredWords
    };

    setSelectedCategory(categoryWithFilteredWords);
    setCurrentWordIndex(0);
    setScore(0);
    setStreak(0);
    setCoinsEarned(0);

    if (filteredWords.length > 0) {
      initializeWord(filteredWords[0]);
    }
  };

  const initializeWord = (word) => {
    const letters = word.arabic.split('');
    setAvailableLetters(shuffleArray(letters.map((letter, index) => ({ letter, id: index }))));
    setSelectedLetters([]);
    setShowSuccess(false);
    setShowHint(false);
  };

  const handleLetterClick = (letterObj, fromAvailable) => {
    if (fromAvailable) {
      setSelectedLetters([...selectedLetters, letterObj]);
      setAvailableLetters(availableLetters.filter(l => l.id !== letterObj.id));
    } else {
      setAvailableLetters([...availableLetters, letterObj]);
      setSelectedLetters(selectedLetters.filter(l => l.id !== letterObj.id));
    }
  };

  const checkAnswer = () => {
    const currentWord = selectedCategory.words[currentWordIndex];
    const userWord = selectedLetters.map(l => l.letter).join('');

    if (userWord === currentWord.arabic) {
      // Speak the word in Arabic using voice over
      voiceOver.speak(currentWord.arabic, true);

      // Calculate points
      const basePoints = 10;
      const streakBonus = streak * 5;
      const hintPenalty = showHint ? 5 : 0;
      const pointsEarned = basePoints + streakBonus - hintPenalty;

      // Update scores
      setScore(score + 1);
      setStreak(streak + 1);
      setTotalPoints(totalPoints + pointsEarned);
      setCoinsEarned(coinsEarned + pointsEarned);

      // Update best streak
      if (streak + 1 > bestStreak) {
        setBestStreak(streak + 1);
      }

      // Determine reward
      const reward = {
        points: pointsEarned,
        streak: streak + 1,
        bonus: streakBonus > 0,
        perfect: !showHint
      };
      setCurrentReward(reward);
      setShowSuccess(true);
      setShowCelebration(true); // Show celebration popup!

      setTimeout(() => {
        setShowSuccess(false);
        setShowReward(true);
        setTimeout(() => {
          setShowReward(false);
          handleNextWord();
        }, 2500);
      }, 1500);
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < selectedCategory.words.length - 1) {
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      initializeWord(selectedCategory.words[nextIndex]);
    } else {
      // Category completed - return to category selection
      setSelectedCategory(null);
      // Optionally reset difficulty to start fresh
      // setSelectedDifficulty(null);
    }
  };

  const handleReset = () => {
    const currentWord = selectedCategory.words[currentWordIndex];
    initializeWord(currentWord);
  };

  useEffect(() => {
    if (selectedLetters.length > 0) {
      checkAnswer();
    }
  }, [selectedLetters]);

  const renderDifficultySelection = () => (
    <div className="word-builder-difficulty">
      {totalPoints > 0 && (
        <motion.div
          className="player-stats-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="stats-banner-content">
            <div className="banner-stat">
              <div className="banner-icon">🪙</div>
              <div className="banner-label">{language === 'ar' ? 'مجموع النقاط' : 'Total Coins'}</div>
              <div className="banner-value">{totalPoints}</div>
            </div>
            <div className="banner-stat">
              <div className="banner-icon">🔥</div>
              <div className="banner-label">{language === 'ar' ? 'أفضل سلسلة' : 'Best Streak'}</div>
              <div className="banner-value">{bestStreak}</div>
            </div>
            <div className="banner-stat">
              <div className="banner-icon">🏆</div>
              <div className="banner-label">{language === 'ar' ? 'الرتبة' : 'Rank'}</div>
              <div className="banner-value">
                {totalPoints >= 200 ? '💎' : totalPoints >= 100 ? '🥇' : totalPoints >= 50 ? '🥈' : '🥉'}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <h2 className="categories-title">
        {language === 'ar' ? 'اختر مستوى الصعوبة' : 'Choose Difficulty Level'}
      </h2>
      <p className="difficulty-subtitle">
        {language === 'ar'
          ? 'حدد مستوى الصعوبة بناءً على طول الكلمات'
          : 'Select difficulty based on word length'
        }
      </p>
      <div className="difficulty-grid">
        {difficultyLevels.map((difficulty, index) => (
          <motion.div
            key={difficulty.id}
            className="difficulty-card"
            style={{ borderColor: difficulty.color }}
            onClick={() => handleDifficultySelect(difficulty)}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="difficulty-icon" style={{ background: difficulty.color }}>
              {difficulty.icon}
            </div>
            <h3 className="difficulty-name">
              {language === 'ar' ? difficulty.nameAr : difficulty.nameEn}
            </h3>
            <p className="difficulty-description">
              {language === 'ar'
                ? difficulty.id === 'easy'
                  ? 'كلمات قصيرة (٢-٣ حروف)'
                  : difficulty.id === 'medium'
                  ? 'كلمات متوسطة (٤-٥ حروف)'
                  : 'كلمات طويلة (٦+ حروف)'
                : difficulty.description
              }
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderCategorySelection = () => (
    <div className="word-builder-categories">
      <button
        className="back-button"
        onClick={() => setSelectedDifficulty(null)}
      >
        ← {language === 'ar' ? 'عودة إلى الصعوبة' : 'Back to Difficulty'}
      </button>

      <h2 className="categories-title">
        {language === 'ar' ? 'اختر فئة' : 'Choose a Category'}
      </h2>
      <div className="difficulty-badge" style={{ background: selectedDifficulty?.color }}>
        {selectedDifficulty?.icon} {language === 'ar' ? selectedDifficulty?.nameAr : selectedDifficulty?.nameEn}
      </div>
      <div className="categories-grid">
        {wordCategories.map((category) => {
          const filteredWords = getFilteredWords(category, selectedDifficulty);
          return (
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
                {filteredWords.length} {language === 'ar' ? 'كلمات' : 'words'}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderWordBuilder = () => {
    const currentWord = selectedCategory.words[currentWordIndex];

    return (
      <div className="word-builder-game">
        <div className="game-header">
          <button
            className="back-to-categories-btn"
            onClick={() => setSelectedCategory(null)}
          >
            ← {language === 'ar' ? 'عودة' : 'Back'}
          </button>
          <div className="category-badge" style={{ background: selectedCategory.color }}>
            {selectedCategory.icon} {language === 'ar' ? selectedCategory.nameAr : selectedCategory.nameEn}
          </div>
          <div className="stats-container">
            <div className="stat-item coins">
              <span className="stat-icon">🪙</span>
              <span className="stat-value">{totalPoints}</span>
            </div>
            <div className="stat-item streak">
              <span className="stat-icon">🔥</span>
              <span className="stat-value">{streak}</span>
            </div>
            <div className="stat-item score">
              <span className="stat-label">{language === 'ar' ? 'النقاط' : 'Score'}:</span>
              <span className="stat-value">{score}/{selectedCategory.words.length}</span>
            </div>
          </div>
        </div>

        <div className="game-progress">
          {selectedCategory.words.map((_, index) => (
            <span
              key={index}
              className={`progress-dot ${index === currentWordIndex ? 'active' : ''} ${index < currentWordIndex ? 'completed' : ''}`}
              style={{
                background: index <= currentWordIndex ? selectedCategory.color : '#d1d5db',
                opacity: index < currentWordIndex ? 0.5 : 1
              }}
            />
          ))}
        </div>

        <motion.div
          key={currentWordIndex}
          className="word-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="word-image-container">
            <img
              src={currentWord.image}
              alt={currentWord.english}
              className="word-image"
              loading="lazy"
            />
          </div>

          <div className="word-hint-container">
            {showHint ? (
              <div className="word-hint">
                {currentWord.english}
              </div>
            ) : (
              <button
                className="hint-btn"
                onClick={() => setShowHint(true)}
              >
                💡 {language === 'ar' ? 'تلميح' : 'Hint'}
              </button>
            )}
          </div>

          <div className="selected-letters-area">
            <h3 className="area-title">
              {language === 'ar' ? 'كلمتك' : 'Your Word'}
            </h3>
            <div className="letters-container selected">
              {selectedLetters.length === 0 ? (
                <div className="empty-state">
                  {language === 'ar' ? 'اختر الحروف من الأسفل' : 'Select letters from below'}
                </div>
              ) : (
                selectedLetters.map((letterObj) => (
                  <motion.button
                    key={`selected-${letterObj.id}`}
                    className="letter-tile selected"
                    onClick={() => handleLetterClick(letterObj, false)}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {letterObj.letter}
                  </motion.button>
                ))
              )}
            </div>
          </div>

          <div className="available-letters-area">
            <h3 className="area-title">
              {language === 'ar' ? 'الحروف المتاحة' : 'Available Letters'}
            </h3>
            <div className="letters-container available">
              {availableLetters.map((letterObj) => (
                <motion.button
                  key={`available-${letterObj.id}`}
                  className="letter-tile available"
                  onClick={() => handleLetterClick(letterObj, true)}
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {letterObj.letter}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="game-controls">
            <button
              className="control-btn reset-btn"
              onClick={handleReset}
            >
              🔄 {language === 'ar' ? 'إعادة' : 'Reset'}
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="success-overlay"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <div className="success-content">
                <div className="success-emoji">🎉 ⭐ 🎊</div>
                <div className="success-text">
                  {language === 'ar' ? 'أحسنت!' : 'Great Job!'}
                </div>
                <div className="success-word">
                  {currentWord.arabic}
                </div>
                <div className="success-meaning">
                  {currentWord.english}
                </div>
              </div>
            </motion.div>
          )}

          {showReward && currentReward && (
            <motion.div
              className="reward-overlay"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
            >
              <div className="reward-content">
                <motion.div
                  className="reward-coins"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="coins-icon">🪙</div>
                  <div className="coins-earned">+{currentReward.points}</div>
                </motion.div>

                {currentReward.streak > 1 && (
                  <motion.div
                    className="streak-bonus"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <span className="streak-icon">🔥</span>
                    <span className="streak-text">
                      {language === 'ar' ? `سلسلة ${currentReward.streak}!` : `${currentReward.streak} Streak!`}
                    </span>
                    {currentReward.streak === 5 && <span className="milestone">⭐ Amazing!</span>}
                    {currentReward.streak === 10 && <span className="milestone">💎 Incredible!</span>}
                  </motion.div>
                )}

                {currentReward.perfect && (
                  <motion.div
                    className="perfect-badge"
                    initial={{ opacity: 0, rotate: -45 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <span>✨ {language === 'ar' ? 'كامل!' : 'Perfect!'} ✨</span>
                  </motion.div>
                )}

                <div className="total-coins-display">
                  {language === 'ar' ? 'المجموع' : 'Total'}: {totalPoints} 🪙
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="arabic-word-builder">
      <div className="word-builder-header">
        <h1 className="word-builder-title">
          {language === 'ar' ? 'بناء الكلمات' : 'Word Builder'}
        </h1>
        <p className="word-builder-subtitle">
          {language === 'ar'
            ? 'شاهد الصورة ورتب الحروف لتكوين الكلمة'
            : 'Look at the picture and arrange letters to form the word'
          }
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedDifficulty
          ? renderDifficultySelection()
          : !selectedCategory
          ? renderCategorySelection()
          : renderWordBuilder()
        }
      </AnimatePresence>

      {/* Celebration Popup */}
      <CelebrationPopup
        show={showCelebration}
        language={language}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default ArabicWordBuilder;
