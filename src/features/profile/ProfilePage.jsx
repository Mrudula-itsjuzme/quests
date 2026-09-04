import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMe, useCaptures } from '../quests/queries';
import { coinBalance } from '../../lib/playerEconomy';
import { playTap } from '../../lib/useSoundEffects';
import { SettingsModal } from '../../components/SettingsModal';

// Use 1-5 numeric ranks instead of legacy grades
const RANK_COLORS = {
  5: { bg: 'rgba(240,196,107,0.15)', border: 'rgba(240,196,107,0.5)', text: '#f0c46b', label: 'Legendary' },
  4: { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.5)', text: '#a78bfa', label: 'Epic' },
  3: { bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.5)',  text: '#60a5fa', label: 'Rare' },
  2: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.4)',  text: '#34d399', label: 'Uncommon' },
  1: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: 'rgba(233,241,236,0.55)', label: 'Common' },
};

function RankBadge({ stars }) {
  const cfg = RANK_COLORS[stars] || RANK_COLORS[1];
  return (
    <span className="profile-rank-badge" style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}>
      {stars > 0 && <span aria-label={`${stars} stars`}>{stars} {'★'.repeat(stars)}</span>}
    </span>
  );
}

const MENU_ITEMS = [
  { id: 'rewards', label: 'Rewards & Store', icon: 'chest', to: '/app/rewards', emoji: '🎁' },
  { id: 'collection', label: 'My Library', icon: 'book', to: '/app/collection', emoji: '📚' },
  { id: 'community', label: 'Community', icon: 'shield', to: '/app/community', emoji: '🤝' },
  { id: 'settings', label: 'Settings', icon: 'gear', emoji: '⚙️' },
  { id: 'help', label: 'Help & Support', icon: 'feather', emoji: '💬' },
];

export function ProfilePage() {
  const { data: me } = useMe();
  const { data: captures } = useCaptures();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const discoveries = (captures || []).filter((c) => c.status !== 'rejected');
  const totalCount = discoveries.length;
  const totalXp = me?.totalXp || 0;
  const totalCoins = coinBalance(me);
  const currentStreak = me?.streakDays || 0;
  const level = me?.level || 1;
  const progress = me?.progressToNextLevel || 0;

  const unavailable = (msg) => { playTap(); setNotice(msg); };

  const handleMenuItem = (item) => {
    playTap();
    if (item.id === 'settings') setSettingsOpen(true);
    else if (item.id === 'help') unavailable('Help & support coming soon.');
  };

  // Rank breakdown from captures
  const rankBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: discoveries.filter((c) => (c.rarityStars || 1) === stars).length,
  }));

  return (
    <main className="profile-shell-v2">
      <h1 className="sr-only">Profile</h1>

      {/* ── Hero banner ── */}
      <motion.div
        className="profile-hero-v2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        {/* Avatar */}
        <div className="profile-avatar-v2" aria-hidden="true">
          {(me?.displayName || 'A').charAt(0).toUpperCase()}
        </div>

        <div className="profile-identity-v2">
          <h2>{me?.displayName || 'Adventurer'}</h2>
          {me && (
            <div className="profile-tier-row">
              <span className="profile-tier-label">{me.tierLabel || `${me.tier} Explorer`}</span>
              <span className="profile-level-pill">Lv. {level}</span>
            </div>
          )}
          {/* XP bar */}
          {me && (
            <div className="profile-xp-wrap">
              <div className="profile-xp-track">
                <motion.div
                  className="profile-xp-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((progress || 0) * 100)}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                />
              </div>
              <span className="profile-xp-label">{me.xpIntoLevel} / {me.xpForCurrentLevel} XP</span>
            </div>
          )}
        </div>

        <div className="profile-streak-badge" title={`${currentStreak}-day streak`}>
          🔥 {currentStreak}
        </div>
      </motion.div>

      {/* ── Stat grid ── */}
      <motion.div
        className="profile-stat-grid-v2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 300, damping: 26 }}
      >
        <div className="profile-stat-v2">
          <strong>{totalCount}</strong>
          <small>Discoveries</small>
        </div>
        <div className="profile-stat-v2 gold">
          <strong>{totalXp.toLocaleString()}</strong>
          <small>Total XP</small>
        </div>
        <div className="profile-stat-v2">
          <strong>{totalCoins.toLocaleString()}</strong>
          <small>Coins</small>
        </div>
      </motion.div>

      {/* ── Rank breakdown ── */}
      {totalCount > 0 && (
        <motion.div
          className="profile-rank-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.16 }}
        >
          <p className="profile-section-eyebrow">Rarity Breakdown</p>
          <div className="profile-rank-row">
            {rankBreakdown.map(({ stars, count }) => (
              count > 0 ? (
                <div key={stars} className="profile-rank-cell">
                  <RankBadge stars={stars} />
                  <span className="profile-rank-count">×{count}</span>
                </div>
              ) : null
            ))}
            {rankBreakdown.every(({ count }) => count === 0) && (
              <p className="profile-rank-empty">Capture nature to earn rank badges</p>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Menu list ── */}
      <motion.div
        className="profile-menu-v2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22 }}
      >
        {MENU_ITEMS.map((item) =>
          item.to ? (
            <Link key={item.id} to={item.to} className="profile-menu-row-v2" onClick={playTap}>
              <span className="profile-menu-emoji">{item.emoji}</span>
              <span className="profile-menu-row-label">{item.label}</span>
              <span className="profile-menu-chevron">›</span>
            </Link>
          ) : (
            <button
              key={item.id}
              type="button"
              className="profile-menu-row-v2"
              onClick={() => handleMenuItem(item)}
            >
              <span className="profile-menu-emoji">{item.emoji}</span>
              <span className="profile-menu-row-label">{item.label}</span>
              <span className="profile-menu-chevron">›</span>
            </button>
          )
        )}
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {notice && (
          <motion.div
            className="toast-notice"
            role="status"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            <span>{notice}</span>
            <button type="button" onClick={() => { playTap(); setNotice(''); }} aria-label="Dismiss">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </main>
  );
}
