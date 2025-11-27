import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import './ArabicAlphabetLearning.css';
import PointNotification from './PointNotification';
import { awardPoints, POINT_VALUES } from '../utils/pointsUtils';

const arabicAlphabet = [
  { letter: 'ا', name: 'ألف', pronunciation: 'alif', english: 'A', word: 'أسد', wordMeaning: 'lion', emoji: '🦁', category: 'vowel' },
  { letter: 'ب', name: 'باء', pronunciation: 'baa', english: 'B', word: 'بطة', wordMeaning: 'duck', emoji: '🦆', category: 'consonant' },
  { letter: 'ت', name: 'تاء', pronunciation: 'taa', english: 'T', word: 'تفاحة', wordMeaning: 'apple', emoji: '🍎', category: 'consonant' },
  { letter: 'ث', name: 'ثاء', pronunciation: 'thaa', english: 'Th', word: 'ثلج', wordMeaning: 'snow', emoji: '❄️', category: 'consonant' },
  { letter: 'ج', name: 'جيم', pronunciation: 'jeem', english: 'J', word: 'جمل', wordMeaning: 'camel', emoji: '🐫', category: 'consonant' },
  { letter: 'ح', name: 'حاء', pronunciation: 'haa', english: 'H', word: 'حصان', wordMeaning: 'horse', emoji: '🐴', category: 'consonant' },
  { letter: 'خ', name: 'خاء', pronunciation: 'khaa', english: 'Kh', word: 'خروف', wordMeaning: 'sheep', emoji: '🐑', category: 'consonant' },
  { letter: 'د', name: 'دال', pronunciation: 'daal', english: 'D', word: 'دب', wordMeaning: 'bear', emoji: '🐻', category: 'consonant' },
  { letter: 'ذ', name: 'ذال', pronunciation: 'dhaal', english: 'Dh', word: 'ذئب', wordMeaning: 'wolf', emoji: '🐺', category: 'consonant' },
  { letter: 'ر', name: 'راء', pronunciation: 'raa', english: 'R', word: 'رقم', wordMeaning: 'number', emoji: '🔢', category: 'consonant' },
  { letter: 'ز', name: 'زاي', pronunciation: 'zaay', english: 'Z', word: 'زهرة', wordMeaning: 'flower', emoji: '🌸', category: 'consonant' },
  { letter: 'س', name: 'سين', pronunciation: 'seen', english: 'S', word: 'سمك', wordMeaning: 'fish', emoji: '🐟', category: 'consonant' },
  { letter: 'ش', name: 'شين', pronunciation: 'sheen', english: 'Sh', word: 'شمس', wordMeaning: 'sun', emoji: '☀️', category: 'consonant' },
  { letter: 'ص', name: 'صاد', pronunciation: 'saad', english: 'S', word: 'صقر', wordMeaning: 'falcon', emoji: '🦅', category: 'consonant' },
  { letter: 'ض', name: 'ضاد', pronunciation: 'daad', english: 'D', word: 'ضفدع', wordMeaning: 'frog', emoji: '🐸', category: 'consonant' },
  { letter: 'ط', name: 'طاء', pronunciation: 'taa', english: 'T', word: 'طائر', wordMeaning: 'bird', emoji: '🐦', category: 'consonant' },
  { letter: 'ظ', name: 'ظاء', pronunciation: 'dhaa', english: 'Dh', word: 'ظبي', wordMeaning: 'deer', emoji: '🦌', category: 'consonant' },
  { letter: 'ع', name: 'عين', pronunciation: 'ayn', english: 'A', word: 'عين', wordMeaning: 'eye', emoji: '👁️', category: 'consonant' },
  { letter: 'غ', name: 'غين', pronunciation: 'ghayn', english: 'Gh', word: 'غراب', wordMeaning: 'crow', emoji: '🐦‍⬛', category: 'consonant' },
  { letter: 'ف', name: 'فاء', pronunciation: 'faa', english: 'F', word: 'فيل', wordMeaning: 'elephant', emoji: '🐘', category: 'consonant' },
  { letter: 'ق', name: 'قاف', pronunciation: 'qaaf', english: 'Q', word: 'قطة', wordMeaning: 'cat', emoji: '🐱', category: 'consonant' },
  { letter: 'ك', name: 'كاف', pronunciation: 'kaaf', english: 'K', word: 'كلب', wordMeaning: 'dog', emoji: '🐕', category: 'consonant' },
  { letter: 'ل', name: 'لام', pronunciation: 'laam', english: 'L', word: 'ليمون', wordMeaning: 'lemon', emoji: '🍋', category: 'consonant' },
  { letter: 'م', name: 'ميم', pronunciation: 'meem', english: 'M', word: 'ماء', wordMeaning: 'water', emoji: '💧', category: 'consonant' },
  { letter: 'ن', name: 'نون', pronunciation: 'noon', english: 'N', word: 'نمر', wordMeaning: 'tiger', emoji: '🐯', category: 'consonant' },
  { letter: 'ه', name: 'هاء', pronunciation: 'haa', english: 'H', word: 'هدية', wordMeaning: 'gift', emoji: '🎁', category: 'consonant' },
  { letter: 'و', name: 'واو', pronunciation: 'waaw', english: 'W', word: 'وردة', wordMeaning: 'rose', emoji: '🌹', category: 'vowel' },
  { letter: 'ي', name: 'ياء', pronunciation: 'yaa', english: 'Y', word: 'يد', wordMeaning: 'hand', emoji: '✋', category: 'vowel' }
];

