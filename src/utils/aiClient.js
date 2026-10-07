// src/utils/aiClient.js — One AI entry point, chosen automatically
//
// WHY THIS EXISTS
// Both chat screens used to carry their own copy of the wait-for-SDK / timeout
// / fall-back logic around `window.puter.ai.chat`. That logic lives here once.
//
// WHAT "AUTOMATIC" MEANS HERE
// Nothing to pick and nothing to configure at runtime. On the first request
// this module probes the providers below in order and keeps using the first
// one that answers, caching the choice for the session:
//
//   1. BACKEND  — `REACT_APP_AI_API_URL`. A POST to your own endpoint, which
//                 holds the provider key server-side. This is the right answer
//                 for a deployed app, and the only one that keeps a key out of
//                 the browser bundle.
//   2. ANTHROPIC — `REACT_APP_ANTHROPIC_API_KEY`, called directly. Convenient
//                 for local development; a key in a CRA bundle is readable by
//                 anyone who opens the app, so this path warns and should not
//                 be used in production.
//   3. PUTER    — Puter.js (`puter.ai.chat`), loaded from the script tag in
//                 public/index.html. Needs no key and no configuration, so
//                 this is what answers out of the box.
//   4. OFFLINE  — a built-in Arabic tutor that answers from the app's own
//                 lesson content. No network, always available, and it says so
//                 rather than pretending to be a general assistant.
//
// Callers get `{ text, provider, offline }` so the UI can tell the learner
// which one answered instead of leaving them guessing.

const BACKEND_URL = process.env.REACT_APP_AI_API_URL || '';
const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY || '';
const ANTHROPIC_MODEL = process.env.REACT_APP_ANTHROPIC_MODEL || 'claude-sonnet-5';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const PUTER_SCRIPT_URL = 'https://js.puter.com/v2/';
const PUTER_MODEL = process.env.REACT_APP_PUTER_MODEL || 'gpt-5.4-nano';
const PUTER_LOAD_TIMEOUT_MS = 8000;

const DEFAULT_TIMEOUT_MS = 30000;

/** Which provider answered last. Probed once, then reused for the session. */
let resolvedProvider = null;

/** Abort a fetch on a deadline, so a hung request cannot wedge the UI. */
const fetchWithTimeout = async (url, options, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

/**
 * 1. Your own backend. The contract is deliberately minimal — POST a prompt,
 * get `{ reply }` (or `{ text }` / `{ content }` / `{ message }`) back — so an
 * existing endpoint usually needs no changes to work here.
 */
const callBackend = async (prompt, { system, timeoutMs }) => {
  const response = await fetchWithTimeout(
    BACKEND_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system, model: ANTHROPIC_MODEL })
    },
    timeoutMs
  );

  if (!response.ok) {
    throw new Error(`AI backend returned ${response.status}`);
  }

  const data = await response.json();
  const text = data.reply ?? data.text ?? data.content ?? data.message ?? '';
  if (!text) throw new Error('AI backend returned an empty reply');
  return typeof text === 'string' ? text : JSON.stringify(text);
};

/**
 * 2. Anthropic directly. `anthropic-dangerous-direct-browser-access` is
 * required for a browser-origin call and is itself the reason this path is a
 * development convenience only: the key travels in the bundle.
 */
const callAnthropic = async (prompt, { system, timeoutMs }) => {
  const response = await fetchWithTimeout(
    ANTHROPIC_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        ...(system ? { system } : {}),
        messages: [{ role: 'user', content: prompt }]
      })
    },
    timeoutMs
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Anthropic API ${response.status}: ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) throw new Error('Anthropic API returned no text');
  return text;
};

/* ---------------------------------------------------------------------------
   3. PUTER
   --------------------------------------------------------------------------- */

const hasPuter = () =>
  typeof window !== 'undefined' &&
  window.puter &&
  window.puter.ai &&
  typeof window.puter.ai.chat === 'function';

let puterLoading = null;

/**
 * Resolve once `window.puter` is usable. index.html already carries the script
 * tag; it is injected here only if that tag is missing, so the provider still
 * works when this module is used outside the app shell.
 */
const loadPuter = () => {
  if (hasPuter()) return Promise.resolve();
  if (puterLoading) return puterLoading;

  puterLoading = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Puter SDK needs a browser'));
      return;
    }

    if (!document.querySelector(`script[src="${PUTER_SCRIPT_URL}"]`)) {
      const script = document.createElement('script');
      script.src = PUTER_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }

    const startedAt = Date.now();
    const poll = setInterval(() => {
      if (hasPuter()) {
        clearInterval(poll);
        resolve();
      } else if (Date.now() - startedAt > PUTER_LOAD_TIMEOUT_MS) {
        clearInterval(poll);
        reject(new Error('Puter SDK did not load'));
      }
    }, 100);
  }).catch((error) => {
    // Let the next request try again rather than caching the failure.
    puterLoading = null;
    throw error;
  });

  return puterLoading;
};

