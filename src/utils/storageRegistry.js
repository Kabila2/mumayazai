// src/utils/storageRegistry.js - Single source of truth for user-owned storage
//
// A user's data is spread across dozens of localStorage keys in three shapes:
//
//   1. user-scoped   `stellar_points_ali@x.com`  - the whole key is theirs
//   2. device-scoped `arabic_wordbuilder_progress` - app data with no owner
//                    recorded, so it belongs to whoever uses this device
//   3. shared        `stellar_users`, `stellar_homework` - one container holding
//                    every user's slice; only part of it is theirs
//
// Export, delete and import must agree on "what is this user's data?", so that
// answer is computed here once. Anything registered below is automatically
// exported, deleted and restored together, which is what keeps "Delete All
// Data" from leaving half the platform's state behind.

const low = (value) => (typeof value === "string" ? value.toLowerCase() : "");

/** Key prefixes that mark a key as belonging to this app at all. */
const APP_KEY_PREFIXES = [
  "stellar_",
  "arabic_",
  "alphabet_",
  "child_session_",
];

/**
 * Device-wide app data with no owner recorded in the key or the value. Wiped
 * and exported whole - on a shared browser this is the current user's work.
 */
const DEVICE_KEYS = [
  "arabic_learning_progress",
  "arabic_wordbuilder_progress",
  "arabic_alphabet_progress",
  "arabic_colors_progress",
  "arabic_words_progress",
  "arabic_sentences_progress",
  "arabic_memory_progress",
  "stellar_learning_progress",
  "stellar_daily_tasks",
  "stellar_user_points",
  "stellar_saved_chats",
  "stellar_saved_voice_chats",
  "stellar_chat_memory",
  "stellar_voice_memory",
  "stellar_voice_data",
  "stellar_unread_messages",
  "stellar_sync_interval",
  "stellar_onboarding_completed",
];

/**
 * Settings rather than learning data. Still exported and restored so a
 * re-import brings the platform back exactly as it was, and still cleared by a
 * full wipe so "delete everything" really does reset to a fresh install.
 */
const PREFERENCE_KEYS = [
  "stellar_dark_mode",
  "stellar_sounds_enabled",
  "stellar_language",
  "stellar_font",
  "stellar_text_size",
  "stellar_role",
  "stellar_voice_settings",
  "disability",
  "app-language",
  "language",
  "high-contrast",
  "font-size",
  "reduced-motion",
  "voice-speed",
  "voice-pitch",
  "voice-selected",
];

/**
 * Per-user keys built as `${prefix}${email}`. The generic suffix match in
 * `isUserScopedKey` already finds these; the list is kept so the shape of the
 * storage layout stays documented and greppable.
 */
export const USER_KEY_PREFIXES = [
  "stellar_points_",
  "stellar_points_notifications_",
  "stellar_points_milestone_",
  "stellar_points_threshold_",
  "stellar_streak_",
  "stellar_achievements_",
  "stellar_quiz_history_",
  "stellar_notifications_",
  "stellar_schedule_",
  "stellar_certificates_",
  "stellar_completions_",
  "stellar_weekend_studied_",
  "stellar_learning_time_",
  "stellar_topics_progress_",
  "stellar_sync_data_",
  "stellar_last_sync_",
  "stellar_parent_data_",
  "alphabet_learned_",
  "alphabet_viewed_",
  "child_session_",
];

/** The login session - dropped only when the account itself is being removed. */
const SESSION_KEY = "stellar_session";

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

const allStorageKeys = () => {
  try {
    return Object.keys(localStorage);
  } catch (error) {
    console.error("Error reading localStorage keys:", error);
    return [];
  }
};

const readJSON = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (error) {
    return fallback;
  }
};

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
  }
};

const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

export const isAppKey = (key) => APP_KEY_PREFIXES.some((p) => key.startsWith(p));

/** Every email that has an account on this device. */
export const getKnownEmails = () => {
  const users = readJSON("stellar_users", {});
  return Object.keys(users).map(low);
};

