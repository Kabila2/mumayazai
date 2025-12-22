# Voice Over Integration Guide

This guide explains how to add voice over functionality to any component in the Mumayaz application.

## Overview

The voice over system provides text-to-speech capabilities throughout the application for improved accessibility and user experience. Users love this feature!

## Quick Start

### 1. Import the Hook and Control Component

```javascript
import { useVoiceOver } from '../hooks/useVoiceOver';
import VoiceOverControl from './VoiceOverControl';
```

### 2. Initialize the Hook in Your Component

```javascript
const MyComponent = ({ language }) => {
  // Initialize voice over hook
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  // ... rest of your component
};
```

### 3. Add the Control Button to Your UI

```javascript
return (
  <div className="my-component">
    {/* Voice Over Control */}
    <VoiceOverControl
      isEnabled={voiceOver.isEnabled}
      isSpeaking={voiceOver.isSpeaking}
      onToggle={voiceOver.toggleEnabled}
      language={language}
      position="top-right"  // or "top-left", "bottom-right", "bottom-left"
    />

    {/* Your component content */}
  </div>
);
```

### 4. Use Voice Over in Your Component

```javascript
// Announce when user performs an action
const handleButtonClick = () => {
  voiceOver.speak(
    language === 'ar'
      ? 'تم النقر على الزر'
      : 'Button clicked',
    true  // immediate playback (stops current speech)
  );

  // Your button logic
};

// Auto-announce (respects user's autoPlay setting)
const handleItemSelect = (item) => {
  voiceOver.speakAuto(
    language === 'ar'
      ? `تم اختيار ${item.nameAr}`
      : `Selected ${item.nameEn}`
  );

  // Your selection logic
};
```

## API Reference

### useVoiceOver Hook

#### Parameters

```javascript
useVoiceOver(language, options)
```

- `language` (string): 'ar' for Arabic, 'en' for English
- `options` (object):
  - `autoPlayEnabled` (boolean): Whether auto-play is enabled for this component
  - `onStart` (function): Callback when speech starts
  - `onEnd` (function): Callback when speech ends
  - `onError` (function): Callback when speech errors occur

#### Returns

```javascript
{
  // State
  isSpeaking: boolean,          // Whether currently speaking
  isEnabled: boolean,           // Whether voice over is enabled
  voices: array,                // Available voices for current language
  selectedVoice: object,        // Currently selected voice
  settings: object,             // Current voice settings

  // Functions
  speak: (text, immediate) => void,        // Speak text
  speakAuto: (text, immediate) => void,    // Speak only if autoPlay enabled
  stop: () => void,                        // Stop speaking
  pause: () => void,                       // Pause speaking
  resume: () => void,                      // Resume speaking
  toggleEnabled: () => void,               // Toggle voice over on/off
  updateSettings: (newSettings) => void,   // Update voice settings
  setSelectedVoice: (voice) => void        // Change voice
}
```

### VoiceOverControl Component

#### Props

```javascript
<VoiceOverControl
  isEnabled={boolean}          // Whether voice over is enabled
  isSpeaking={boolean}         // Whether currently speaking
  onToggle={function}          // Toggle callback
  language={string}            // 'ar' or 'en'
  position={string}            // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  showLabel={boolean}          // Whether to show text label (default: true)
/>
```

## Common Patterns

### Pattern 1: Announce Navigation

```javascript
const handleNext = () => {
  const nextItem = items[currentIndex + 1];
  voiceOver.speakAuto(
    language === 'ar'
      ? `الآن في ${nextItem.titleAr}`
      : `Now viewing ${nextItem.titleEn}`
  );
  setCurrentIndex(currentIndex + 1);
};
```

### Pattern 2: Announce Achievements

```javascript
const handleComplete = () => {
  voiceOver.speak(
    language === 'ar'
      ? `مبروك! حصلت على ${points} نقطة`
      : `Congratulations! You earned ${points} points`,
    true
  );
  awardPoints(userEmail, 'TASK_COMPLETED');
};
```

### Pattern 3: Announce Errors

```javascript
const handleSubmit = async () => {
  try {
    await submitAnswer();
    voiceOver.speak(
      language === 'ar' ? 'إجابة صحيحة!' : 'Correct answer!',
      true
    );
  } catch (error) {
    voiceOver.speak(
      language === 'ar' ? 'حاول مرة أخرى' : 'Please try again',
      true
    );
  }
};
```

### Pattern 4: Queue Multiple Announcements

