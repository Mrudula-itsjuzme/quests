import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMe, useCollectibles } from '../quests/queries';
import { deriveGold } from '../../lib/playerEconomy';
import { playTap } from '../../lib/useSoundEffects';
import { SettingsModal } from '../../components/SettingsModal';

export function ProfilePage() {
  const { data: me } = useMe();
  const { data: collection } = useCollectibles();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const totalCount = collection ? collection.length : 0;
  const sRankCount = collection ? collection.filter((c) => c.rarityTier === 'S' || c.rarity === 'S').length : 0;
  const totalXp = me?.totalXp || 0;
  const totalCoins = deriveGold(totalXp);
  const currentStreak = me?.streakDays || 0;

  const unavailable = (message) => { playTap(); setNotice(message); };

  const MENU_ITEMS = [
    { id: 'achievements', label: 'Achievements', icon: '🏆', to: '/app/rewards' },
    { id: 'collection', label: 'Collection', icon: '📖', to: '/app/collection' },
    { id: 'settings', label: 'Settings', icon: '⚙️', action: () => setSettingsOpen(true) },
    { id: 'help', label: 'Help & Support', icon: '❓', action: () => unavailable('Help & support is not connected yet.') },
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
        <div className="profile-avatar-ring">
          <img
            className="profile-avatar-img"
            src="/assets/african-grey-parrot.png"
            alt="Explorer Avatar"
          />
          <span className="profile-avatar-edit">✏️</span>
        </div>
        <div className="profile-identity-info">
          <h2>{me?.displayName || 'Adventurer'}</h2>
          {me && (
            <>
              <div className="profile-identity-title">🏆 {me.tier} {me.level}</div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>❯</span>
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

      {/* Coins & Chests */}
      <div className="profile-store-card">
        <h4 style={{ color: 'var(--wild-text-dim)', fontSize: '0.78rem', letterSpacing: '0.05em' }}>
          COINS & STREAK
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff' }}>🪙 {totalCoins.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <small style={{ color: 'var(--wild-text-dim)', fontSize: '0.68rem', display: 'block' }}>CURRENT STREAK</small>
            <strong style={{ fontSize: '0.88rem', color: '#fff' }}>{currentStreak} day{currentStreak === 1 ? '' : 's'}</strong>
          </div>
          <span style={{ fontSize: '1.6rem' }}>🔥</span>
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


