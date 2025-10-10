import React, { useState, useEffect } from 'react';
import './MemoryGame.css';

const MemoryGame = () => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  // Card pairs: picture emoji and word
  const cardPairs = [
    { id: 1, type: 'picture', value: '🐶', pair: 'dog' },
    { id: 1, type: 'word', value: 'dog', pair: '🐶' },
    { id: 2, type: 'picture', value: '🐱', pair: 'cat' },
    { id: 2, type: 'word', value: 'cat', pair: '🐱' },
    { id: 3, type: 'picture', value: '🌸', pair: 'flower' },
    { id: 3, type: 'word', value: 'flower', pair: '🌸' },
    { id: 4, type: 'picture', value: '⭐', pair: 'star' },
    { id: 4, type: 'word', value: 'star', pair: '⭐' },
    { id: 5, type: 'picture', value: '🍎', pair: 'apple' },
    { id: 5, type: 'word', value: 'apple', pair: '🍎' },
    { id: 6, type: 'picture', value: '🚗', pair: 'car' },
    { id: 6, type: 'word', value: 'car', pair: '🚗' },
    { id: 7, type: 'picture', value: '🏠', pair: 'house' },
    { id: 7, type: 'word', value: 'house', pair: '🏠' },
    { id: 8, type: 'picture', value: '☀️', pair: 'sun' },
    { id: 8, type: 'word', value: 'sun', pair: '☀️' },
  ];

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
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

  const handleCardClick = (card) => {
    // Prevent clicking if card is already flipped or matched
    if (flipped.length === 2 || flipped.includes(card.uniqueId) || matched.includes(card.id)) {
      return;
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
        // Match found
        setTimeout(() => {
          setMatched([...matched, firstCard.id]);
          setFlipped([]);

          // Check if game is won
          if (matched.length + 1 === cardPairs.length / 2) {
            setGameWon(true);
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
    <div className="memory-game-container">
      {/* Header */}
      <div className="memory-header">
        <h1 className="memory-title">
          <span className="title-icon">🧠</span>
          Memory Match
        </h1>
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Moves:</span>
            <span className="stat-value">{moves}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Matched:</span>
            <span className="stat-value">{matched.length}/{cardPairs.length / 2}</span>
          </div>
        </div>
        <button className="reset-btn" onClick={initializeGame}>
          🔄 New Game
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
            <h2 className="win-title">🎉 Congratulations! 🎉</h2>
            <p className="win-message">You matched all pairs in {moves} moves!</p>
            <button className="play-again-btn" onClick={initializeGame}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryGame;
