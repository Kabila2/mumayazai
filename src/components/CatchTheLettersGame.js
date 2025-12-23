import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceOver } from '../hooks/useVoiceOver';
import { playClickSound } from '../utils/soundEffects';
import CelebrationPopup from './CelebrationPopup';
import './CatchTheLettersGame.css';

const CatchTheLettersGame = ({ language = 'en' }) => {
  const [fallingLetters, setFallingLetters] = useState([]);
  const [basketPosition, setBasketPosition] = useState(50);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [currentTarget, setCurrentTarget] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [level, setLevel] = useState(1);
  const letterIdRef = useRef(0);
  const spawnIntervalRef = useRef(null);

  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  const arabicLetters = [
    'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر',
    'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
    'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
  ];

  const englishLetters = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z'
  ];

  const letters = language === 'ar' ? arabicLetters : englishLetters;

  const t = {
    en: {
      title: 'Catch the Letters',
      instruction: 'Catch the letter:',
      score: 'Score:',
      lives: 'Lives:',
      level: 'Level:',
      start: 'Start Game',
      gameOver: 'Game Over!',
      finalScore: 'Final Score:',
      playAgain: 'Play Again',
      great: 'Great catch!',
      wrong: 'Wrong letter!',
      missed: 'Missed!'
    },
    ar: {
      title: 'امسك الحروف',
      instruction: 'امسك الحرف:',
      score: 'النتيجة:',
      lives: 'الأرواح:',
      level: 'المستوى:',
      start: 'ابدأ اللعبة',
      gameOver: 'انتهت اللعبة!',
      finalScore: 'النتيجة النهائية:',
      playAgain: 'العب مرة أخرى',
      great: 'التقاط رائع!',
      wrong: 'حرف خاطئ!',
      missed: 'فاتك!'
    }
  };

  const currentLang = t[language] || t.en;

  useEffect(() => {
    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameActive) {
      const spawnInterval = Math.max(1500 - (level * 100), 800);
      spawnIntervalRef.current = setInterval(() => {
        spawnLetter();
      }, spawnInterval);

      return () => {
        if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      };
    }
  }, [gameActive, level, currentTarget]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameActive) return;

      if (e.key === 'ArrowLeft') {
        setBasketPosition(prev => Math.max(5, prev - 5));
      } else if (e.key === 'ArrowRight') {
        setBasketPosition(prev => Math.min(95, prev + 5));
      }
    };

    const handleMouseMove = (e) => {
      if (!gameActive) return;
      const windowWidth = window.innerWidth;
      const newPosition = (e.clientX / windowWidth) * 100;
      setBasketPosition(Math.max(5, Math.min(95, newPosition)));
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameActive]);

  const startGame = () => {
    playClickSound();
    setGameActive(true);
    setScore(0);
    setLives(3);
    setLevel(1);
    setFallingLetters([]);
    selectNewTarget();
  };

  const selectNewTarget = () => {
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    setCurrentTarget(randomLetter);
    voiceOver.speak(
      language === 'ar'
        ? `امسك حرف ${randomLetter}`
        : `Catch letter ${randomLetter}`,
      true
    );
  };

  const spawnLetter = () => {
    const isTarget = Math.random() < 0.4; // 40% chance of target letter
    const letter = isTarget ? currentTarget : letters[Math.floor(Math.random() * letters.length)];

    const newLetter = {
      id: letterIdRef.current++,
      letter,
      isTarget,
      x: Math.random() * 90 + 5, // 5% to 95% of width
      fallDuration: Math.max(3 - (level * 0.2), 1.5) // Gets faster with level
    };

    setFallingLetters(prev => [...prev, newLetter]);

    // Check collision and remove after fall
    setTimeout(() => {
      checkCollision(newLetter);
    }, newLetter.fallDuration * 1000);
  };

  const checkCollision = (letter) => {
    const letterX = letter.x;
    const basketX = basketPosition;
    const basketWidth = 15; // Basket is 15% wide

    const isColliding = Math.abs(letterX - basketX) < basketWidth / 2;

    if (isColliding) {
      if (letter.isTarget) {
        // Correct letter caught
        setScore(prev => prev + (10 * level));
        setShowCelebration(true);
        voiceOver.speak(currentLang.great, true);

        // Level up every 100 points
        if ((score + 10) % 100 === 0) {
          setLevel(prev => prev + 1);
        }

        // Select new target
        selectNewTarget();
      } else {
        // Wrong letter caught
        setLives(prev => prev - 1);
        voiceOver.speak(currentLang.wrong, true);
        if (lives - 1 <= 0) {
          endGame();
        }
      }
    } else if (letter.isTarget) {
      // Missed target letter
      setLives(prev => prev - 1);
      voiceOver.speak(currentLang.missed, true);
      if (lives - 1 <= 0) {
        endGame();
      }
    }

    // Remove the letter
    setFallingLetters(prev => prev.filter(l => l.id !== letter.id));
  };

  const endGame = () => {
    setGameActive(false);
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    voiceOver.speak(
      language === 'ar'
        ? `انتهت اللعبة! نتيجتك ${score}`
        : `Game over! Your score is ${score}`,
      true
    );
  };

  if (!gameActive && lives === 0) {
    return (
      <div className="catch-game-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div
          className="game-over-screen"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="game-over-title">🎮 {currentLang.gameOver}</h1>
          <div className="final-score-display">
            {currentLang.finalScore}
            <span className="score-number">{score}</span>
          </div>
          <button className="play-again-btn" onClick={startGame}>
            🔄 {currentLang.playAgain}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="catch-game-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="catch-game-header">
        <h1 className="catch-game-title">
          <span className="title-icon">🧺</span>
          {currentLang.title}
        </h1>

        {!gameActive ? (
          <button className="start-game-btn" onClick={startGame}>
            {currentLang.start}
          </button>
        ) : (
          <>
            <div className="game-stats">
              <div className="stat-box">
                <span className="stat-label">{currentLang.score}</span>
                <span className="stat-value">{score}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">{currentLang.lives}</span>
                <span className="stat-value">
                  {'❤️'.repeat(lives)}
                  {'🖤'.repeat(3 - lives)}
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-label">{currentLang.level}</span>
                <span className="stat-value">{level}</span>
              </div>
            </div>

            <div className="target-display">
              <p className="target-instruction">{currentLang.instruction}</p>
              <div className="target-letter-box">
                <span className="target-letter">{currentTarget}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {gameActive && (
        <div className="game-area">
          <AnimatePresence>
            {fallingLetters.map(letter => (
              <motion.div
                key={letter.id}
                className={`falling-letter ${letter.isTarget ? 'target-letter' : ''}`}
                initial={{
                  x: `${letter.x}%`,
                  y: -50,
                  opacity: 0
                }}
                animate={{
                  y: 'calc(100vh - 150px)',
                  opacity: 1
                }}
                exit={{
                  opacity: 0,
                  scale: 0
                }}
                transition={{
                  duration: letter.fallDuration,
                  ease: 'linear'
                }}
              >
                {letter.letter}
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div
            className="basket"
            animate={{
              x: `calc(${basketPosition}vw - 50%)`
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
          >
            <div className="basket-body">🧺</div>
          </motion.div>
        </div>
      )}

      <CelebrationPopup
        show={showCelebration}
        language={language}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default CatchTheLettersGame;