/**
 * True when `key` is the user's own `${prefix}${email}` key.
 *
 * Emails may contain underscores, so a plain suffix match can misfire:
 * `stellar_points_ali_b@x.com` also ends with `_b@x.com`. When another
 * registered email produces a longer match, that longer email owns the key.
 */
export const isUserScopedKey = (key, emailLower, knownEmails = []) => {
  if (!isAppKey(key)) return false;
  const keyLower = low(key);
  if (!keyLower.endsWith(`_${emailLower}`)) return false;

  return !knownEmails.some(
    (other) =>
      other !== emailLower &&
      other.length > emailLower.length &&
      keyLower.endsWith(`_${other}`)
  );
};

// ---------------------------------------------------------------------------
// Shared containers
//
// Each descriptor knows how to pull one user's slice out of a container, how to
// scrub that slice, and how to merge a slice back in without disturbing other
// users. `clear` returning an empty value means the key is removed entirely.
// ---------------------------------------------------------------------------

/** A plain `{ [email]: data }` map - user stats, module progress, and friends. */
const emailKeyedMap = (key) => ({
  key,
  extract: (all, email) =>
    all && all[email] !== undefined ? { [email]: all[email] } : null,
  clear: (all, email) => {
    const next = { ...(all || {}) };
    delete next[email];
    return next;
  },
  merge: (all, slice) => ({ ...(all || {}), ...slice }),
});

/** Fields on a user record that must survive a wipe or the user is locked out. */
const ACCOUNT_FIELDS = ["email", "password", "role", "createdAt"];

const participantsOf = (conversation) =>
  Array.isArray(conversation?.participants)
    ? conversation.participants.map(low)
    : [];

