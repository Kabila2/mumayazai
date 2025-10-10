import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ArabicWordsLearning.css';

const ArabicWordsLearning = ({ t, language, fontSize, highContrast, reducedMotion, speak }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  // Word categories with real image URLs from Unsplash
  const wordCategories = [
    {
      id: 'animals',
      nameEn: 'Animals',
      nameAr: 'الحيوانات',
      icon: '🐾',
      color: '#10b981',
      words: [
        {
          arabic: 'قِطَّة',
          english: 'Cat',
          syllables: ['قِطْ', 'طَة'],
          pronunciation: ['qiṭ', 'ṭa'],
          image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop'
        },
        {
          arabic: 'كَلْب',
          english: 'Dog',
          syllables: ['كَلْب'],
          pronunciation: ['kalb'],
          image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop'
        },
        {
          arabic: 'طَائِر',
          english: 'Bird',
          syllables: ['طَا', 'ئِر'],
          pronunciation: ["ṭā", "'ir"],
          image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&h=300&fit=crop'
        },
        {
          arabic: 'سَمَكَة',
          english: 'Fish',
          syllables: ['سَ', 'مَ', 'كَة'],
          pronunciation: ['sa', 'ma', 'ka'],
          image: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&h=300&fit=crop'
        },
        {
          arabic: 'فَرَس',
          english: 'Horse',
          syllables: ['فَ', 'رَس'],
          pronunciation: ['fa', 'ras'],
          image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&h=300&fit=crop'
        },
        {
          arabic: 'أَرْنَب',
          english: 'Rabbit',
          syllables: ['أَرْ', 'نَب'],
          pronunciation: ['ar', 'nab'],
          image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop'
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
        {
          arabic: 'تُفَّاحَة',
          english: 'Apple',
          syllables: ['تُفْ', 'فَا', 'حَة'],
          pronunciation: ['tuf', 'fā', 'ḥa'],
          image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop'
        },
        {
          arabic: 'مَوْزَة',
          english: 'Banana',
          syllables: ['مَوْ', 'زَة'],
          pronunciation: ['maw', 'za'],
          image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&h=300&fit=crop'
        },
        {
          arabic: 'خُبْز',
          english: 'Bread',
          syllables: ['خُبْز'],
          pronunciation: ['khubz'],
          image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop'
        },
        {
          arabic: 'مَاء',
          english: 'Water',
          syllables: ['مَاء'],
          pronunciation: ["mā'"],
          image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop'
        },
        {
          arabic: 'حَلِيب',
          english: 'Milk',
          syllables: ['حَ', 'لِيب'],
          pronunciation: ['ḥa', 'līb'],
          image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop'
        },
        {
          arabic: 'بُرْتُقَال',
          english: 'Orange',
          syllables: ['بُرْ', 'تُ', 'قَال'],
          pronunciation: ['bur', 'tu', 'qāl'],
          image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=300&fit=crop'
        }
      ]
    },
    {
      id: 'family',
      nameEn: 'Family',
      nameAr: 'العائلة',
      icon: '👨‍👩‍👧‍👦',
      color: '#ec4899',
      words: [
        {
          arabic: 'أُمّ',
          english: 'Mother',
          syllables: ['أُمّ'],
          pronunciation: ['umm'],
          image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400&h=300&fit=crop'
        },
        {
          arabic: 'أَب',
          english: 'Father',
          syllables: ['أَب'],
          pronunciation: ['ab'],
          image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop'
        },
        {
          arabic: 'أَخ',
          english: 'Brother',
          syllables: ['أَخ'],
          pronunciation: ['akh'],
          image: 'https://images.unsplash.com/photo-1519764622345-23439dd774f7?w=400&h=300&fit=crop'
        },
        {
          arabic: 'أُخْت',
          english: 'Sister',
          syllables: ['أُخْت'],
          pronunciation: ['ukht'],
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop'
        },
        {
          arabic: 'جَدّ',
          english: 'Grandfather',
          syllables: ['جَدّ'],
          pronunciation: ['jadd'],
          image: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=400&h=300&fit=crop'
        },
        {
          arabic: 'جَدَّة',
          english: 'Grandmother',
          syllables: ['جَدْ', 'دَة'],
          pronunciation: ['jad', 'da'],
          image: 'https://images.unsplash.com/photo-1595433563697-2e0b17f2d1d3?w=400&h=300&fit=crop'
        }
      ]
    },
    {
      id: 'nature',
      nameEn: 'Nature',
      nameAr: 'الطبيعة',
      icon: '🌳',
      color: '#14b8a6',
      words: [
        {
          arabic: 'شَمْس',
          english: 'Sun',
          syllables: ['شَمْس'],
          pronunciation: ['shams'],
          image: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&h=300&fit=crop'
        },
        {
          arabic: 'قَمَر',
          english: 'Moon',
          syllables: ['قَ', 'مَر'],
          pronunciation: ['qa', 'mar'],
          image: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=400&h=300&fit=crop'
        },
        {
          arabic: 'شَجَرَة',
          english: 'Tree',
          syllables: ['شَ', 'جَ', 'رَة'],
          pronunciation: ['sha', 'ja', 'ra'],
          image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&h=300&fit=crop'
        },
        {
          arabic: 'وَرْدَة',
          english: 'Flower',
          syllables: ['وَرْ', 'دَة'],
          pronunciation: ['war', 'da'],
          image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop'
        },
        {
          arabic: 'نَجْمَة',
          english: 'Star',
          syllables: ['نَجْ', 'مَة'],
          pronunciation: ['naj', 'ma'],
          image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop'
        },
        {
          arabic: 'بَحْر',
          english: 'Sea',
          syllables: ['بَحْر'],
          pronunciation: ['baḥr'],
          image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=300&fit=crop'
        }
      ]
    },
    {
      id: 'home',
      nameEn: 'Home',
      nameAr: 'البيت',
      icon: '🏠',
      color: '#8b5cf6',
      words: [
        {
          arabic: 'بَيْت',
          english: 'House',
          syllables: ['بَيْت'],
          pronunciation: ['bayt'],
          image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop'
        },
        {
          arabic: 'كُرْسِي',
          english: 'Chair',
          syllables: ['كُرْ', 'سِي'],
          pronunciation: ['kur', 'sī'],
          image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=300&fit=crop'
        },
        {
          arabic: 'طَاوِلَة',
          english: 'Table',
          syllables: ['طَا', 'وِ', 'لَة'],
          pronunciation: ['ṭā', 'wi', 'la'],
          image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=400&h=300&fit=crop'
        },
        {
          arabic: 'سَرِير',
          english: 'Bed',
          syllables: ['سَ', 'رِير'],
          pronunciation: ['sa', 'rīr'],
          image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop'
        },
        {
          arabic: 'بَاب',
          english: 'Door',
          syllables: ['بَاب'],
          pronunciation: ['bāb'],
          image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=300&fit=crop'
        },
        {
          arabic: 'نَافِذَة',
          english: 'Window',
          syllables: ['نَا', 'فِ', 'ذَة'],
          pronunciation: ['nā', 'fi', 'dha'],
          image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop'
        }
      ]
    },
    {
      id: 'school',
      nameEn: 'School',
      nameAr: 'المدرسة',
      icon: '📚',
      color: '#3b82f6',
      words: [
        {
          arabic: 'كِتَاب',
          english: 'Book',
          syllables: ['كِ', 'تَاب'],
          pronunciation: ['ki', 'tāb'],
          image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop'
        },
        {
          arabic: 'قَلَم',
          english: 'Pen',
          syllables: ['قَ', 'لَم'],
          pronunciation: ['qa', 'lam'],
          image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400&h=300&fit=crop'
        },
        {
          arabic: 'دَفْتَر',
          english: 'Notebook',
          syllables: ['دَفْ', 'تَر'],
          pronunciation: ['daf', 'tar'],
          image: 'https://images.unsplash.com/photo-1517842536009-fcf21f2e1022?w=400&h=300&fit=crop'
        },
        {
          arabic: 'حَقِيبَة',
          english: 'Bag',
          syllables: ['حَ', 'قِي', 'بَة'],
          pronunciation: ['ḥa', 'qī', 'ba'],
          image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop'
        },
        {
          arabic: 'مَكْتَب',
          english: 'Desk',
          syllables: ['مَكْ', 'تَب'],
          pronunciation: ['mak', 'tab'],
          image: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=400&h=300&fit=crop'
        },
        {
          arabic: 'مَدْرَسَة',
          english: 'School',
          syllables: ['مَدْ', 'رَ', 'سَة'],
          pronunciation: ['mad', 'ra', 'sa'],
          image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop'
        }
      ]
    }
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentWordIndex(0);
    setShowTranslation(false);
  };

  const handleNextWord = () => {
    if (selectedCategory && currentWordIndex < selectedCategory.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setShowTranslation(false);
    }
  };

  const handlePreviousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
      setShowTranslation(false);
    }
  };

  const toggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

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

    return (
      <div className="word-learning">
        <div className="learning-navigation">
          <button
            className="back-to-categories-btn"
            onClick={() => setSelectedCategory(null)}
          >
            ← {language === 'ar' ? 'العودة للفئات' : 'Back to Categories'}
          </button>
          <div className="category-badge" style={{ background: selectedCategory.color }}>
            {selectedCategory.icon} {language === 'ar' ? selectedCategory.nameAr : selectedCategory.nameEn}
          </div>
        </div>

        <div className="word-progress">
          <div className="progress-text">
            {currentWordIndex + 1} / {selectedCategory.words.length}
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{
                width: `${((currentWordIndex + 1) / selectedCategory.words.length) * 100}%`,
                background: selectedCategory.color
              }}
            />
          </div>
        </div>

        <motion.div
          key={currentWordIndex}
          className="word-card"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
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

          <div className="word-content">
            <div className="arabic-word">
              {currentWord.arabic}
            </div>

            <div className="syllables-section">
              <h3 className="syllables-title">
                {language === 'ar' ? 'المقاطع:' : 'Syllables:'}
              </h3>
              <div className="syllables-container">
                {currentWord.syllables.map((syllable, index) => (
                  <div key={index} className="syllable-item">
                    <div className="syllable-arabic">{syllable}</div>
                    <div className="syllable-pronunciation">{currentWord.pronunciation[index]}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="translation-toggle-btn"
              onClick={toggleTranslation}
            >
              {showTranslation
                ? (language === 'ar' ? 'إخفاء الترجمة' : 'Hide Translation')
                : (language === 'ar' ? 'عرض الترجمة' : 'Show Translation')
              }
            </button>

            <AnimatePresence>
              {showTranslation && (
                <motion.div
                  className="translation"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentWord.english}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="word-navigation">
          <button
            className="nav-btn"
            onClick={handlePreviousWord}
            disabled={currentWordIndex === 0}
          >
            ← {language === 'ar' ? 'السابق' : 'Previous'}
          </button>
          <button
            className="nav-btn"
            onClick={handleNextWord}
            disabled={currentWordIndex === selectedCategory.words.length - 1}
          >
            {language === 'ar' ? 'التالي' : 'Next'} →
          </button>
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
