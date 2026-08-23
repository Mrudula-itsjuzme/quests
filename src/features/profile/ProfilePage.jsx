import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMe, useCaptures } from '../quests/queries';
import { coinBalance } from '../../lib/playerEconomy';
import { playTap } from '../../lib/useSoundEffects';
import { SettingsModal } from '../../components/SettingsModal';
import { Icon } from '../../components/Icon';

export function ProfilePage() {
  const { data: me } = useMe();
  const { data: captures } = useCaptures();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState('');

  // Discoveries are captures, not quest collectible unlocks — the Collection
  // page counts the same source, so the two screens agree.
  const discoveries = (captures || []).filter((card) => card.status !== 'rejected');
  const totalCount = discoveries.length;
  const sRankCount = discoveries.filter((card) => (card.rarityGrade || card.rarityTier) === 'S').length;
  const totalXp = me?.totalXp || 0;
  const totalCoins = coinBalance(me);
  const currentStreak = me?.streakDays || 0;

  const unavailable = (message) => { playTap(); setNotice(message); };

  const MENU_ITEMS = [
    { id: 'rewards', label: 'Rewards & Store', icon: 'chest', to: '/app/rewards' },
    { id: 'collection', label: 'Collection', icon: 'book', to: '/app/collection' },
    { id: 'community', label: 'Community', icon: 'shield', to: '/app/community' },
    { id: 'settings', label: 'Settings', icon: 'gear', action: () => setSettingsOpen(true) },
    { id: 'help', label: 'Help & Support', icon: 'feather', action: () => unavailable('Help & support is not connected yet.') },
  ];

  return (
    <main className="profile-shell">
      <h1 className="sr-only">Profile</h1>
      {/* Top Explorer Hero Card */}
      <motion.div
        className="profile-hero-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Avatar uploads aren't supported server-side, so the ring shows the
            player's initials rather than a stock bird standing in as them. */}
        <div className="profile-avatar-ring">
          <span className="profile-avatar-initials" aria-hidden="true">
            {(me?.displayName || 'Adventurer').split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('')}
          </span>
        </div>
        <div className="profile-identity-info">
          <h2>{me?.displayName || 'Adventurer'}</h2>
          {me && (
            <>
              <div className="profile-identity-title">{me.tierLabel || `${me.tier} Explorer`}</div>
              <div className="profile-xp-row">
                <span>Level {me.level}</span>
                <span>{me.xpIntoLevel} / {me.xpForCurrentLevel} XP</span>
              </div>
              <div className="profile-xp-bar-wrap">
                <motion.div
                  className="profile-xp-bar-fill"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min(100, Math.round((me.progressToNextLevel || 0) * 100))}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                />
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* 3-Block Stat Summary Grid */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <small>Discoveries</small>
          <strong>{totalCount}</strong>
        </div>
        <div className="profile-stat-card">
          <small>S Rank</small>
          <strong>{sRankCount}</strong>
        </div>
        <div className="profile-stat-card">
          <small>XP Earned</small>
          <strong>{totalXp.toLocaleString()}</strong>
        </div>
      </div>

      {/* Menu List with Chevrons */}
      <div className="profile-menu-list">
        {MENU_ITEMS.map((item) => {
          const content = (
            <>
              <span className="profile-menu-label">
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </span>
              <span className="profile-menu-chevron" aria-hidden="true">›</span>
            </>
          );
          return item.to ? (
            <Link key={item.id} to={item.to} className="profile-menu-item" onClick={playTap}>
              {content}
            </Link>
          ) : (
            <div
              key={item.id}
              className="profile-menu-item"
              role="button"
              tabIndex={0}
              onClick={item.action}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') item.action(); }}
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* Coins & streak — both server-authoritative values. */}
      <div className="profile-store-card">
        <h4>Coins &amp; Streak</h4>
        <div className="profile-coin-row">
          <Icon name="coin" />
          <strong>{totalCoins.toLocaleString()}</strong>
        </div>
        <div className="profile-streak-row">
          <div>
            <small>Current streak</small>
            <strong>{currentStreak} day{currentStreak === 1 ? '' : 's'}</strong>
          </div>
          <Icon name="flame" />
        </div>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.div
            className="toast-notice"
            role="status"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          >
            <span>{notice}</span>
            <button type="button" onClick={() => { playTap(); setNotice(''); }} aria-label="Dismiss notification">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </main>
  );
}