/** `puter.ai.chat` answers with a string or `{ message: { content } }`. */
const puterText = (response) => {
  if (typeof response === 'string') return response;
  const content = response?.message?.content ?? response?.text ?? '';
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part === 'string' ? part : part?.text || '')).join('');
  }
  return typeof content === 'string' ? content : '';
};

const callPuter = async (prompt, { system, timeoutMs }) => {
  await loadPuter();

  const messages = system
    ? [{ role: 'system', content: system }, { role: 'user', content: prompt }]
    : prompt;

  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Puter request timed out')), timeoutMs);
  });

  try {
    const response = await Promise.race([
      window.puter.ai.chat(messages, { model: PUTER_MODEL }),
      deadline
    ]);
    const text = puterText(response).trim();
    if (!text) throw new Error('Puter returned an empty reply');
    return text;
  } catch (error) {
    // Puter rejects with plain objects ({ error: { message } }) as often as Errors.
    if (error instanceof Error) throw error;
    throw new Error(error?.error?.message || error?.message || JSON.stringify(error));
  } finally {
    clearTimeout(timer);
  }
};

/* ---------------------------------------------------------------------------
   4. OFFLINE TUTOR
   Answers from the app's own lesson content rather than inventing facts. It is
   not a general assistant and does not claim to be — on anything it does not
   know, it says so and points at the module that covers it. That is far more
   useful to a child than a plausible-sounding guess.
   --------------------------------------------------------------------------- */

/** Vocabulary the offline tutor can answer about, drawn from the modules. */
const OFFLINE_VOCAB = [
  { ar: 'كِتَاب', en: 'book', say: 'ki-taab' },
  { ar: 'قَلَم', en: 'pen', say: 'qa-lam' },
  { ar: 'مَاء', en: 'water', say: 'maa' },
  { ar: 'طَعَام', en: 'food', say: 'ta-aam' },
  { ar: 'بَيْت', en: 'house', say: 'bayt' },
  { ar: 'عَائِلَة', en: 'family', say: 'aa-i-la' },
  { ar: 'سَعِيد', en: 'happy', say: 'sa-eed' },
  { ar: 'صَدِيق', en: 'friend', say: 'sa-deeq' },
  { ar: 'مَدْرَسَة', en: 'school', say: 'mad-ra-sa' },
  { ar: 'شَمْس', en: 'sun', say: 'shams' },
  { ar: 'قَمَر', en: 'moon', say: 'qa-mar' },
  { ar: 'أَحْمَر', en: 'red', say: 'ah-mar' },
  { ar: 'أَزْرَق', en: 'blue', say: 'az-raq' },
  { ar: 'أَخْضَر', en: 'green', say: 'akh-dar' }
];

const OFFLINE_PHRASES = [
  { ar: 'السَّلَامُ عَلَيْكُم', en: 'peace be upon you (hello)', say: 'as-sa-laa-mu a-lay-kum' },
  { ar: 'صَبَاحُ الخَيْر', en: 'good morning', say: 'sa-baah al-khayr' },
  { ar: 'شُكْرًا', en: 'thank you', say: 'shuk-ran' },
  { ar: 'كَيْفَ حَالُك', en: 'how are you?', say: 'kay-fa haa-luk' },
  { ar: 'مَعَ السَّلَامَة', en: 'goodbye', say: 'ma-a as-sa-laa-ma' }
];

const bullets = (lines) => lines.map((line) => `• ${line}`).join('\n');

/** Pull the learner's actual question out of the prompt the screens build. */
const extractQuestion = (prompt) => {
  const text = String(prompt || '');
  const afterMarker =
    text.split('Current Request:').pop() ||
    text.split('Human:').pop() ||
    text;
  return afterMarker.trim().slice(-300).toLowerCase();
};

