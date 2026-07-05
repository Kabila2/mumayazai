// src/utils/progressUtils.js - Centralized per-user learning progress
//
// Single source of truth for the four core learning modules
// (alphabet, colors, words, sentences). Each module records which items the
// user has learned, and the Progress Dashboard reads the resulting
// percentages. This keeps the dashboard in sync with what the user has
// actually done instead of fields that were never written.

const MODULE_PROGRESS_KEY = "stellar_module_progress";

const VALID_MODULES = ["alphabet", "colors", "words", "sentences"];

const keyOf = (userEmail) => (userEmail || "guest").toLowerCase();

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(MODULE_PROGRESS_KEY)) || {};
  } catch (error) {
    console.error("Error reading module progress:", error);
    return {};
  }
};

const writeAll = (all) => {
  try {
    localStorage.setItem(MODULE_PROGRESS_KEY, JSON.stringify(all));
  } catch (error) {
    console.error("Error writing module progress:", error);
  }
};

/**
 * Get the list of learned item ids for a module so a component can restore
 * its "learned" state when it remounts (e.g. after navigating away).
 */
export const getLearnedItems = (userEmail, moduleId) => {
  const all = readAll();
  return all[keyOf(userEmail)]?.[moduleId]?.learned || [];
};

/**
 * Record that a single item in a module has been learned. `itemId` should be
 * a stable identifier (letter, color name, "category_index", etc.). Duplicate
 * ids are ignored, so calling this repeatedly is safe.
 */
export const recordModuleItemLearned = (userEmail, moduleId, itemId, totalCount) => {
  if (!VALID_MODULES.includes(moduleId)) return null;

  const all = readAll();
  const k = keyOf(userEmail);
  if (!all[k]) all[k] = {};

  const mod = all[k][moduleId] || { learned: [], total: totalCount };
  if (totalCount) mod.total = totalCount;
  if (!mod.learned.includes(itemId)) mod.learned.push(itemId);

  all[k][moduleId] = mod;
  writeAll(all);
  return mod;
};

/**
 * Merge a set of already-learned items into a module. Used to migrate legacy
 * per-component storage (e.g. `alphabet_learned_<email>`) into the central
 * store without losing existing progress.
 */
export const syncModuleLearned = (userEmail, moduleId, learnedItems, totalCount) => {
  if (!VALID_MODULES.includes(moduleId) || !Array.isArray(learnedItems)) return null;

  const all = readAll();
  const k = keyOf(userEmail);
  if (!all[k]) all[k] = {};

  const existing = all[k][moduleId]?.learned || [];
  const merged = Array.from(new Set([...existing, ...learnedItems]));

  all[k][moduleId] = { learned: merged, total: totalCount };
  writeAll(all);
  return all[k][moduleId];
};

/**
 * Percentage (0-100) of a single module completed.
 */
export const getModulePercent = (userEmail, moduleId) => {
  const all = readAll();
  const mod = all[keyOf(userEmail)]?.[moduleId];
  if (!mod || !mod.total) return 0;
  return Math.min(100, Math.round((mod.learned.length / mod.total) * 100));
};

/**
 * Progress percentages for all four modules, shaped to match the fields the
 * Progress Dashboard expects.
 */
export const getModuleProgress = (userEmail) => ({
  alphabetProgress: getModulePercent(userEmail, "alphabet"),
  colorsProgress: getModulePercent(userEmail, "colors"),
  wordsProgress: getModulePercent(userEmail, "words"),
  sentencesProgress: getModulePercent(userEmail, "sentences"),
});

export default {
  getLearnedItems,
  recordModuleItemLearned,
  syncModuleLearned,
  getModulePercent,
  getModuleProgress,
};