const ArabicAlphabetLearning = ({ t, language, fontSize, highContrast, reducedMotion, speak }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedLetters, setLearnedLetters] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const [voices, setVoices] = useState([]);

  const currentLetter = arabicAlphabet[currentIndex];

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      console.log('=== AVAILABLE VOICES ===');
      availableVoices.forEach((v, i) => {
        console.log(`${i + 1}. ${v.name} (${v.lang}) - ${v.localService ? 'Local' : 'Remote'}`);
      });
      console.log('======================');

      // Check for Arabic voices specifically
      const arabicVoices = availableVoices.filter(v =>
        v.lang.toLowerCase().includes('ar') ||
        v.name.toLowerCase().includes('arabic')
      );
      console.log('Arabic voices found:', arabicVoices.length);
      arabicVoices.forEach(v => console.log(`  - ${v.name} (${v.lang})`));
    };

    // Load voices immediately
    loadVoices();

    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Get user email on mount
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("mumayaz_session") || "{}");
      if (session.email) {
        setUserEmail(session.email);

        // Load learned letters
        const learned = JSON.parse(localStorage.getItem(`alphabet_learned_${session.email}`) || '[]');
        setLearnedLetters(learned);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }

    // Cleanup: Cancel any ongoing speech when component unmounts
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);


  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch(e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextLetter();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousLetter();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  const getArabicVoice = () => {
    if (voices.length === 0) {
      console.log('No voices loaded yet');
      return null;
    }

    // Try multiple patterns to find an Arabic voice
    let arabicVoice = voices.find(voice =>
      voice.lang.toLowerCase().startsWith('ar')
    );

    if (!arabicVoice) {
      arabicVoice = voices.find(voice =>
        voice.lang.toLowerCase().includes('ar-')
      );
    }

    if (!arabicVoice) {
      arabicVoice = voices.find(voice =>
        voice.name.toLowerCase().includes('arabic')
      );
    }

    // If still no Arabic voice, try to find any voice that might work with Arabic
    if (!arabicVoice) {
      // Use the first available voice as fallback
      arabicVoice = voices[0];
      console.log('No Arabic voice found. Using fallback:', arabicVoice ? `${arabicVoice.name} (${arabicVoice.lang})` : 'None');
    } else {
      console.log('Selected Arabic voice:', `${arabicVoice.name} (${arabicVoice.lang})`);
    }

    return arabicVoice;
  };

  const speakLetter = () => {
    if ('speechSynthesis' in window) {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Small delay to ensure cancel completes
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(currentLetter.name);

          // Don't set a specific voice - let the browser choose based on lang
          // This allows Chrome to use Google's remote Arabic TTS
          utterance.lang = 'ar-SA'; // Arabic language (Saudi Arabia)
          utterance.rate = 0.8; // Slower for clarity
          utterance.pitch = 1;
          utterance.volume = 1;

          console.log('Speaking letter:', currentLetter.name, 'with lang: ar-SA');

          utterance.onerror = (event) => {
            console.error('Speech error:', event.error);
          };

          utterance.onend = () => {
            console.log('Speech ended successfully');
          };

          utterance.onstart = () => {
            console.log('Speech started');
          };

          window.speechSynthesis.speak(utterance);
        }, 100);
      } catch (error) {
        console.error('Error speaking letter:', error);
      }
    } else {
      console.warn('Speech synthesis not supported');
    }
  };

  const speakWord = () => {
    if ('speechSynthesis' in window) {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Small delay to ensure cancel completes
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(currentLetter.word);

          // Don't set a specific voice - let the browser choose based on lang
          // This allows Chrome to use Google's remote Arabic TTS
          utterance.lang = 'ar-SA'; // Arabic language (Saudi Arabia)
          utterance.rate = 0.8; // Slower for clarity
          utterance.pitch = 1;
          utterance.volume = 1;

          console.log('Speaking word:', currentLetter.word, 'with lang: ar-SA');

          utterance.onerror = (event) => {
            console.error('Speech error:', event.error);
          };

          utterance.onend = () => {
            console.log('Speech ended successfully');
          };

          utterance.onstart = () => {
            console.log('Speech started');
          };

          window.speechSynthesis.speak(utterance);
        }, 100);
      } catch (error) {
        console.error('Error speaking word:', error);
      }
    } else {
      console.warn('Speech synthesis not supported');
    }
  };

  const nextLetter = () => {
    // Cancel any ongoing speech when navigating
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentIndex((prev) => (prev + 1) % arabicAlphabet.length);
    markLetterAsViewed();
  };

  const previousLetter = () => {
    // Cancel any ongoing speech when navigating
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentIndex((prev) => (prev - 1 + arabicAlphabet.length) % arabicAlphabet.length);
    markLetterAsViewed();
  };

  // Mark letter as learned and award points
  const markLetterAsLearned = () => {
    if (!userEmail || learnedLetters.includes(currentLetter.letter)) return;

    const newLearned = [...learnedLetters, currentLetter.letter];
    setLearnedLetters(newLearned);

    localStorage.setItem(`alphabet_learned_${userEmail}`, JSON.stringify(newLearned));

    // Award points for learning a letter
    awardPoints(userEmail, 'LETTER_LEARNED');

    // Check if completed all letters
    if (newLearned.length === arabicAlphabet.length) {
      awardPoints(userEmail, 'MODULE_COMPLETED');
    }
  };

  // Mark letter as viewed (for tracking activity)
  const markLetterAsViewed = () => {
    if (!userEmail) return;

    // Award points for first-time viewing
    const viewedKey = `alphabet_viewed_${userEmail}`;
    const viewed = JSON.parse(localStorage.getItem(viewedKey) || '[]');

    if (!viewed.includes(currentLetter.letter)) {
      viewed.push(currentLetter.letter);
      localStorage.setItem(viewedKey, JSON.stringify(viewed));

      // Small points for viewing
      awardPoints(userEmail, 'LETTER_LEARNED', 0.2); // 1 point for viewing
    }
  };


  return (
    <div className="arabic-alphabet-learning">
      {/* Point Notification */}
      {userEmail && <PointNotification userEmail={userEmail} language={language} />}

      <div className="learning-header">
        <h2 className="learning-title">
          {language === 'ar' ? 'تعلم الحروف العربية' : 'Learn Arabic Alphabet'}
        </h2>
      </div>

      {/* Card View */}
      <div className="letter-container">
        <motion.div
          key={currentIndex}
          className="letter-card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, type: "spring" }}
        >
          <div className="letter-display" onClick={speakLetter}>
            <motion.div
              className="arabic-letter"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {currentLetter.letter}
            </motion.div>
            <div className="letter-name">{currentLetter.name}</div>
            <div className="letter-pronunciation">
              {language === 'ar' ? currentLetter.pronunciation : `(${currentLetter.pronunciation})`}
            </div>
            <div className="pronunciation-hint">
              🔊 {language === 'ar' ? 'اضغط للاستماع' : 'Click to hear'}
            </div>
          </div>

          {/* Visual Example - Image/Emoji */}
          <motion.div
            key={`visual-${currentIndex}`}
            className="letter-visual"
            onClick={speakWord}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="visual-emoji">{currentLetter.emoji}</div>
            <div className="visual-word">
              <div className="arabic-word-main">{currentLetter.word}</div>
              <div className="word-meaning-main">
                ({currentLetter.wordMeaning})
              </div>
              <div className="word-pronunciation-hint">
                🔊 {language === 'ar' ? 'اضغط لسماع الكلمة' : 'Click to hear word'}
              </div>
            </div>
          </motion.div>

          <div className="letter-info">
            <div className="english-equivalent">
              {language === 'ar' ? 'بالإنجليزية' : 'English'}: <strong>{currentLetter.english}</strong>
            </div>
          </div>

          {/* Mark as Learned Button */}
          {userEmail && !learnedLetters.includes(currentLetter.letter) && (
            <motion.button
              className="mark-learned-btn"
              onClick={markLetterAsLearned}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              ✓ {language === 'ar' ? 'علّم كمتعلم' : 'Mark as Learned'}
              <span className="points-badge">+{POINT_VALUES.LETTER_LEARNED}</span>
            </motion.button>
          )}

          {userEmail && learnedLetters.includes(currentLetter.letter) && (
            <div className="learned-badge">
              ✓ {language === 'ar' ? 'متعلم' : 'Learned'}
            </div>
          )}
        </motion.div>
      </div>

      {/* Navigation Controls */}
      <div className="navigation-controls">
        <motion.button
          className="nav-btn prev"
          onClick={previousLetter}
          whileHover={{ scale: 1.1, x: -3 }}
          whileTap={{ scale: 0.9 }}
        >
          {language === 'ar' ? '→' : '←'}
        </motion.button>

        <div className="progress-section">
          <div className="progress-indicator">
            {currentIndex + 1} / {arabicAlphabet.length}
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / arabicAlphabet.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <motion.button
          className="nav-btn next"
          onClick={nextLetter}
          whileHover={{ scale: 1.1, x: 3 }}
          whileTap={{ scale: 0.9 }}
        >
          {language === 'ar' ? '←' : '→'}
        </motion.button>
      </div>
    </div>
  );
};

export default ArabicAlphabetLearning;