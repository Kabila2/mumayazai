import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CollaborativeDrawingBoard.css';

const CollaborativeDrawingBoard = ({ language, fontSize, highContrast }) => {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [texts, setTexts] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [showTextInput, setShowTextInput] = useState(false);

  // Multiplayer state
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [remoteCursors, setRemoteCursors] = useState({});
  const lastDrawPoint = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const boardRef = useRef(null);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFFFFF',
  ];

  // WebSocket connection
  useEffect(() => {
    if (!hasJoined) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = process.env.REACT_APP_WS_URL || `${protocol}//${window.location.hostname}:8080`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to drawing server');
        setIsConnected(true);

        // Send join message
        ws.send(JSON.stringify({
          type: 'join',
          username: username,
          role: selectedRole
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('Disconnected from drawing server');
        setIsConnected(false);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      // Fall back to local mode
      setIsConnected(false);
    }
  }, [hasJoined, username, selectedRole]);

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'init':
        setCurrentUser({ id: data.userId, username, role: selectedRole });
        setUsers(data.users);

        // Load existing canvas state
        if (data.canvasState && data.canvasState.texts) {
          setTexts(data.canvasState.texts);
        }
        break;

      case 'userJoined':
        setUsers(prev => [...prev, data.user]);
        break;

      case 'userLeft':
        setUsers(prev => prev.filter(u => u.id !== data.userId));
        setRemoteCursors(prev => {
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        });
        break;

      case 'draw':
        drawRemoteStroke(data.drawing);
        break;

      case 'addText':
        setTexts(prev => [...prev, data.text]);
        break;

      case 'clear':
        clearCanvas(true);
        break;

      case 'cursorMove':
        setRemoteCursors(prev => ({
          ...prev,
          [data.userId]: {
            username: data.username,
            role: data.role,
            position: data.position
          }
        }));
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, [username, selectedRole]);

  const drawRemoteStroke = (drawing) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (drawing.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = drawing.lineWidth * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = drawing.lineWidth;
    }

    ctx.beginPath();
    ctx.moveTo(drawing.from.x, drawing.from.y);
    ctx.lineTo(drawing.to.x, drawing.to.y);
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      resizeCanvas();
      redrawCanvas();
    }
  }, [texts]);

  // Handle canvas resize on fullscreen change
  useEffect(() => {
    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resize canvas when entering/exiting fullscreen
  useEffect(() => {
    setTimeout(() => {
      resizeCanvas();
    }, 100);
  }, [isFullscreen]);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.parentElement.getBoundingClientRect();
      const oldImageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.getContext('2d').putImageData(oldImageData, 0, 0);
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');

      texts.forEach(textObj => {
        ctx.font = `${textObj.fontSize}px Arial`;
        ctx.fillStyle = textObj.color;
        ctx.fillText(textObj.text, textObj.x, textObj.y);
      });
    }
  };

  const startDrawing = (e) => {
    if (currentTool === 'text') {
      handleTextClick(e);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    lastDrawPoint.current = point;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || currentTool === 'text') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = lineWidth;
    }

    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    // Send drawing to other users
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'draw',
        drawing: {
          from: lastDrawPoint.current,
          to: point,
          color: currentColor,
          lineWidth: lineWidth,
          tool: currentTool
        }
      }));
    }

    lastDrawPoint.current = point;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastDrawPoint.current = null;
  };

  const handleMouseMove = (e) => {
    draw(e);

    // Send cursor position to other users (throttled)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      wsRef.current.send(JSON.stringify({
        type: 'cursorMove',
        position: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }
      }));
    }
  };

  const handleTextClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTextPosition({ x, y });
    setShowTextInput(true);
  };

  const addText = () => {
    if (currentText.trim()) {
      const newText = {
        text: currentText,
        x: textPosition.x,
        y: textPosition.y,
        color: currentColor,
        fontSize: lineWidth * 5
      };

      setTexts([...texts, newText]);

      // Send text to other users
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'addText',
          text: newText
        }));
      }

      setCurrentText('');
      setShowTextInput(false);
    }
  };

  const clearCanvas = (isRemote = false) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTexts([]);

    // Send clear to other users if not already remote
    if (!isRemote && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'clear'
      }));
    }
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'arabic-drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const toggleFullscreen = () => {
    const element = boardRef.current;

    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Automatically enter fullscreen when joining the session
  useEffect(() => {
    if (hasJoined && boardRef.current) {
      // Small delay to ensure the DOM is fully rendered
      setTimeout(() => {
        const element = boardRef.current;
        if (element && !document.fullscreenElement) {
          if (element.requestFullscreen) {
            element.requestFullscreen().catch(err => {
              console.log('Fullscreen request failed:', err);
            });
          } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
          } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
          }
        }
      }, 300);
    }
  }, [hasJoined]);

  const handleJoinSession = () => {
    if (username.trim()) {
      setHasJoined(true);
    }
  };

  if (!hasJoined) {
    return (
      <div className="collaborative-drawing-board">
        <motion.div
          className="drawing-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="drawing-title">
            {language === 'ar' ? 'لوحة الرسم التعاونية' : 'Collaborative Drawing Board'}
          </h2>
          <p className="drawing-subtitle">
            {language === 'ar'
              ? 'انضم إلى الجلسة للرسم مع الآخرين'
              : 'Join the session to draw with others'
            }
          </p>
        </motion.div>

        <motion.div
          className="join-session-container"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            {language === 'ar' ? 'اختر دورك' : 'Choose Your Role'}
          </h3>

          <div className="role-selector">
            <button
              className={`role-btn ${selectedRole === 'teacher' ? 'selected' : ''}`}
              onClick={() => setSelectedRole('teacher')}
            >
              👨‍🏫 {language === 'ar' ? 'معلم' : 'Teacher'}
            </button>
            <button
              className={`role-btn ${selectedRole === 'student' ? 'selected' : ''}`}
              onClick={() => setSelectedRole('student')}
            >
              👨‍🎓 {language === 'ar' ? 'طالب' : 'Student'}
            </button>
          </div>

          <input
            type="text"
            className="username-input"
            placeholder={language === 'ar' ? 'أدخل اسمك...' : 'Enter your name...'}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleJoinSession();
              }
            }}
          />

          <button
            className="join-btn"
            onClick={handleJoinSession}
            disabled={!username.trim()}
          >
            {language === 'ar' ? 'انضم إلى الجلسة' : 'Join Session'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`collaborative-drawing-board ${isFullscreen ? 'fullscreen' : ''}`} ref={boardRef}>
      <motion.div
        className="drawing-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="drawing-title">
          {language === 'ar' ? 'لوحة الرسم التعاونية' : 'Collaborative Drawing Board'}
        </h2>
        <p className="drawing-subtitle">
          {language === 'ar'
            ? 'ارسم واكتب مع المعلمين والطلاب الآخرين'
            : 'Draw and write with teachers and other students'
          }
        </p>
      </motion.div>

      <motion.div
        className="user-presence"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="presence-title">
              {language === 'ar' ? 'المتصلون الآن' : 'Online Now'}
            </div>
            <div className="users-list">
              {currentUser && (
                <div className={`user-badge ${currentUser.role}`}>
                  {currentUser.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'} {currentUser.username} ({language === 'ar' ? 'أنت' : 'You'})
                </div>
              )}
              {users.filter(u => u.id !== currentUser?.id).map((user) => (
                <div key={user.id} className={`user-badge ${user.role}`}>
                  {user.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'} {user.username}
                </div>
              ))}
            </div>
          </div>
          <div className="connection-status">
            <div className={`status-dot ${isConnected ? '' : 'disconnected'}`}></div>
            {isConnected
              ? (language === 'ar' ? 'متصل' : 'Connected')
              : (language === 'ar' ? 'غير متصل (وضع محلي)' : 'Disconnected (Local Mode)')
            }
          </div>
        </div>
      </motion.div>

      <motion.div
        className="drawing-toolbar"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="tool-section">
          <h3 className="section-title">
            {language === 'ar' ? 'الأدوات' : 'Tools'}
          </h3>
          <div className="tool-buttons">
            <button
              className={`tool-btn ${currentTool === 'pen' ? 'active' : ''}`}
              onClick={() => {
                setCurrentTool('pen');
              }}
              title={language === 'ar' ? 'قلم' : 'Pen'}
            >
              ✏️
            </button>
            <button
              className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
              onClick={() => {
                setCurrentTool('eraser');
              }}
              title={language === 'ar' ? 'ممحاة' : 'Eraser'}
            >
              🧹
            </button>
            <button
              className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`}
              onClick={() => {
                setCurrentTool('text');
              }}
              title={language === 'ar' ? 'نص' : 'Text'}
            >
              📝
            </button>
          </div>
        </div>

        <div className="tool-section">
          <h3 className="section-title">
            {language === 'ar' ? 'الألوان' : 'Colors'}
          </h3>
          <div className="color-palette">
            {colors.map((color) => (
              <button
                key={color}
                className={`color-btn ${currentColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="tool-section">
          <h3 className="section-title">
            {language === 'ar' ? 'السمك' : 'Width'}
          </h3>
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="width-slider"
          />
          <span className="width-value">{lineWidth}</span>
        </div>

        <div className="tool-section">
          <h3 className="section-title">
            {language === 'ar' ? 'الإجراءات' : 'Actions'}
          </h3>
          <div className="action-buttons">
            <button
              className="action-btn clear-btn"
              onClick={() => clearCanvas(false)}
            >
              🗑️ {language === 'ar' ? 'مسح' : 'Clear'}
            </button>
            <button
              className="action-btn download-btn"
              onClick={downloadDrawing}
            >
              💾 {language === 'ar' ? 'حفظ' : 'Save'}
            </button>
            <button
              className="action-btn fullscreen-btn"
              onClick={toggleFullscreen}
              title={language === 'ar'
                ? (isFullscreen ? 'خروج من ملء الشاشة' : 'ملء الشاشة')
                : (isFullscreen ? 'Exit Fullscreen' : 'Fullscreen')
              }
            >
              {isFullscreen ? '🗗' : '⛶'} {language === 'ar'
                ? (isFullscreen ? 'خروج' : 'ملء الشاشة')
                : (isFullscreen ? 'Exit' : 'Fullscreen')
              }
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="canvas-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ cursor: currentTool === 'text' ? 'text' : 'crosshair' }}
        />

        {/* Remote cursors */}
        {Object.entries(remoteCursors).map(([userId, cursor]) => (
          <div
            key={userId}
            style={{
              position: 'absolute',
              left: cursor.position.x,
              top: cursor.position.y,
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000
            }}
          >
            <div style={{
              background: cursor.role === 'teacher' ? '#667eea' : '#4facfe',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '8px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              {cursor.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'} {cursor.username}
            </div>
          </div>
        ))}

        {showTextInput && (
          <div
            className="text-input-popup"
            style={{
              left: textPosition.x,
              top: textPosition.y
            }}
          >
            <input
              type="text"
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب النص هنا...' : 'Enter text here...'}
              className="text-input"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addText();
                }
              }}
            />
            <div className="text-input-buttons">
              <button onClick={addText} className="text-add-btn">
                ✓ {language === 'ar' ? 'إضافة' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setShowTextInput(false);
                  setCurrentText('');
                }}
                className="text-cancel-btn"
              >
                ✕ {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        className="drawing-tips"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h3 className="tips-title">
          {language === 'ar' ? '💡 نصائح' : '💡 Tips'}
        </h3>
        <ul className="tips-list">
          <li>{language === 'ar' ? 'يمكنك رؤية المستخدمين الآخرين وهم يرسمون في الوقت الفعلي' : 'You can see other users drawing in real-time'}</li>
          <li>{language === 'ar' ? 'المعلمون يظهرون باللون البنفسجي والطلاب باللون الأزرق' : 'Teachers appear in purple, students in blue'}</li>
          <li>{language === 'ar' ? 'استخدم القلم للرسم والممحاة للمسح' : 'Use the pen to draw and eraser to erase'}</li>
          <li>{language === 'ar' ? 'انقر على أداة النص لإضافة نصوص على اللوحة' : 'Click the text tool to add text to the board'}</li>
          <li>{language === 'ar' ? 'احفظ رسمك في أي وقت باستخدام زر الحفظ' : 'Save your drawing anytime using the save button'}</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default CollaborativeDrawingBoard;
