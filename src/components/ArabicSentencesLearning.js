import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ArabicSentencesLearning.css';

const ArabicSentencesLearning = ({ t, language, fontSize, highContrast, reducedMotion, speak }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [recallMode, setRecallMode] = useState(false);
  const [showRecallAnswer, setShowRecallAnswer] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [learnedSentences, setLearnedSentences] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const videoRef = React.useRef(null);

  // Mark sentence as learned
  const markSentenceAsLearned = (categoryId, sentenceIndex) => {
    const sentenceKey = `${categoryId}_${sentenceIndex}`;
    if (!learnedSentences.includes(sentenceKey)) {
      setLearnedSentences([...learnedSentences, sentenceKey]);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2500);
    }
  };

  const sentenceCategories = [
    {
      id: 'greetings',
      nameEn: 'Greetings',
      nameAr: 'التحيات',
      icon: '👋',
      color: '#10b981',
      sentences: [
        {
          arabic: 'السَّلامُ عَلَيْكُم',
          english: 'Peace be upon you',
          pronunciation: 'as-salamu alaykum',
          image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=300&fit=crop',
          video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          videoDescription: {
            en: 'Learn the traditional Islamic greeting and its proper usage in daily conversations',
            ar: 'تعلم التحية الإسلامية التقليدية واستخدامها الصحيح في المحادثات اليومية'
          },
          words: [
            { arabic: 'السَّلامُ', english: 'peace', pronunciation: 'as-salamu' },
            { arabic: 'عَلَيْكُم', english: 'upon you', pronunciation: 'alaykum' }
          ]
        },
        {
          arabic: 'صَباحُ الخَيْر',
          english: 'Good morning',
          pronunciation: 'sabah al-khayr',
          image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop',
          video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          videoDescription: {
            en: 'Master morning greetings in Arabic and learn when to use them in different contexts',
            ar: 'أتقن تحيات الصباح باللغة العربية وتعلم متى تستخدمها في سياقات مختلفة'
          },
          words: [
            { arabic: 'صَباحُ', english: 'morning', pronunciation: 'sabah' },
            { arabic: 'الخَيْر', english: 'the good', pronunciation: 'al-khayr' }
          ]
        },
        {
          arabic: 'كَيْفَ حالُكَ؟',
          english: 'How are you?',
          pronunciation: 'kayfa haluk',
          image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=300&fit=crop',
          video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          videoDescription: {
            en: 'Practice asking about someone\'s wellbeing and understand the cultural context',
            ar: 'تدرب على السؤال عن حال شخص ما وفهم السياق الثقافي'
          },
          words: [
            { arabic: 'كَيْفَ', english: 'how', pronunciation: 'kayfa' },
            { arabic: 'حالُكَ', english: 'your condition', pronunciation: 'haluk' }
          ]
        },
        {
          arabic: 'أَنا بِخَيْر',
          english: "I'm fine",
          pronunciation: 'ana bi-khayr',
          image: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=400&h=300&fit=crop',
          video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          videoDescription: {
            en: 'Learn different ways to respond positively about your wellbeing in Arabic',
            ar: 'تعلم طرق مختلفة للرد بشكل إيجابي عن حالك باللغة العربية'
          },
          words: [
            { arabic: 'أَنا', english: 'I', pronunciation: 'ana' },
            { arabic: 'بِخَيْر', english: 'fine/well', pronunciation: 'bi-khayr' }
          ]
        }
      ]
    },
    {
      id: 'daily',
      nameEn: 'Daily Life',
      nameAr: 'الحياة اليومية',
      icon: '🏠',
      color: '#f59e0b',
      sentences: [
        {
          arabic: 'أُحِبُّ الطَّعام',
          english: 'I love food',
          pronunciation: 'uhibbu at-ta\'am',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
          video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
          videoDescription: {
            en: 'Express your love for food and learn food-related vocabulary',
            ar: 'عبّر عن حبك للطعام وتعلم المفردات المتعلقة بالطعام'
          },
          words: [
            { arabic: 'أُحِبُّ', english: 'I love', pronunciation: 'uhibbu' },
            { arabic: 'الطَّعام', english: 'food', pronunciation: 'at-ta\'am' }
          ]
        },
        {
          arabic: 'أُريدُ ماء',
          english: 'I want water',
          pronunciation: 'uridu maa',
          image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop',
          words: [
            { arabic: 'أُريدُ', english: 'I want', pronunciation: 'uridu' },
            { arabic: 'ماء', english: 'water', pronunciation: 'maa' }
          ]
        },
        {
          arabic: 'البَيْتُ جَميل',
          english: 'The house is beautiful',
          pronunciation: 'al-baytu jameel',
          image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
          words: [
            { arabic: 'البَيْتُ', english: 'the house', pronunciation: 'al-baytu' },
            { arabic: 'جَميل', english: 'beautiful', pronunciation: 'jameel' }
          ]
        },
        {
          arabic: 'عائِلَتي كَبيرة',
          english: 'My family is big',
          pronunciation: 'aa\'ilati kabeera',
          image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop',
          words: [
            { arabic: 'عائِلَتي', english: 'my family', pronunciation: 'aa\'ilati' },
            { arabic: 'كَبيرة', english: 'big', pronunciation: 'kabeera' }
          ]
        }
      ]
    },
    {
      id: 'feelings',
      nameEn: 'Feelings',
      nameAr: 'المشاعر',
      icon: '😊',
      color: '#ec4899',
      sentences: [
        {
          arabic: 'أَنا سَعيد',
          english: 'I am happy',
          pronunciation: 'ana sa\'eed',
          image: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=400&h=300&fit=crop',
          words: [
            { arabic: 'أَنا', english: 'I', pronunciation: 'ana' },
            { arabic: 'سَعيد', english: 'happy', pronunciation: 'sa\'eed' }
          ]
        },
        {
          arabic: 'أُحِبُّكَ كَثيراً',
          english: 'I love you very much',
          pronunciation: 'uhibbuka katheeran',
          image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop',
          words: [
            { arabic: 'أُحِبُّكَ', english: 'I love you', pronunciation: 'uhibbuka' },
            { arabic: 'كَثيراً', english: 'very much', pronunciation: 'katheeran' }
          ]
        },
        {
          arabic: 'صَديقي لَطيف',
          english: 'My friend is kind',
          pronunciation: 'sadeeqi lateef',
          image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
          words: [
            { arabic: 'صَديقي', english: 'my friend', pronunciation: 'sadeeqi' },
            { arabic: 'لَطيف', english: 'kind', pronunciation: 'lateef' }
          ]
        },
        {
          arabic: 'شُكْراً جَزيلاً',
          english: 'Thank you very much',
          pronunciation: 'shukran jazeelan',
          image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=300&fit=crop',
          words: [
            { arabic: 'شُكْراً', english: 'thank you', pronunciation: 'shukran' },
            { arabic: 'جَزيلاً', english: 'very much', pronunciation: 'jazeelan' }
          ]
        }
      ]
    },
    {
      id: 'actions',
      nameEn: 'Actions',
      nameAr: 'الأفعال',
      icon: '🎯',
      color: '#8b5cf6',
      sentences: [
        {
          arabic: 'أَذْهَبُ إلى المَدْرَسة',
          english: 'I go to school',
          pronunciation: 'adh-habu ila al-madrasa',
          image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop',
          words: [
            { arabic: 'أَذْهَبُ', english: 'I go', pronunciation: 'adh-habu' },
            { arabic: 'إلى', english: 'to', pronunciation: 'ila' },
            { arabic: 'المَدْرَسة', english: 'the school', pronunciation: 'al-madrasa' }
          ]
        },
        {
          arabic: 'أَلْعَبُ مَعَ أَصْدِقائي',
          english: 'I play with my friends',
          pronunciation: 'al\'abu ma\'a asdiqaa\'i',
          image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop',
          words: [
            { arabic: 'أَلْعَبُ', english: 'I play', pronunciation: 'al\'abu' },
            { arabic: 'مَعَ', english: 'with', pronunciation: 'ma\'a' },
            { arabic: 'أَصْدِقائي', english: 'my friends', pronunciation: 'asdiqaa\'i' }
          ]
        },
        {
          arabic: 'أَقْرَأُ كِتاباً',
          english: 'I read a book',
          pronunciation: 'aqra\'u kitaban',
          image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop',
          words: [
            { arabic: 'أَقْرَأُ', english: 'I read', pronunciation: 'aqra\'u' },
            { arabic: 'كِتاباً', english: 'a book', pronunciation: 'kitaban' }
          ]
        },
        {
          arabic: 'أَكْتُبُ الدَّرْس',
          english: 'I write the lesson',
          pronunciation: 'aktubu ad-dars',
          image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop',
          words: [
            { arabic: 'أَكْتُبُ', english: 'I write', pronunciation: 'aktubu' },
            { arabic: 'الدَّرْس', english: 'the lesson', pronunciation: 'ad-dars' }
          ]
        }
      ]
    }
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentSentenceIndex(0);
    setRecallMode(false);
    setShowRecallAnswer(false);
    setShowVideo(true);
  };

  const handleNextSentence = () => {
    if (selectedCategory && currentSentenceIndex < selectedCategory.sentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
      setShowRecallAnswer(false);
      setShowVideo(true);
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  };

  const handlePreviousSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1);
      setShowRecallAnswer(false);
      setShowVideo(true);
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  };

  const renderCategorySelection = () => (
    <div className="sentences-categories">
      <h2 className="categories-title">
        {language === 'ar' ? 'اختر فئة' : 'Choose a Category'}
      </h2>
      <div className="categories-grid">
        {sentenceCategories.map((category) => (
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
              {category.sentences.length} {language === 'ar' ? 'جمل' : 'sentences'}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderSentenceLearning = () => {
    const currentSentence = selectedCategory.sentences[currentSentenceIndex];

    return (
      <div className="sentence-learning">
        <div className="learning-navigation">
          <button
            className="back-to-categories-btn"
            onClick={() => setSelectedCategory(null)}
          >
            ← {language === 'ar' ? 'عودة' : 'Back'}
          </button>
          <div className="category-badge" style={{ background: selectedCategory.color }}>
            {selectedCategory.icon} {language === 'ar' ? selectedCategory.nameAr : selectedCategory.nameEn}
          </div>
          <button
            className={`recall-mode-btn ${recallMode ? 'active' : ''}`}
            onClick={() => {
              setRecallMode(!recallMode);
              setShowRecallAnswer(false);
            }}
          >
            {language === 'ar' ? (recallMode ? 'وضع التعلم' : 'وضع التذكر') : (recallMode ? 'Learn Mode' : 'Recall Mode')}
          </button>
        </div>

        <div className="sentence-progress">
          {selectedCategory.sentences.map((_, index) => (
            <span
              key={index}
              className={`progress-dot ${index === currentSentenceIndex ? 'active' : ''}`}
              style={{ background: index === currentSentenceIndex ? selectedCategory.color : '#d1d5db' }}
            />
          ))}
        </div>

        <motion.div
          key={currentSentenceIndex}
          className="sentence-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {currentSentence.video && (
            <div className="video-section">
              <div className="video-header">
                <h3 className="video-title">
                  📹 {language === 'ar' ? 'شاهد الفيديو التوضيحي' : 'Watch Explanation Video'}
                </h3>
                <p className="video-description">
                  {language === 'ar' ? currentSentence.videoDescription?.ar : currentSentence.videoDescription?.en}
                </p>
              </div>
              {showVideo ? (
                <div className="video-container">
                  <video
                    ref={videoRef}
                    className="sentence-video"
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                  >
                    <source src={currentSentence.video} type="video/mp4" />
                    {language === 'ar'
                      ? 'متصفحك لا يدعم تشغيل الفيديو.'
                      : 'Your browser does not support the video tag.'
                    }
                  </video>
                  <button
                    className="toggle-media-btn"
                    onClick={() => setShowVideo(false)}
                  >
                    {language === 'ar' ? 'إظهار الصورة بدلاً' : 'Show Image Instead'}
                  </button>
                </div>
              ) : (
                <div className="sentence-image-container">
                  <img
                    src={currentSentence.image}
                    alt={currentSentence.english}
                    className="sentence-image"
                    loading="lazy"
                  />
                  <button
                    className="toggle-media-btn"
                    onClick={() => setShowVideo(true)}
                  >
                    {language === 'ar' ? 'إظهار الفيديو بدلاً' : 'Show Video Instead'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="sentence-main">
            <div className="arabic-sentence">
              {currentSentence.arabic}
            </div>

            {recallMode ? (
              <div
                className="sentence-translation recall-clickable"
                onClick={() => setShowRecallAnswer(!showRecallAnswer)}
              >
                {showRecallAnswer ? (
                  currentSentence.english
                ) : (
                  <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>
                    {language === 'ar' ? 'انقر للكشف عن المعنى' : 'Click to reveal meaning'}
                  </span>
                )}
              </div>
            ) : (
              <div className="sentence-translation">
                {currentSentence.english}
              </div>
            )}

            <div className="sentence-pronunciation">
              {currentSentence.pronunciation}
            </div>
          </div>

          <div className="word-breakdown">
            <h3 className="breakdown-title">
              {language === 'ar' ? 'تفصيل الكلمات' : 'Word Breakdown'}
            </h3>
            <div className="words-grid">
              {currentSentence.words.map((word, index) => (
                <motion.div
                  key={index}
                  className="word-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="word-arabic">{word.arabic}</div>
                  <div className="word-english">{word.english}</div>
                  <div className="word-pronunciation">{word.pronunciation}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* I Got It Button */}
          <motion.button
            className={`got-it-btn ${learnedSentences.includes(`${selectedCategory.id}_${currentSentenceIndex}`) ? 'learned' : ''}`}
            onClick={() => markSentenceAsLearned(selectedCategory.id, currentSentenceIndex)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: learnedSentences.includes(`${selectedCategory.id}_${currentSentenceIndex}`)
                ? '#10b981'
                : selectedCategory.color
            }}
          >
            {learnedSentences.includes(`${selectedCategory.id}_${currentSentenceIndex}`) ? (
              <>
                ✓ {language === 'ar' ? 'تم التعلم!' : 'Learned!'}
              </>
            ) : (
              <>
                ⭐ {language === 'ar' ? 'فهمت!' : 'I Got It!'}
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Celebration Animation */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              className="celebration-overlay"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="celebration-content">
                <motion.div
                  className="celebration-emoji"
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, repeat: 1 }}
                >
                  🎉 ⭐ 🎊
                </motion.div>
                <div className="celebration-text">
                  {language === 'ar' ? 'أحسنت!' : 'Great Job!'}
                </div>
                <div className="celebration-subtext">
                  {language === 'ar' ? 'لقد أتقنت هذه الجملة!' : 'You mastered this sentence!'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="sentence-navigation">
          <button
            className="nav-btn-large nav-prev"
            onClick={handlePreviousSentence}
            disabled={currentSentenceIndex === 0}
          >
            <span className="nav-icon">←</span>
            <span className="nav-text">{language === 'ar' ? 'السابق' : 'Previous'}</span>
          </button>

          <button
            className="nav-btn-large nav-next"
            onClick={handleNextSentence}
            disabled={currentSentenceIndex === selectedCategory.sentences.length - 1}
          >
            <span className="nav-text">{language === 'ar' ? 'التالي' : 'Next'}</span>
            <span className="nav-icon">→</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="arabic-sentences-learning">
      <div className="sentences-header">
        <h1 className="sentences-title">
          {language === 'ar' ? 'تعلم الجمل العربية' : 'Learn Arabic Sentences'}
        </h1>
        <p className="sentences-subtitle">
          {language === 'ar'
            ? 'تعلم كيفية تكوين الجمل من الكلمات'
            : 'Learn how to form sentences from words'
          }
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedCategory ? renderCategorySelection() : renderSentenceLearning()}
      </AnimatePresence>
    </div>
  );
};

export default ArabicSentencesLearning;
