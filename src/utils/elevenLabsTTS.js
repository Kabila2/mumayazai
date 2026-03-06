// ElevenLabs TTS utility for Arabic voice
// Default voice: uses eleven_multilingual_v2 model which supports Arabic
// Override via environment variables:
//   REACT_APP_ELEVENLABS_API_KEY      - your ElevenLabs API key
//   REACT_APP_ELEVENLABS_ARABIC_VOICE_ID - ElevenLabs voice ID for Arabic

const ELEVENLABS_API_KEY = process.env.REACT_APP_ELEVENLABS_API_KEY;

// Default: "Layla" - ElevenLabs Arabic female voice
// You can replace this with any multilingual or Arabic-specific voice ID from your ElevenLabs account
const DEFAULT_ARABIC_VOICE_ID =
  process.env.REACT_APP_ELEVENLABS_ARABIC_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";

const MODEL_ID = "eleven_multilingual_v2";

let currentAudio = null;

export const isElevenLabsConfigured = () => Boolean(ELEVENLABS_API_KEY);

/**
 * Speak text using ElevenLabs TTS API.
 * Returns a promise that resolves when audio finishes playing, or rejects on error.
 */
export const speakWithElevenLabs = async (text, { voiceId, rate = 1.0, onStart, onEnd } = {}) => {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ElevenLabs API key not configured (REACT_APP_ELEVENLABS_API_KEY)");
  }

  stopElevenLabsSpeech();

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || DEFAULT_ARABIC_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: rate,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs TTS error ${response.status}: ${err}`);
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);

  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    audio.playbackRate = rate;

    audio.onplay = () => onStart?.();
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      onEnd?.();
      resolve();
    };
    audio.onerror = (e) => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      onEnd?.();
      reject(e);
    };

    audio.play().catch(reject);
  });
};

export const stopElevenLabsSpeech = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
};