const CONTAINERS = [
  // The account record. A wipe clears the profile but keeps the credentials so
  // the user stays logged in and can immediately import their backup; removing
  // the account is opt-in via `dropAccount`.
  {
    key: "stellar_users",
    extract: (all, email) =>
      all && all[email] ? { [email]: all[email] } : null,
    clear: (all, email, options = {}) => {
      const next = { ...(all || {}) };
      if (!next[email]) return next;

      if (options.dropAccount) {
        delete next[email];
        return next;
      }

      const preserved = {};
      ACCOUNT_FIELDS.forEach((field) => {
        if (next[email][field] !== undefined) preserved[field] = next[email][field];
      });
      next[email] = preserved;
      return next;
    },
    merge: (all, slice, email) => {
      const next = { ...(all || {}) };
      // Never let an imported file overwrite the live password.
      const current = next[email] || {};
      next[email] = { ...current, ...slice[email] };
      if (current.password !== undefined) next[email].password = current.password;
      return next;
    },
  },

  emailKeyedMap("stellar_user_stats"),
  emailKeyedMap("stellar_module_progress"),
  emailKeyedMap("stellar_leaderboard"),
  emailKeyedMap("stellar_teachers"),

  // `{ [childEmail]: { parentEmail } }` - relevant from either side of the link.
  {
    key: "stellar_parent_child_links",
    extract: (all, email) => {
      const out = {};
      Object.entries(all || {}).forEach(([child, link]) => {
        if (low(child) === email || low(link?.parentEmail) === email) {
          out[child] = link;
        }
      });
      return isEmptyValue(out) ? null : out;
    },
    clear: (all, email) => {
      const next = {};
      Object.entries(all || {}).forEach(([child, link]) => {
        if (low(child) !== email && low(link?.parentEmail) !== email) {
          next[child] = link;
        }
      });
      return next;
    },
    merge: (all, slice) => ({ ...(all || {}), ...slice }),
  },

  emailKeyedMap("stellar_child_activity"),

  // Legacy single-object parent record, superseded by `stellar_parent_data_<email>`.
  {
    key: "stellar_parent_data",
    extract: (data, email) => (low(data?.email) === email ? data : null),
    clear: (data, email) => (low(data?.email) === email ? null : data),
    merge: (data, slice) => slice,
  },

  // Same shape for the single-object teacher record.
  {
    key: "stellar_teacher_data",
    extract: (data, email) => (low(data?.email) === email ? data : null),
    clear: (data, email) => (low(data?.email) === email ? null : data),
    merge: (data, slice) => slice,
  },

  // `{ [classId]: cls }` - owned when the user teaches it, otherwise only their
  // own student entry belongs to them.
  {
    key: "stellar_classes",
    extract: (all, email) => {
      const out = {};
      Object.entries(all || {}).forEach(([id, cls]) => {
        if (low(cls?.teacherEmail) === email) {
          out[id] = cls;
          return;
        }
        const enrolled = (cls?.students || []).filter((s) => low(s?.email) === email);
        if (enrolled.length) out[id] = { ...cls, students: enrolled };
      });
      return isEmptyValue(out) ? null : out;
    },
    clear: (all, email) => {
      const next = {};
      Object.entries(all || {}).forEach(([id, cls]) => {
        if (low(cls?.teacherEmail) === email) return; // their class goes entirely
        const students = (cls?.students || []).filter((s) => low(s?.email) !== email);
        next[id] = { ...cls, students, totalStudents: students.length };
      });
      return next;
    },
    merge: (all, slice) => {
      const next = { ...(all || {}) };
      Object.entries(slice).forEach(([id, cls]) => {
        if (!next[id]) {
          next[id] = cls;
          return;
        }
        const students = [...(next[id].students || [])];
        (cls.students || []).forEach((student) => {
          const at = students.findIndex((s) => low(s?.email) === low(student?.email));
          if (at === -1) students.push(student);
          else students[at] = student;
        });
        next[id] = { ...next[id], ...cls, students, totalStudents: students.length };
      });
      return next;
    },
  },

  emailKeyedMap("stellar_student_enrollments"),

  // `{ [assignmentId]: assignment }` - the teacher owns the assignment, each
  // student owns their entry in `submissions`.
  {
    key: "stellar_assignments",
    extract: (all, email) => {
      const out = {};
      Object.entries(all || {}).forEach(([id, assignment]) => {
        if (low(assignment?.teacherEmail) === email) {
          out[id] = assignment;
          return;
        }
        const submission = (assignment?.submissions || {})[email];
        if (submission !== undefined) {
          out[id] = { ...assignment, submissions: { [email]: submission } };
        }
      });
      return isEmptyValue(out) ? null : out;
    },
    clear: (all, email) => {
      const next = {};
      Object.entries(all || {}).forEach(([id, assignment]) => {
        if (low(assignment?.teacherEmail) === email) return;
        const submissions = { ...(assignment?.submissions || {}) };
        delete submissions[email];
        next[id] = { ...assignment, submissions };
      });
      return next;
    },
    merge: (all, slice) => {
      const next = { ...(all || {}) };
      Object.entries(slice).forEach(([id, assignment]) => {
        next[id] = next[id]
          ? {
              ...next[id],
              ...assignment,
              submissions: {
                ...(next[id].submissions || {}),
                ...(assignment.submissions || {}),
              },
            }
          : assignment;
      });
      return next;
    },
  },

  // An array of homework items. The user owns what they created plus their own
  // completions inside other people's assignments.
  {
    key: "stellar_homework",
    extract: (list, email) => {
      const out = (Array.isArray(list) ? list : [])
        .map((hw) => {
          if (low(hw?.createdBy) === email) return hw;
          const completions = (hw?.completions || []).filter(
            (c) => low(c?.studentEmail) === email
          );
          const inGroup = (hw?.assignedToGroup || []).some((e) => low(e) === email);
          if (completions.length || inGroup || low(hw?.assignedTo) === email) {
            return { ...hw, completions };
          }
          return null;
        })
        .filter(Boolean);
      return out.length ? out : null;
    },
    clear: (list, email) =>
      (Array.isArray(list) ? list : [])
        .filter((hw) => low(hw?.createdBy) !== email)
        .map((hw) => ({
          ...hw,
          assignedToGroup: (hw?.assignedToGroup || []).filter((e) => low(e) !== email),
          completions: (hw?.completions || []).filter(
            (c) => low(c?.studentEmail) !== email
          ),
        })),
    merge: (list, slice) => {
      const next = Array.isArray(list) ? [...list] : [];
      slice.forEach((hw) => {
        const at = next.findIndex((existing) => existing?.id === hw?.id);
        if (at === -1) {
          next.push(hw);
          return;
        }
        const completions = [...(next[at].completions || [])];
        (hw.completions || []).forEach((completion) => {
          const dupe = completions.some(
            (c) =>
              low(c?.studentEmail) === low(completion?.studentEmail) &&
              c?.completedAt === completion?.completedAt
          );
          if (!dupe) completions.push(completion);
        });
        next[at] = { ...next[at], ...hw, completions };
      });
      return next;
    },
  },

  // Conversations the user takes part in. Their per-conversation message keys
  // are collected separately in `collectUserData`.
  {
    key: "stellar_conversations",
    extract: (all, email) => {
      const out = {};
      Object.entries(all || {}).forEach(([id, conv]) => {
        if (participantsOf(conv).includes(email)) out[id] = conv;
      });
      return isEmptyValue(out) ? null : out;
    },
    clear: (all, email) => {
      const next = {};
      Object.entries(all || {}).forEach(([id, conv]) => {
        if (!participantsOf(conv).includes(email)) next[id] = conv;
      });
      return next;
    },
    merge: (all, slice) => ({ ...(all || {}), ...slice }),
  },
];

