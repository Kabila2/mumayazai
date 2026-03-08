import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playClickSound } from '../utils/soundEffects';
import { useVoiceOver } from '../hooks/useVoiceOver';
import './InteractiveStoryReader.css';

const stories = [
  {
    id: 1,
    title: 'القط الصغير',
    titleEn: 'The Little Cat',
    content: [
      {
        ar: 'كان ياما كان قط صغير اسمه مش مش',
        en: 'Once upon a time there was a little cat named Mish Mish',
        image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&q=80'
      },
      {
        ar: 'يحب اللعب في الحديقة كل يوم',
        en: 'He loved to play in the garden every day',
        image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80'
      },
      {
        ar: 'في يوم من الأيام وجد صديقاً جديداً',
        en: 'One day he found a new friend',
        image: 'https://images.unsplash.com/photo-1615789591457-74a63395c990?w=800&q=80'
      },
      {
        ar: 'وعاشوا في سعادة وسرور',
        en: 'And they lived happily ever after',
        image: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=800&q=80'
      }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
    videoUrl: 'https://www.youtube.com/embed/J---aiyznGQ'
  },
  {
    id: 2,
    title: 'الشجرة السعيدة',
    titleEn: 'The Happy Tree',
    content: [
      {
        ar: 'كانت هناك شجرة جميلة في الغابة',
        en: 'There was a beautiful tree in the forest',
        image: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80'
      },
      {
        ar: 'تحب مساعدة جميع الحيوانات',
        en: 'She loved helping all the animals',
        image: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&q=80'
      },
      {
        ar: 'أعطتهم الظل والفاكهة اللذيذة',
        en: 'She gave them shade and delicious fruit',
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784422?w=800&q=80'
      },
      {
        ar: 'وأصبحت أسعد شجرة في العالم',
        en: 'And became the happiest tree in the world',
        image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80'
      }
    ],
    thumbnail: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=400&q=80',
    videoUrl: 'https://www.youtube.com/embed/tRmRMnVULs8'
  }
];

const InteractiveStoryReader = ({ onClose, language = 'en' }) => {
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState('text'); // 'text' or 'video'
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isReading, setIsReading] = useState(false);

  // Voice Over hook for accessibility
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: false });

  const t = {
    en: {
      title: 'Story Reading',
      selectStory: 'Select a Story',
      next: 'Next',
      prev: 'Previous',
      finish: 'Finish',
      close: 'Close',
      back: 'Back',
      readStory: 'Read Story Aloud',
      stopReading: 'Stop Reading',
      textMode: 'Text Mode',
      videoMode: 'Video Mode'
    },
    ar: {
      title: 'قراءة القصص',
      selectStory: 'اختر قصة',
      next: 'التالي',
      prev: 'السابق',
      finish: 'إنهاء',
      close: 'إغلاق',
      back: 'رجوع',
      readStory: 'اقرأ القصة بصوت عالٍ',
      stopReading: 'إيقاف القراءة',
      textMode: 'وضع النص',
      videoMode: 'وضع الفيديو'
    }
  }[language] || {
    title: 'Story Reading',
    selectStory: 'Select a Story',
    next: 'Next',
    prev: 'Previous',
    finish: 'Finish',
    close: 'Close',
    back: 'Back',
    readStory: 'Read Story Aloud',
    stopReading: 'Stop Reading',
    textMode: 'Text Mode',
    videoMode: 'Video Mode'
  };

  // Reset word index when page changes
  useEffect(() => {
    setCurrentWordIndex(-1);
    setIsReading(false);
  }, [currentPage, selectedStory]);

  // Function to split text into words
  const getWords = (text) => {
    return text.split(' ');
  };

  // Function to read story word by word with highlighting
  const readStoryAloud = () => {
    if (!selectedStory) return;

    const content = selectedStory.content[currentPage];
    const text = language === 'ar' ? content.ar : content.en;
    const words = getWords(text);

    setIsReading(true);
    setCurrentWordIndex(0);

    let currentIndex = 0;

    const readNextWord = () => {
      if (currentIndex < words.length) {
        setCurrentWordIndex(currentIndex);

        // Use speech synthesis to read the word
        const utterance = new SpeechSynthesisUtterance(words[currentIndex]);
        utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
        utterance.rate = 0.8; // Slightly slower for better comprehension

        utterance.onend = () => {
          currentIndex++;
          if (currentIndex < words.length) {
            setTimeout(readNextWord, 200); // Small pause between words
          } else {
            setIsReading(false);
            setCurrentWordIndex(-1);
          }
        };

        window.speechSynthesis.speak(utterance);
      }
    };

    readNextWord();
  };

  // Function to stop reading
  const stopReading = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setCurrentWordIndex(-1);
  };

  const handleStorySelect = (story) => {
    playClickSound();
    setSelectedStory(story);

    // Announce story title
    voiceOver.speak(
      language === 'ar'
        ? `قصة ${story.title}`
        : `Story: ${story.titleEn}`,
      true
    );
  };

  const handleNextPage = () => {
    playClickSound();
    setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    playClickSound();
    setCurrentPage(Math.max(0, currentPage - 1));
  };

  const handleFinish = () => {
    playClickSound();
    voiceOver.speak(
      language === 'ar'
        ? 'أحسنت! أكملت القصة'
        : 'Well done! Story completed',
      true
    );
    setSelectedStory(null);
    setCurrentPage(0);
  };

  if (!selectedStory) {
    return (
      <motion.div
        className="story-reader-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <div className="story-reader-page">
          <div className="story-reader-header">
            <div className="header-left">
              <button className="back-button" onClick={onClose}>
                ← {t.back}
              </button>
              <h2>📚 {t.title}</h2>
            </div>
          </div>
          <div className="story-list" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h3>{t.selectStory}</h3>
            <div className="story-cards-grid">
              {stories.map((story) => (
                <motion.div
                  key={story.id}
                  className="story-card"
                  onClick={() => handleStorySelect(story)}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="story-thumbnail">
                    <img src={story.thumbnail} alt={story.titleEn} />
                  </div>
                  <div>
                    <h4>{language === 'ar' ? story.title : story.titleEn}</h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const currentContent = selectedStory.content[currentPage];

  // Render text with highlighted words
  const renderHighlightedText = (text, isArabic) => {
    const words = getWords(text);
    return (
      <div className={`story-text ${isArabic ? 'ar' : 'en'}`}>
        {words.map((word, index) => (
          <span
            key={index}
            className={currentWordIndex === index ? 'highlighted-word' : ''}
          >
            {word}{' '}
          </span>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      className="story-reader-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="story-reader-page reading">
        <div className="story-reader-header">
          <div className="header-left">
            <button className="back-button" onClick={() => setSelectedStory(null)}>
              ← {t.back}
            </button>
            <h2>📖 {language === 'ar' ? selectedStory.title : selectedStory.titleEn}</h2>
          </div>
          <div className="mode-toggle">
            <button
              className={`mode-btn ${viewMode === 'text' ? 'active' : ''}`}
              onClick={() => {
                playClickSound();
                setViewMode('text');
                stopReading();
              }}
            >
              📝 {t.textMode}
            </button>
            {selectedStory.videoUrl && (
              <button
                className={`mode-btn ${viewMode === 'video' ? 'active' : ''}`}
                onClick={() => {
                  playClickSound();
                  setViewMode('video');
                  stopReading();
                }}
              >
                🎥 {t.videoMode}
              </button>
            )}
          </div>
        </div>
        <div className="story-content" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {viewMode === 'video' && selectedStory.videoUrl ? (
            <div className="video-container">
              <iframe
                src={selectedStory.videoUrl}
                title={selectedStory.titleEn}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <>
              <div className="story-image-container">
                <img src={currentContent.image} alt="Story illustration" className="story-image" />
              </div>
              {renderHighlightedText(currentContent.ar, true)}
              {renderHighlightedText(currentContent.en, false)}
              <div className="read-aloud-controls">
                {!isReading ? (
                  <button className="read-btn" onClick={readStoryAloud}>
                    🔊 {t.readStory}
                  </button>
                ) : (
                  <button className="read-btn stop" onClick={stopReading}>
                    ⏹️ {t.stopReading}
                  </button>
                )}
              </div>
              <div className="story-progress">Page {currentPage + 1} of {selectedStory.content.length}</div>
            </>
          )}
        </div>
        <div className="story-navigation">
          <button className="nav-btn" onClick={handlePrevPage} disabled={currentPage === 0}>{t.prev}</button>
          {currentPage < selectedStory.content.length - 1 ? (
            <button className="nav-btn" onClick={handleNextPage}>{t.next}</button>
          ) : (
            <button className="nav-btn finish" onClick={handleFinish}>{t.finish}</button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InteractiveStoryReader;
