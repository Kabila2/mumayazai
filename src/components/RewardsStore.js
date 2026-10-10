import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import {
  getRewardsOverview,
  selectReward,
  applyRewards
} from '../utils/rewardsStore';
import { POINTS_CHANGED_EVENT } from '../utils/leaderboardUtils';
import { playClickSound } from '../utils/soundEffects';
import './RewardsStore.css';

/**
 * What points are FOR.
 *
 * Points were previously write-only: eleven modules awarded them, three
 * leaderboards ranked them, and there was nothing a learner could ever do with
 * one. This screen is the answer — reach a total and you unlock a way to change
 * how the app looks, then pick whichever unlocked reward you like.
 *
 * Rewards unlock at a threshold and are never deducted (see rewardsStore.js for
 * why: a child who saves up for the gold theme should not drop down the
 * leaderboard for using it). So a locked row shows how many more points are
 * needed, never a "buy" button — it is a goal, not a shop.
 */
const RewardsStore = ({ userEmail, language = 'en', onClose }) => {
  const [overview, setOverview] = useState(() => getRewardsOverview(userEmail));

  const tr = (en, ar) => (language === 'ar' ? ar : en);

  const refresh = useCallback(() => {
    setOverview(getRewardsOverview(userEmail));
  }, [userEmail]);

  useEffect(() => {
    // Apply on open as well as refresh: if points landed elsewhere since the
    // last visit, a reward may have just become available.
    applyRewards(userEmail);
    refresh();
    window.addEventListener(POINTS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(POINTS_CHANGED_EVENT, refresh);
  }, [userEmail, refresh]);

  const choose = (category, item) => {
    if (!item.unlocked) return;
    playClickSound();
    selectReward(userEmail, category, item.id);
    refresh();
  };

  const name = (item) => (language === 'ar' ? item.nameAr : item.nameEn);

  /** One row of choices. `renderPreview` draws whatever the reward looks like. */
  const renderGroup = ({ key, icon, title, blurb, items, renderPreview }) => (
    <section className="rewards-group" key={key} aria-labelledby={`rewards-${key}`}>
      <h3 className="rewards-group-title" id={`rewards-${key}`}>
        <span aria-hidden="true">{icon}</span> {title}
      </h3>
      <p className="rewards-group-blurb">{blurb}</p>

      <div className="rewards-options">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rewards-option ${item.active ? 'is-active' : ''} ${item.unlocked ? '' : 'is-locked'}`}
            onClick={() => choose(key, item)}
            disabled={!item.unlocked}
            aria-pressed={item.active}
            aria-label={
              item.unlocked
                ? name(item)
                : tr(
                    `${name(item)} — locked, needs ${item.remaining} more points`,
                    `${name(item)} — مغلق، يحتاج ${item.remaining} نقطة أخرى`
                  )
            }
          >
            <span className="rewards-option-preview">{renderPreview(item)}</span>
            <span className="rewards-option-name">{name(item)}</span>

            {item.unlocked ? (
              item.active && (
                <span className="rewards-option-badge">
                  {tr('In use', 'مستخدم')}
                </span>
              )
            ) : (
              <span className="rewards-option-cost">
                <Lock size={12} aria-hidden="true" />
                {tr(`${item.remaining} to go`, `${item.remaining} متبقية`)}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <motion.div
      className="rewards-store-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rewards-store-title"
    >
      <motion.div
        className="rewards-store"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="rewards-store-header">
          <div>
            <h2 className="rewards-store-title" id="rewards-store-title">
              <span aria-hidden="true">🎁</span> {tr('Rewards', 'المكافآت')}
            </h2>
            <p className="rewards-store-subtitle">
              {tr(
                'Spend nothing — just keep earning. Rewards unlock as your points grow, and stay yours.',
                'لا تدفع شيئاً — فقط واصل الكسب. تُفتح المكافآت مع نمو نقاطك وتبقى لك.'
              )}
            </p>
          </div>
          <button
            type="button"
            className="rewards-store-close"
            onClick={onClose}
            aria-label={tr('Close rewards', 'إغلاق المكافآت')}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {/* No `role="status"` on this banner: the points total is the
            headline of this screen, not a live announcement. */}
        <div className="rewards-total">
          <span className="rewards-total-value">{overview.totalPoints}</span>
          <span className="rewards-total-label">
            {tr('points earned so far', 'نقطة مكتسبة حتى الآن')}
          </span>
        </div>

        <div className="rewards-store-body">
          {renderGroup({
            key: 'accent',
            icon: '🎨',
            title: tr('App colour', 'لون التطبيق'),
            blurb: tr(
              'Recolours every button, link and progress bar in the app.',
              'يعيد تلوين كل زر ورابط وشريط تقدم في التطبيق.'
            ),
            items: overview.accent,
            renderPreview: (item) => (
              <span
                className="rewards-swatch"
                style={{ background: item.swatch }}
                aria-hidden="true"
              />
            )
          })}

          {renderGroup({
            key: 'background',
            icon: '✨',
            title: tr('Background', 'الخلفية'),
            blurb: tr(
              'A gentle layer behind the page. Turned off automatically if you use reduced motion or high contrast.',
              'طبقة لطيفة خلف الصفحة. تُوقف تلقائياً مع الحركة المخففة أو التباين العالي.'
            ),
            items: overview.background,
            renderPreview: (item) => (
              <span className="rewards-emoji" aria-hidden="true">{item.icon}</span>
            )
          })}

          {renderGroup({
            key: 'celebration',
            icon: '🎉',
            title: tr('Celebration style', 'نمط الاحتفال'),
            blurb: tr(
              'How big the "Great job!" moment is. Calm is the default on purpose.',
              'حجم لحظة "عمل رائع!". الهادئ هو الافتراضي بشكل مقصود.'
            ),
            items: overview.celebration,
            renderPreview: (item) => (
              <span className="rewards-emoji" aria-hidden="true">{item.icon}</span>
            )
          })}

          {renderGroup({
            key: 'avatarFrame',
            icon: '🖼️',
            title: tr('Avatar frame', 'إطار الصورة'),
            blurb: tr(
              'A ring around your picture in the top bar.',
              'حلقة حول صورتك في الشريط العلوي.'
            ),
            items: overview.avatarFrame,
            renderPreview: (item) => (
              <span
                className="rewards-frame"
                style={{ background: item.ring === 'transparent' ? 'var(--mz-surface-3)' : item.ring }}
                aria-hidden="true"
              />
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RewardsStore;
