import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import './AboutStellarModal.css';

/**
 * "About Stellar" — the why-this-was-made panel, opened from the login screen.
 *
 * THE VIDEO SLOT
 * The intro video lives at `public/about-stellar.mp4` (optionally with
 * `public/about-stellar-poster.jpg`). It is served straight from the public
 * folder, so no build config is involved. If the file is missing or fails to
 * load, the <video> fires onError and we swap in a labelled slot instead of
 * leaving a dead black rectangle on the first screen anyone sees.
 *
 * The written copy stands on its own either way — someone on a slow connection
 * or with video blocked still gets the answer.
 *
 * Portalled to <body> because the login screen's `.entry-container` is a
 * fixed-size, `overflow: hidden` hero with a WebGL Orb inside it; a modal
 * rendered in that tree gets clipped.
 */

/** The intro video, if it has been added to /public. */
const VIDEO_SRC = `${process.env.PUBLIC_URL || ''}/about-stellar.mp4`;
const POSTER_SRC = `${process.env.PUBLIC_URL || ''}/about-stellar-poster.jpg`;

const COPY = {
  en: {
    title: 'About Stellar',
    tagline: 'Welcome to Stellar, where kids can unlock their potential.',
    videoPending: 'The intro video is coming soon.',
    videoPendingHint: 'Add about-stellar.mp4 to the public folder and it will play here.',
    whyTitle: 'Why I built it',
    why: [
      'Most language apps assume you can already read the script. Stellar does not: every Arabic word, letter and sentence comes with its sound and its phonetic spelling, so a child can start on day one.',
      'Lessons open one at a time. Finishing one unlocks the next, so nobody is handed sixteen choices and left to guess where to begin.',
      'It is built for learners who find a busy screen hard, including children with Down syndrome and dyslexia. Large targets, calm animation, a dyslexia-friendly typeface and a real high-contrast mode are not add-ons here; they are the design.'
    ],
    forTitle: 'Who it is for',
    forList: [
      ['🧑‍🎓', 'Learners', 'Lessons, games, a tutor and points that turn into rewards.'],
      ['👨‍🏫', 'Teachers', 'Classes, homework, progress reports and a line to every family.'],
      ['👨‍👩‍👧', 'Parents', 'What your child is working on, how it is going, and their teachers.']
    ],
    close: 'Close'
  },
  ar: {
    title: 'عن مميّز',
    tagline: 'مرحباً بك في مميّز، حيث يكتشف الأطفال قدراتهم.',
    videoPending: 'فيديو التعريف قادم قريباً.',
    videoPendingHint: 'أضف about-stellar.mp4 إلى مجلد public ليُشغَّل هنا.',
    whyTitle: 'لماذا بنيته',
    why: [
      'معظم تطبيقات اللغة تفترض أنك تقرأ الحرف العربي أصلاً. مميّز لا يفترض ذلك: كل كلمة وحرف وجملة مع صوتها وكتابتها الصوتية، ليبدأ الطفل من اليوم الأول.',
      'تُفتح الدروس واحداً تلو الآخر. إكمال درس يفتح التالي، فلا يُترك أحد أمام ستة عشر خياراً يحاول تخمين البداية.',
      'بُني لمن تصعب عليهم الشاشة المزدحمة، ومنهم أطفال متلازمة داون وصعوبات القراءة. الأهداف الكبيرة والحركة الهادئة والخط الصديق لصعوبات القراءة ووضع التباين العالي ليست إضافات هنا، بل هي التصميم نفسه.'
    ],
    forTitle: 'لمن هو',
    forList: [
      ['🧑‍🎓', 'المتعلمون', 'دروس وألعاب ومساعد ونقاط تتحول إلى مكافآت.'],
      ['👨‍🏫', 'المعلمون', 'الصفوف والواجبات وتقارير التقدم وتواصل مع كل أسرة.'],
      ['👨‍👩‍👧', 'الأهل', 'ما يعمل عليه طفلك، وكيف يسير، ومعلموه.']
    ],
    close: 'إغلاق'
  }
};

const AboutStellarModal = ({ language = 'en', onClose }) => {
  const closeRef = useRef(null);
  const copy = COPY[language] || COPY.en;
  // Flips to false only if the browser cannot load the file.
  const [hasVideo, setHasVideo] = useState(true);

  // Focus the close button on open and close on Escape — the panel covers the
  // whole login screen, so there has to be a keyboard way out.
  useEffect(() => {
    closeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      className="about-stellar-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-stellar-title"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <motion.div
        className="about-stellar"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="about-stellar-close"
          onClick={onClose}
          ref={closeRef}
          aria-label={copy.close}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2 className="about-stellar-title" id="about-stellar-title">
          <span aria-hidden="true">✨</span> {copy.title}
        </h2>
        <p className="about-stellar-tagline">{copy.tagline}</p>

        <div className="about-stellar-video">
          {hasVideo ? (
            <video
              className="about-stellar-player"
              src={VIDEO_SRC}
              poster={POSTER_SRC}
              controls
              preload="metadata"
              playsInline
              onError={() => setHasVideo(false)}
            >
              {copy.videoPending}
            </video>
          ) : (
            <div className="about-stellar-video-slot">
              <span className="about-stellar-video-icon" aria-hidden="true">🎬</span>
              <p className="about-stellar-video-text">{copy.videoPending}</p>
              <p className="about-stellar-video-hint">{copy.videoPendingHint}</p>
            </div>
          )}
        </div>

        <section className="about-stellar-section">
          <h3 className="about-stellar-heading">{copy.whyTitle}</h3>
          {copy.why.map((paragraph) => (
            <p className="about-stellar-body" key={paragraph.slice(0, 24)}>
              {paragraph}
            </p>
          ))}
        </section>

        <section className="about-stellar-section">
          <h3 className="about-stellar-heading">{copy.forTitle}</h3>
          <ul className="about-stellar-roles">
            {copy.forList.map(([icon, who, what]) => (
              <li className="about-stellar-role" key={who}>
                <span className="about-stellar-role-icon" aria-hidden="true">{icon}</span>
                <span>
                  <strong>{who}</strong>
                  <span className="about-stellar-role-what">{what}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default AboutStellarModal;