const offlineReply = (prompt) => {
  const question = extractQuestion(prompt);

  // "How do I say X in Arabic?" / "What does X mean?"
  const vocabHit = [...OFFLINE_VOCAB, ...OFFLINE_PHRASES].find(
    (entry) => question.includes(entry.en.split(' ')[0]) || question.includes(entry.ar)
  );
  if (vocabHit) {
    return bullets([
      `**${vocabHit.en}** in Arabic is **${vocabHit.ar}**`,
      `You say it like this: *${vocabHit.say}*`,
      'Tap the speaker on any word card to hear it read aloud',
      'The Words lesson has this one with a picture'
    ]);
  }

  if (/\b(letter|alphabet|حرف|حروف)\b/.test(question)) {
    return bullets([
      'Arabic has 28 letters and is written from right to left',
      'Letters change shape slightly depending on where they sit in a word',
      'Start with the Alphabet lesson — it takes them one at a time with a sound and a picture',
      'The Handwriting lesson then lets you trace each one'
    ]);
  }

  if (/\b(colour|color|لون|ألوان)\b/.test(question)) {
    return bullets([
      'Arabic colours you can learn right now: أَحْمَر (red), أَزْرَق (blue), أَخْضَر (green), أَصْفَر (yellow)',
      'Say them: ah-mar, az-raq, akh-dar, as-far',
      'The Colors lesson pairs each one with a real photo',
      'Colour Matching turns it into a game once you know a few'
    ]);
  }

  if (/\b(number|count|رقم|أرقام|عدد)\b/.test(question)) {
    return bullets([
      'One to five: وَاحِد, اِثْنَان, ثَلَاثَة, أَرْبَعَة, خَمْسَة',
      'Say them: waa-hid, ith-naan, tha-laa-tha, ar-ba-a, kham-sa',
      'The Numbers game has you count objects out loud'
    ]);
  }

  if (/\b(hello|hi|greet|سلام|مرحبا)\b/.test(question)) {
    return bullets([
      'The usual greeting is **السَّلَامُ عَلَيْكُم** — *as-sa-laa-mu a-lay-kum*',
      'The reply is **وَعَلَيْكُم السَّلَام** — *wa-a-lay-kum as-sa-laam*',
      'In the morning you can say **صَبَاحُ الخَيْر** — *sa-baah al-khayr*'
    ]);
  }

  if (/\b(point|score|نقاط|نقطة)\b/.test(question)) {
    return bullets([
      'You earn points for every letter, colour, word and sentence you learn',
      'Quizzes pay more, and a perfect score pays most',
      'Once you have enough, the Rewards screen lets you change the colours of the app'
    ]);
  }

  return bullets([
    "I'm answering offline right now, so I can only help with the lessons in this app",
    'Ask me about a letter, a colour, a number, a word, or how to greet someone',
    'Everything else is waiting for you in the Learn section',
    'Check your internet connection and ask me again for the full assistant'
  ]);
};

/* ------------------------------------------------------------------------- */

/** Which providers are configured, in the order they are tried. */
const availableProviders = () => {
  const providers = [];
  if (BACKEND_URL) providers.push('backend');
  if (ANTHROPIC_KEY) providers.push('anthropic');
  providers.push('puter');
  providers.push('offline');
  return providers;
};

const callProvider = (provider, prompt, options) => {
  if (provider === 'backend') return callBackend(prompt, options);
  if (provider === 'anthropic') return callAnthropic(prompt, options);
  if (provider === 'puter') return callPuter(prompt, options);
  return Promise.resolve(offlineReply(prompt));
};

/**
 * Ask the AI. Tries each configured provider in turn and falls through to the
 * offline tutor, so this never rejects and the chat screens never need their
 * own error path.
 *
 * @returns {Promise<{text: string, provider: string, offline: boolean}>}
 */
export const askAI = async (prompt, { system = '', timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  const providers = resolvedProvider
    ? [resolvedProvider, ...availableProviders().filter((p) => p !== resolvedProvider)]
    : availableProviders();

  for (const provider of providers) {
    try {
      const text = await callProvider(provider, prompt, { system, timeoutMs });
      resolvedProvider = provider;
      return { text, provider, offline: provider === 'offline' };
    } catch (error) {
      // Try the next provider. Only the last failure is worth logging, and
      // 'offline' cannot fail, so there is always a result.
      console.warn(`[aiClient] ${provider} failed:`, error.message);
      if (resolvedProvider === provider) resolvedProvider = null;
    }
  }

  return { text: offlineReply(prompt), provider: 'offline', offline: true };
};

/** Whether a real provider is available at all. Puter needs no configuration. */
export const isAIConfigured = () => true;

/** The provider that answered most recently, or null before the first call. */
export const getActiveProvider = () => resolvedProvider;

if (process.env.NODE_ENV !== 'production' && !BACKEND_URL && ANTHROPIC_KEY) {
  console.warn(
    '[aiClient] Calling Anthropic directly from the browser. The key is in the ' +
    'bundle and readable by anyone using the app — set REACT_APP_AI_API_URL to ' +
    'a server endpoint before deploying.'
  );
}

export default { askAI, isAIConfigured, getActiveProvider };
