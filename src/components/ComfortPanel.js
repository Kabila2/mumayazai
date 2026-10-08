import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  getComfort,
  setComfort,
  setCalmMode,
  isCalmMode,
  READING_TINTS,
  COMFORT_CHANGED_EVENT
} from '../utils/comfortSettings';
import { playClickSound, playSuccessSound } from '../utils/soundEffects';
import './ComfortPanel.css';

/**
 * The Comfort panel — every "how much stimulation do I want?" switch, one tap
 * from any screen.
 *
 * WHY IT IS IN THE NAV AND NOT BURIED IN SETTINGS
 * A learner who is overwhelmed right now needs the fix right now. Sound,
 * read-aloud, motion, celebrations, a reading tint and focus mode were spread
 * across keys that had no switch anywhere in the UI. They are now one panel,
 * with a single "Calm mode" button at the top for the moment when choosing
 * between six switches is itself too much.
 *
 * Every control is a real button with aria-pressed, Escape closes, and the
 * panel is portalled to <body> so no ancestor can clip it.
 */
const FONTS = [
  { label: 'OpenDyslexic', value: "'OpenDyslexic', sans-serif" },
  { label: 'Cairo', value: "'Cairo', sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'System', value: 'system-ui, sans-serif' }
];

const ComfortPanel = ({ language = 'en', open, onClose, anchorRef }) => {
  const [comfort, setComfortState] = useState(getComfort);
  const [font, setFont] = useState(() => localStorage.getItem('stellar_font') || FONTS[0].value);
  const [textSize, setTextSize] = useState(() => parseInt(localStorage.getItem('stellar_text_size') || '100', 10));
  const panelRef = useRef(null);

  const tr = (en, ar) => (language === 'ar' ? ar : en);

  // Stay in step if another screen changes a setting while this is open.
  useEffect(() => {
    const sync = () => setComfortState(getComfort());
    window.addEventListener(COMFORT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(COMFORT_CHANGED_EVENT, sync);
  }, []);

  // Escape closes; a click outside closes; focus moves into the panel on open.
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    const onPointer = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      if (anchorRef?.current?.contains(event.target)) return;
      onClose?.();
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    const first = panelRef.current?.querySelector('button');
    first?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, onClose, anchorRef]);

  const update = (patch) => {
    setComfortState(setComfort(patch));
    // Only sound a click if sounds are (still) on after this change.
    if (getComfort().sounds) playClickSound();
  };

  const toggleCalm = () => {
    const next = !isCalmMode(comfort);
    setComfortState(setCalmMode(next));
    if (!next) playSuccessSound();
  };

  const applyFont = (value) => {
    setFont(value);
    document.documentElement.style.setProperty('--font-sans', value);
    localStorage.setItem('stellar_font', value);
    if (comfort.sounds) playClickSound();
  };

  const applyTextSize = (delta) => {
    const next = Math.min(150, Math.max(80, textSize + delta));
    setTextSize(next);
    document.documentElement.style.fontSize = `${next}%`;
    localStorage.setItem('stellar_text_size', String(next));
    if (comfort.sounds) playClickSound();
  };

  const Toggle = ({ id, icon, label, hint, value, onChange }) => (
    <button
      type="button"
      className={`comfort-toggle ${value ? 'is-on' : ''}`}
      onClick={() => onChange(!value)}
      aria-pressed={value}
      id={id}
    >
      <span className="comfort-toggle-icon" aria-hidden="true">{icon}</span>
      <span className="comfort-toggle-text">
        <span className="comfort-toggle-label">{label}</span>
        <span className="comfort-toggle-hint">{hint}</span>
      </span>
      <span className="comfort-switch" aria-hidden="true"><i /></span>
    </button>
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="comfort-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="comfort-panel-title"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <header className="comfort-panel-header">
            <h2 className="comfort-panel-title" id="comfort-panel-title">
              <span aria-hidden="true">🧘</span> {tr('Comfort', 'الراحة')}
            </h2>
            <button
              type="button"
              className="comfort-panel-close"
              onClick={onClose}
              aria-label={tr('Close comfort panel', 'إغلاق لوحة الراحة')}
            >
              ✕
            </button>
          </header>

          <p className="comfort-panel-blurb">
            {tr(
              'Make the app as calm or as lively as you like. These are yours and stay saved.',
              'اجعل التطبيق هادئاً أو حيوياً كما تحب. هذه الإعدادات لك وتبقى محفوظة.'
            )}
          </p>

          <button
            type="button"
            className={`comfort-calm-btn ${isCalmMode(comfort) ? 'is-on' : ''}`}
            onClick={toggleCalm}
            aria-pressed={isCalmMode(comfort)}
          >
            <span aria-hidden="true">{isCalmMode(comfort) ? '🌙' : '🌤️'}</span>
            <span>
              <strong>{isCalmMode(comfort) ? tr('Calm mode is on', 'وضع الهدوء مفعّل') : tr('Turn on calm mode', 'تفعيل وضع الهدوء')}</strong>
              <small>{tr('No sounds, less movement, quiet celebrations, focus on the next step.', 'بلا أصوات، حركة أقل، احتفالات هادئة، وتركيز على الخطوة التالية.')}</small>
            </span>
          </button>

          <div className="comfort-toggles">
            <Toggle
              id="comfort-sounds"
              icon="🔊"
              label={tr('Sound effects', 'المؤثرات الصوتية')}
              hint={tr('Clicks, chimes and cheers', 'نقرات ورنّات وتشجيع')}
              value={comfort.sounds}
              onChange={(v) => update({ sounds: v })}
            />
            <Toggle
              id="comfort-readaloud"
              icon="🗣️"
              label={tr('Read aloud', 'القراءة بصوت عالٍ')}
              hint={tr('Words, letters and feedback are spoken', 'تُنطق الكلمات والحروف والملاحظات')}
              value={comfort.readAloud}
              onChange={(v) => update({ readAloud: v })}
            />
            <Toggle
              id="comfort-motion"
              icon="🎞️"
              label={tr('Reduce motion', 'تقليل الحركة')}
              hint={tr('Shorter, stiller animations everywhere', 'حركات أقصر وأهدأ في كل مكان')}
              value={comfort.reducedMotion}
              onChange={(v) => update({ reducedMotion: v })}
            />
            <Toggle
              id="comfort-quiet"
              icon="🎉"
              label={tr('Quiet celebrations', 'احتفالات هادئة')}
              hint={tr('Praise without confetti or fanfare', 'تشجيع بلا قصاصات أو ضجيج')}
              value={comfort.quietCelebrations}
              onChange={(v) => update({ quietCelebrations: v })}
            />
            <Toggle
              id="comfort-focus"
              icon="🎯"
              label={tr('Focus mode', 'وضع التركيز')}
              hint={tr('Hide the leaderboard and background movement', 'إخفاء لوحة المتصدرين وحركة الخلفية')}
              value={comfort.focusMode}
              onChange={(v) => update({ focusMode: v })}
            />
          </div>

          <section className="comfort-section" aria-labelledby="comfort-tint-title">
            <h3 className="comfort-section-title" id="comfort-tint-title">
              <span aria-hidden="true">🎨</span> {tr('Reading tint', 'لون القراءة')}
            </h3>
            <p className="comfort-section-hint">
              {tr('A soft colour over the page can make text easier on the eyes.', 'لون خفيف فوق الصفحة قد يريح العين عند القراءة.')}
            </p>
            <div className="comfort-tints" role="group" aria-label={tr('Reading tint', 'لون القراءة')}>
              {READING_TINTS.map((tint) => (
                <button
                  key={tint.id}
                  type="button"
                  className={`comfort-tint ${comfort.readingTint === tint.id ? 'is-on' : ''} ${tint.id === 'none' ? 'is-none' : ''}`}
                  style={{ '--tint': tint.swatch }}
                  onClick={() => update({ readingTint: tint.id })}
                  aria-pressed={comfort.readingTint === tint.id}
                  title={language === 'ar' ? tint.nameAr : tint.nameEn}
                >
                  <span className="comfort-tint-swatch" aria-hidden="true">{tint.id === 'none' ? '∅' : ''}</span>
                  <span className="comfort-tint-name">{language === 'ar' ? tint.nameAr : tint.nameEn}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="comfort-section" aria-labelledby="comfort-text-title">
            <h3 className="comfort-section-title" id="comfort-text-title">
              <span aria-hidden="true">🔡</span> {tr('Text', 'النص')}
            </h3>
            <div className="comfort-size-row">
              <button
                type="button"
                className="comfort-size-btn"
                onClick={() => applyTextSize(-10)}
                disabled={textSize <= 80}
                aria-label={tr('Smaller text', 'نص أصغر')}
              >
                A−
              </button>
              <span className="comfort-size-value" aria-live="off">{textSize}%</span>
              <button
                type="button"
                className="comfort-size-btn comfort-size-btn--big"
                onClick={() => applyTextSize(10)}
                disabled={textSize >= 150}
                aria-label={tr('Bigger text', 'نص أكبر')}
              >
                A+
              </button>
            </div>
            <div className="comfort-fonts" role="group" aria-label={tr('Font', 'الخط')}>
              {FONTS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`comfort-font ${font === option.value ? 'is-on' : ''}`}
                  onClick={() => applyFont(option.value)}
                  aria-pressed={font === option.value}
                >
                  <span className="font-preview" style={{ fontFamily: option.value }}>Aa أب</span>
                  <span className="comfort-font-name">{option.label}</span>
                </button>
              ))}
            </div>
          </section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ComfortPanel;
