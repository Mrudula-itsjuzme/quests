import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { useMe, useCollectibles } from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';
import { SettingsModal } from '../../components/SettingsModal';

export function ProfilePage() {
  const { data: me } = useMe();
  const { data: collectibles } = useCollectibles();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState('');

  const totalXp = me?.totalXp || 48750;
  const level = me?.level || 28;
  const totalCards = (collectibles?.length || 0) + 152;

  const MENU_ITEMS = [
    { id: 'profile', label: 'My Profile', icon: 'user' },
    { id: 'achievements', label: 'Achievements (38)', icon: 'star' },
    { id: 'friends', label: 'Friends (23)', icon: 'shield' },
    { id: 'saved', label: 'Saved Locations (14)', icon: 'compass' },
    { id: 'settings', label: 'Settings & Account', icon: 'gear', action: () => setSettingsOpen(true) },
    { id: 'help', label: 'Help & Support', icon: 'scroll' },
    { id: 'about', label: 'About Wild Realm', icon: 'leaf' },
  ];

  return (
    <main className="profile-shell">
      {/* Top Explorer Card */}
      <div className="profile-hero-card">
        <div className="profile-avatar-ring">
          <img
            className="profile-avatar-img"
            src="/assets/african-grey-parrot.png"
            alt="Explorer Avatar"
          />
        </div>
        <div className="profile-identity-info">
          <h2>{me?.displayName || 'Explorer One'} ✏️</h2>
          <div className="profile-identity-title">Gold Explorer II • Level {level}</div>
          <div className="profile-xp-bar-wrap">
            <div className="profile-xp-bar-fill" style={{ width: '68%' }} />
          </div>
        </div>
      </div>

      {/* 4-Block Stat Summary Grid */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <small>Discoveries</small>
          <strong>{totalCards}</strong>
        </div>
        <div className="profile-stat-card">
          <small>S Rank</small>
          <strong>12</strong>
        </div>
        <div className="profile-stat-card">
          <small>XP Earned</small>
          <strong>{totalXp.toLocaleString()}</strong>
        </div>
        <div className="profile-stat-card">
          <small>Badges</small>
          <strong>38</strong>
        </div>
      </div>

      {/* Menu List with Chevrons */}
      <div className="profile-menu-list">
        {MENU_ITEMS.map((item) => (
          <div
            key={item.id}
            className="profile-menu-item"
            onClick={() => {
              playTap();
              if (item.action) {
                item.action();
              } else {
                setActiveNotice(`${item.label} opened.`);
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </div>
            <Icon name="compass" />
          </div>
        ))}
      </div>

      {/* Coins & Store Cards */}
      <div className="profile-store-grid">
        <div className="profile-store-card">
          <h4>💰 3,425 COINS</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--wild-text-dim)', margin: '4px 0' }}>
            Earn coins by completing daily wildlife quests.
          </p>
          <button
            type="button"
            className="quest-claim-btn"
            style={{ width: '100%', marginTop: '6px' }}
            onClick={() => {
              playTap();
              setActiveNotice('Store chest claimed!');
            }}
          >
            Claim Daily Bonus
          </button>
        </div>

        <div className="profile-store-card">
          <h4>🎁 MYSTERY CHESTS</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--wild-text-dim)', margin: '4px 0' }}>
            Next S-Rank chest in 3 discovery days.
          </p>
          <button
            type="button"
            className="discovery-btn-glass"
            style={{ width: '100%', marginTop: '6px' }}
            onClick={() => {
              playTap();
              setActiveNotice('Chest progress: 7/10 days');
            }}
          >
            View Rewards
          </button>
        </div>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </main>
  );
}