```javascript
const handleSequence = () => {
  voiceOver.speak(language === 'ar' ? 'بدء التسلسل' : 'Starting sequence');
  voiceOver.speak(language === 'ar' ? 'الخطوة الأولى' : 'Step one');
  voiceOver.speak(language === 'ar' ? 'الخطوة الثانية' : 'Step two');
  // These will be queued and played in order
};
```

## Voice Settings

Users can customize:
- **Enabled/Disabled**: Turn voice over on/off
- **Speed**: Speech rate (0.5 - 2.0)
- **Pitch**: Voice pitch (0.5 - 2.0)
- **Volume**: Speech volume (0.0 - 1.0)
- **Voice**: Select from available system voices

Settings are automatically saved to localStorage and persist across sessions.

## Best Practices

### 1. Be Concise
Voice announcements should be brief and clear:
```javascript
// Good
voiceOver.speak('Letter A learned');

// Too verbose
voiceOver.speak('Congratulations, you have successfully learned the letter A which is the first letter of the alphabet');
```

### 2. Use Immediate Playback Wisely
Use `immediate: true` for important announcements:
```javascript
// Important feedback - interrupt current speech
voiceOver.speak('Correct answer!', true);

// Background info - queue it
voiceOver.speakAuto('Next question loading');
```

### 3. Respect User Preferences
Always use `speakAuto()` for non-critical announcements:
```javascript
// User can disable these via autoPlay setting
voiceOver.speakAuto('Hovering over button');

// Always announce critical feedback
voiceOver.speak('Quiz completed', true);
```

### 4. Clean Text Before Speaking
Remove emojis and special characters:
```javascript
const cleanText = text
  .replace(/[🎙️📱⚙️🔊🎯✨💬📋🗑️💾]/g, '')
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .trim();

voiceOver.speak(cleanText);
```

### 5. Provide Context
Include context in announcements:
```javascript
// Better
voiceOver.speak(`Letter ${letter.name}, pronunciation ${letter.pronunciation}`);

// Less helpful
voiceOver.speak(letter.name);
```

## Components with Voice Over

The following components already have voice over integrated:

- ✅ ArabicAlphabetLearning
- ✅ ArabicColorsLearning
- ✅ QuizCenter
- ✅ LearnHub
- ✅ VoiceInterface

To add it to other components, follow this guide!

## Troubleshooting

### Voice over not working?

1. Check browser support:
   ```javascript
   if (!window.speechSynthesis) {
     console.warn('Speech synthesis not supported');
   }
   ```

2. Ensure voices are loaded:
   ```javascript
   const voices = window.speechSynthesis.getVoices();
   console.log('Available voices:', voices);
   ```

3. Check language setting:
   ```javascript
   // Make sure language prop is 'ar' or 'en'
   const voiceOver = useVoiceOver(language);
   ```

### Arabic not speaking correctly?

Install Arabic voices on your system:
- **Windows**: Settings → Time & Language → Speech → Add voices
- **macOS**: System Preferences → Accessibility → Speech → System Voice
- **Linux**: Install `speech-dispatcher` and Arabic language packs

## Examples

### Complete Example Component

```javascript
import React, { useState } from 'react';
import { useVoiceOver } from '../hooks/useVoiceOver';
import VoiceOverControl from './VoiceOverControl';

const MyLearningComponent = ({ language }) => {
  const [currentItem, setCurrentItem] = useState(0);
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  const items = [
    { nameEn: 'Apple', nameAr: 'تفاحة' },
    { nameEn: 'Banana', nameAr: 'موز' }
  ];

  const handleNext = () => {
    const nextIndex = (currentItem + 1) % items.length;
    const next = items[nextIndex];

    voiceOver.speakAuto(
      language === 'ar' ? next.nameAr : next.nameEn
    );

    setCurrentItem(nextIndex);
  };

  const handleComplete = () => {
    voiceOver.speak(
      language === 'ar' ? 'أحسنت!' : 'Well done!',
      true
    );
  };

  return (
    <div className="my-learning-component">
      <VoiceOverControl
        isEnabled={voiceOver.isEnabled}
        isSpeaking={voiceOver.isSpeaking}
        onToggle={voiceOver.toggleEnabled}
        language={language}
        position="top-right"
      />

      <div className="content">
        <h1>{language === 'ar' ? items[currentItem].nameAr : items[currentItem].nameEn}</h1>
        <button onClick={handleNext}>Next</button>
        <button onClick={handleComplete}>Complete</button>
      </div>
    </div>
  );
};

export default MyLearningComponent;
```

## Support

For issues or questions, check:
- Hook implementation: `src/hooks/useVoiceOver.js`
- Control component: `src/components/VoiceOverControl.js`
- Working examples in learning components

Happy coding! 🎙️
