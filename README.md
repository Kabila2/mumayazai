# Stellar (مميّز) — Arabic learning for every mind

A React (Create React App) learning platform for children, built first for
neurodiverse learners: dyslexia, ADHD, autism and sensory sensitivity are the
default assumptions, not edge cases. It teaches the Arabic alphabet, colours,
words and sentences through lessons, games, handwriting, stories and an AI
tutor, in an English or Arabic interface.

There is no backend: accounts, progress, points and settings live in the
browser's `localStorage` (see `src/utils/storageRegistry.js` for the full map,
and the Data tab in profile settings for export / import).

## Run it

```bash
npm install
npm start        # http://localhost:3000
npm test         # Jest + Testing Library, runs once with CI=true
npm run build    # production bundle in build/
```

The AI tutor works out of the box through Puter.js; set `REACT_APP_AI_API_URL`
(your own endpoint) or `REACT_APP_ANTHROPIC_API_KEY` (development only) in
`.env` to use a different provider — see `src/utils/aiClient.js`.

## How it is built for neurodiverse learners

- **Comfort panel** (nav, 🎛️): sound effects, read-aloud, reduced motion,
  quiet celebrations, focus mode, a reading tint, text size and font — plus a
  one-tap **Calm mode**. `src/utils/comfortSettings.js` owns these and puts
  them on `<html>` so every screen, popup and portal follows.
- **One next step**: the home page leads with a daily-goal ring ("3 of 5
  today") and a single Continue button to the next lesson on the sequenced
  path (alphabet → colours → words → sentences, each unlocking at 70%).
- **Multisensory lessons**: every letter is shown in all four of its written
  forms, heard in an Arabic voice, and one tap away from being traced.
- **Gentle feedback**: a soft chime for right, a soft two-note for wrong, the
  correct answer revealed after a miss, and one celebration at the end of a
  quiz rather than one per question.
- **Brain breaks**: after twenty minutes on learning screens a dismissible
  nudge suggests a thirty-second breather.
- **Dyslexia-friendly type**: OpenDyslexic by default, generous spacing, and
  phonetic spellings under Arabic script throughout.

## Where things live

| Area | Files |
| --- | --- |
| App shell, nav, home page | `src/components/ArabicLearningPlatform.js` |
| Design tokens (light / dark / high contrast) | `src/theme.css`, `src/high-contrast.css` |
| Lessons | `ArabicAlphabetLearning`, `ArabicColorsLearning`, `ArabicWordsLearning`, `ArabicSentencesLearning` |
| Practice & games | `QuizCenter`, `MemoryGame`, `ColorMatchingGame`, `NumberLearningGame`, `ArabicWordBuilder`, `LetterWordBuilder`, `SentenceBuilder`, `ArabicHandwritingPractice` |
| Points, streaks, goals, badges | `src/utils/pointsUtils.js`, `streakUtils.js`, `achievementsSystem.js`, `rewardsStore.js` |
| Curriculum locking | `src/utils/moduleUnlockUtils.js`, `unitTestUtils.js` |
| Comfort / sensory settings | `src/utils/comfortSettings.js`, `src/components/ComfortPanel.js` |
| Teacher & parent tools | `TeacherDashboard`, `ParentDashboard`, `TeacherParentChat`, `HomeworkSystem`, `ClassManagement` |
