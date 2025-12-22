import React, { useState, useEffect } from 'react';
import { useVoiceOver } from '../hooks/useVoiceOver';
import CelebrationPopup from './CelebrationPopup';
import './MemoryGame.css';

const MemoryGame = ({ language = 'en' }) => {
  const [difficulty, setDifficulty] = useState('medium');
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Voice Over hook
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  // Translations
  const translations = {
    en: {
      title: 'Memory Match',
      difficulty: 'Difficulty:',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      expert: 'Expert',
      moves: 'Moves:',
      matched: 'Matched:',
      newGame: 'New Game',
      congratulations: 'Congratulations!',
      winMessage: 'You matched all pairs in {moves} moves!',
      playAgain: 'Play Again'
    },
    ar: {
      title: 'لعبة الذاكرة',
      difficulty: 'الصعوبة:',
      easy: 'سهل',
      medium: 'متوسط',
      hard: 'صعب',
      expert: 'خبير',
      moves: 'التحركات:',
      matched: 'المطابقة:',
      newGame: 'لعبة جديدة',
      congratulations: 'تهانينا!',
      winMessage: 'لقد طابقت جميع الأزواج في {moves} حركة!',
      playAgain: 'العب مرة أخرى'
    }
  };

  const t = translations[language] || translations.en;

  // All available card pairs with Arabic translations
  const allCardPairs = [
    { id: 1, type: 'picture', value: '🐶', pairEn: 'dog', pairAr: 'كلب' },
    { id: 1, type: 'word', valueEn: 'dog', valueAr: 'كلب', pair: '🐶' },
    { id: 2, type: 'picture', value: '🐱', pairEn: 'cat', pairAr: 'قطة' },
    { id: 2, type: 'word', valueEn: 'cat', valueAr: 'قطة', pair: '🐱' },
    { id: 3, type: 'picture', value: '🌸', pairEn: 'flower', pairAr: 'زهرة' },
    { id: 3, type: 'word', valueEn: 'flower', valueAr: 'زهرة', pair: '🌸' },
    { id: 4, type: 'picture', value: '⭐', pairEn: 'star', pairAr: 'نجم' },
    { id: 4, type: 'word', valueEn: 'star', valueAr: 'نجم', pair: '⭐' },
    { id: 5, type: 'picture', value: '🍎', pairEn: 'apple', pairAr: 'تفاح' },
    { id: 5, type: 'word', valueEn: 'apple', valueAr: 'تفاح', pair: '🍎' },
    { id: 6, type: 'picture', value: '🚗', pairEn: 'car', pairAr: 'سيارة' },
    { id: 6, type: 'word', valueEn: 'car', valueAr: 'سيارة', pair: '🚗' },
    { id: 7, type: 'picture', value: '🏠', pairEn: 'house', pairAr: 'بيت' },
    { id: 7, type: 'word', valueEn: 'house', valueAr: 'بيت', pair: '🏠' },
    { id: 8, type: 'picture', value: '☀️', pairEn: 'sun', pairAr: 'شمس' },
    { id: 8, type: 'word', valueEn: 'sun', valueAr: 'شمس', pair: '☀️' },
    { id: 9, type: 'picture', value: '🌙', pairEn: 'moon', pairAr: 'قمر' },
    { id: 9, type: 'word', valueEn: 'moon', valueAr: 'قمر', pair: '🌙' },
    { id: 10, type: 'picture', value: '🌊', pairEn: 'water', pairAr: 'ماء' },
    { id: 10, type: 'word', valueEn: 'water', valueAr: 'ماء', pair: '🌊' },
    { id: 11, type: 'picture', value: '🔥', pairEn: 'fire', pairAr: 'نار' },
    { id: 11, type: 'word', valueEn: 'fire', valueAr: 'نار', pair: '🔥' },
    { id: 12, type: 'picture', value: '🌈', pairEn: 'rainbow', pairAr: 'قوس قزح' },
    { id: 12, type: 'word', valueEn: 'rainbow', valueAr: 'قوس قزح', pair: '🌈' },
  ];

  // Get card pairs based on difficulty
  const getCardPairsForDifficulty = () => {
    const counts = {
      easy: 4,    // 4 pairs = 8 cards
      medium: 6,  // 6 pairs = 12 cards
      hard: 8,    // 8 pairs = 16 cards
      expert: 12  // 12 pairs = 24 cards
    };

    const pairCount = counts[difficulty] || counts.medium;
    const uniquePairs = [];

    // Get unique pairs (each id appears twice in allCardPairs)
    for (let i = 0; i < allCardPairs.length; i += 2) {
      // Process cards based on language
      const pictureCard = { ...allCardPairs[i] };
      const wordCard = {
        ...allCardPairs[i + 1],
        value: language === 'ar' ? allCardPairs[i + 1].valueAr : allCardPairs[i + 1].valueEn
      };
      uniquePairs.push([pictureCard, wordCard]);
    }

    // Take only the number of pairs needed
    return uniquePairs.slice(0, pairCount).flat();
  };

  // Initialize game when component mounts, difficulty changes, or language changes
  useEffect(() => {
    initializeGame();
  }, [difficulty, language]);

  const initializeGame = () => {
    // Get cards for current difficulty
    const cardPairs = getCardPairsForDifficulty();

    // Shuffle cards
    const shuffled = [...cardPairs]
      .sort(() => Math.random() - 0.5)
      .map((card, index) => ({ ...card, uniqueId: index }));

    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameWon(false);
  };

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
  };

  const handleCardClick = (card) => {
    // Prevent clicking if card is already flipped or matched
    if (flipped.length === 2 || flipped.includes(card.uniqueId) || matched.includes(card.id)) {
      return;
    }

    // Speak the card value when flipped
    if (card.type === 'word') {
      voiceOver.speak(card.value, true);
    }

    const newFlipped = [...flipped, card.uniqueId];
    setFlipped(newFlipped);

    // Check for match when 2 cards are flipped
    if (newFlipped.length === 2) {
      setMoves(moves + 1);

      const firstCard = cards.find(c => c.uniqueId === newFlipped[0]);
      const secondCard = cards.find(c => c.uniqueId === newFlipped[1]);

      // Check if cards match (same id, different types)
      if (firstCard.id === secondCard.id && firstCard.type !== secondCard.type) {
        // Match found - celebrate!
        const wordCard = firstCard.type === 'word' ? firstCard : secondCard;
        setTimeout(() => {
          // Speak success message
          const successMessage = language === 'ar'
            ? `رائع! ${wordCard.value}`
            : `Great! ${wordCard.value}`;
          voiceOver.speak(successMessage, true);

          const newMatched = [...matched, firstCard.id];
          setMatched(newMatched);
          setFlipped([]);

          // Show celebration for match
          setShowCelebration(true);

          // Check if game is won (all pairs matched)
          if (newMatched.length === cards.length / 2) {
            setGameWon(true);
            // Speak win message
            setTimeout(() => {
              const winMessage = language === 'ar'
                ? 'تهانينا! لقد فزت'
                : 'Congratulations! You won!';
              voiceOver.speak(winMessage, true);
            }, 500);
          }
        }, 600);
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  };

  const isCardFlipped = (uniqueId) => flipped.includes(uniqueId);
  const isCardMatched = (id) => matched.includes(id);

  return (
    <div className="memory-game-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="memory-header">
        <h1 className="memory-title">
          <span className="title-icon">🧠</span>
          {t.title}
        </h1>

        {/* Difficulty Selector */}
        <div className="difficulty-selector">
          <span className="difficulty-label">{t.difficulty}</span>
          <div className="difficulty-buttons">
            <button
              className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('easy')}
            >
              😊 {t.easy}
            </button>
            <button
              className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('medium')}
            >
              🎯 {t.medium}
            </button>
            <button
              className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('hard')}
            >
              💪 {t.hard}
            </button>
            <button
              className={`difficulty-btn ${difficulty === 'expert' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('expert')}
            >
              🔥 {t.expert}
            </button>
          </div>
        </div>

        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">{t.moves}</span>
            <span className="stat-value">{moves}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t.matched}</span>
            <span className="stat-value">{matched.length}/{cards.length / 2}</span>
          </div>
        </div>
        <button className="reset-btn" onClick={initializeGame}>
          🔄 {t.newGame}
        </button>
      </div>

      {/* Game Board */}
      <div className="game-board">
        {cards.map((card) => (
          <div
            key={card.uniqueId}
            className={`memory-card ${isCardFlipped(card.uniqueId) ? 'flipped' : ''} ${
              isCardMatched(card.id) ? 'matched' : ''
            } ${card.type === 'picture' ? 'picture-card' : 'word-card'}`}
            onClick={() => handleCardClick(card)}
          >
            <div className="card-inner">
              <div className="card-front">
                <span className="card-question">?</span>
              </div>
              <div className="card-back">
                {card.type === 'picture' ? (
                  <span className="card-emoji">{card.value}</span>
                ) : (
                  <span className="card-word">{card.value}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Win Modal */}
      {gameWon && (
        <div className="win-modal">
          <div className="win-content">
            <h2 className="win-title">🎉 {t.congratulations} 🎉</h2>
            <p className="win-message">{t.winMessage.replace('{moves}', moves)}</p>
            <button className="play-again-btn" onClick={initializeGame}>
              {t.playAgain}
            </button>
          </div>
        </div>
      )}

      {/* Celebration Popup */}
      <CelebrationPopup
        show={showCelebration}
        language={language}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default MemoryGame;