/** Ids of every conversation the user takes part in. */
const getConversationIds = (emailLower) => {
  const conversations = readJSON("stellar_conversations", {});
  return Object.entries(conversations)
    .filter(([, conv]) => participantsOf(conv).includes(emailLower))
    .map(([id]) => id);
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Collect everything belonging to `userEmail`.
 *
 * Returns two buckets:
 *   standalone - `{ key: rawString }` for keys owned outright
 *   shared     - `{ key: slice }` extracted out of shared containers
 *
 * @param {string} userEmail
 * @param {{ includePreferences?: boolean }} options
 */
export const collectUserData = (userEmail, options = {}) => {
  const { includePreferences = true } = options;
  const email = low(userEmail);
  const standalone = {};
  const shared = {};

  if (!email) return { standalone, shared };

  const knownEmails = getKnownEmails();

  const takeStandalone = (key) => {
    const raw = localStorage.getItem(key);
    if (raw !== null) standalone[key] = raw;
  };

  // 1. Keys suffixed with this user's email, including any a newer feature
  //    added without registering a prefix here.
  allStorageKeys()
    .filter((key) => isUserScopedKey(key, email, knownEmails))
    .forEach(takeStandalone);

  // 2. Device-wide app data.
  DEVICE_KEYS.forEach(takeStandalone);

  // 3. Settings.
  if (includePreferences) PREFERENCE_KEYS.forEach(takeStandalone);

  // 4. Message threads for the user's conversations.
  const conversationIds = getConversationIds(email);
  conversationIds.forEach((id) => takeStandalone(`stellar_messages_${id}`));

  // 5. The user's slice of each shared container.
  CONTAINERS.forEach(({ key, extract }) => {
    const parsed = readJSON(key);
    if (parsed === null) return;
    const slice = extract(parsed, email);
    if (!isEmptyValue(slice)) shared[key] = slice;
  });

  // 6. Legacy flat message map, sliced to the user's conversations.
  const flatMessages = readJSON("stellar_messages");
  if (flatMessages && typeof flatMessages === "object") {
    const slice = {};
    conversationIds.forEach((id) => {
      if (flatMessages[id] !== undefined) slice[id] = flatMessages[id];
    });
    if (!isEmptyValue(slice)) shared["stellar_messages"] = slice;
  }

  return { standalone, shared };
};

/**
 * Delete everything belonging to `userEmail`.
 *
 * By default the account record and login session survive so the user can
 * import a backup straight afterwards; pass `dropAccount: true` to remove the
 * account itself and log out.
 *
 * @param {string} userEmail
 * @param {{ dropAccount?: boolean, includePreferences?: boolean }} options
 * @returns {{ removedKeys: string[], clearedContainers: string[] }}
 */
export const purgeUserData = (userEmail, options = {}) => {
  const { dropAccount = false, includePreferences = true } = options;
  const email = low(userEmail);
  const removedKeys = [];
  const clearedContainers = [];

  if (!email) return { removedKeys, clearedContainers };

  const knownEmails = getKnownEmails();
  const conversationIds = getConversationIds(email);

  const remove = (key) => {
    try {
      if (localStorage.getItem(key) === null) return;
      localStorage.removeItem(key);
      removedKeys.push(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  };

  allStorageKeys()
    .filter((key) => isUserScopedKey(key, email, knownEmails))
    .forEach(remove);

  DEVICE_KEYS.forEach(remove);
  if (includePreferences) PREFERENCE_KEYS.forEach(remove);
  conversationIds.forEach((id) => remove(`stellar_messages_${id}`));

  CONTAINERS.forEach(({ key, clear }) => {
    const parsed = readJSON(key);
    if (parsed === null) return;

    const next = clear(parsed, email, { dropAccount });
    if (isEmptyValue(next)) {
      remove(key);
    } else {
      writeJSON(key, next);
      clearedContainers.push(key);
    }
  });

  // Legacy flat message map.
  const flatMessages = readJSON("stellar_messages");
  if (flatMessages && typeof flatMessages === "object") {
    const next = { ...flatMessages };
    conversationIds.forEach((id) => delete next[id]);
    if (isEmptyValue(next)) remove("stellar_messages");
    else writeJSON("stellar_messages", next);
  }

  if (dropAccount) remove(SESSION_KEY);

  return { removedKeys, clearedContainers };
};

/**
 * Write a snapshot produced by `collectUserData` back into localStorage.
 *
 * Standalone keys are written verbatim. Container slices are merged into
 * whatever is there now so other users' data is never clobbered.
 *
 * @param {{ standalone?: object, shared?: object }} snapshot
 * @param {string} userEmail
 * @returns {{ restoredKeys: string[], mergedContainers: string[] }}
 */
export const restoreUserData = (snapshot, userEmail) => {
  const email = low(userEmail);
  const restoredKeys = [];
  const mergedContainers = [];
  const { standalone = {}, shared = {} } = snapshot || {};

  Object.entries(standalone).forEach(([key, raw]) => {
    if (typeof raw !== "string") return;
    try {
      localStorage.setItem(key, raw);
      restoredKeys.push(key);
    } catch (error) {
      console.error(`Error restoring ${key}:`, error);
    }
  });

  Object.entries(shared).forEach(([key, slice]) => {
    const descriptor = CONTAINERS.find((c) => c.key === key);
    const current = readJSON(key);

    if (!descriptor) {
      // Legacy flat message map, or a container registered in a newer version.
      writeJSON(key, { ...(current || {}), ...slice });
      mergedContainers.push(key);
      return;
    }

    writeJSON(key, descriptor.merge(current, slice, email));
    mergedContainers.push(key);
  });

  return { restoredKeys, mergedContainers };
};

/**
 * How many storage entries the user currently owns. Used to confirm a wipe
 * actually emptied everything; `ignoreKeys` skips entries a wipe deliberately
 * preserves, such as the account record itself.
 */
export const countUserData = (userEmail, options = {}) => {
  const { ignoreKeys = [] } = options;
  const { standalone, shared } = collectUserData(userEmail);
  return [...Object.keys(standalone), ...Object.keys(shared)].filter(
    (key) => !ignoreKeys.includes(key)
  ).length;
};

export default {
  collectUserData,
  purgeUserData,
  restoreUserData,
  countUserData,
  isAppKey,
  isUserScopedKey,
  getKnownEmails,
  USER_KEY_PREFIXES,
};
