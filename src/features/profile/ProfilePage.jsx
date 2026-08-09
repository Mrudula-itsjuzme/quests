import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { useMe, useCollectibles } from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';
import { SettingsModal } from '../../components/SettingsModal';

export function ProfilePage() {
  const { data: me } = useMe();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState('');

  const MENU_ITEMS = [
    { id: 'profile', label: 'My Profile', icon: '👤', badge: null },
    { id: 'achievements', label: 'Achievements', icon: '🏆', badge: null },
    { id: 'friends', label: 'Friends', icon: '👥', badge: '23' },
    { id: 'saved', label: 'Saved Locations', icon: '📍', badge: null },
    { id: 'settings', label: 'Settings', icon: '⚙️', action: () => setSettingsOpen(true) },
    { id: 'help', label: 'Help & Support', icon: '❓', badge: null },
    { id: 'about', label: 'About Wild Realm', icon: 'ℹ️', badge: null },
  ];

  return (
    <main className="profile-shell">
      {/* Top Explorer Hero Card */}
      <div className="profile-hero-card">
        <div className="profile-avatar-ring">
          <img
            className="profile-avatar-img"
            src="/assets/african-grey-parrot.png"
            alt="Explorer Avatar"
          />
          <span className="profile-avatar-edit">✏️</span>
        </div>
        <div className="profile-identity-info">
          <h2>{me?.displayName || 'Explorer One'} ✏️</h2>
          <div className="profile-identity-title">🏆 Gold Explorer II</div>
          <div className="profile-xp-row">
            <span>Level 28</span>
            <span>12,450 / 18,000 XP</span>
          </div>
          <div className="profile-xp-bar-wrap">
            <div className="profile-xp-bar-fill" style={{ width: '69%' }} />
          </div>
        </div>
      </div>

      {/* 4-Block Stat Summary Grid */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <small>Discoveries</small>
          <strong>152</strong>
        </div>
        <div className="profile-stat-card">
          <small>S Rank</small>
          <strong>12</strong>
        </div>
        <div className="profile-stat-card">
          <small>XP Earned</small>
          <strong>48,750</strong>
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
                setActiveNotice(`${item.label} selected.`);
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {item.badge && (
                <span className="profile-menu-badge">{item.badge}</span>
              )}
              <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>❯</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom 2 Cards Grid: Coins & Chests vs Store */}
      <div className="profile-store-grid">
        {/* Left Card: COINS & CHESTS */}
        <div className="profile-store-card">
          <h4 style={{ color: 'var(--wild-text-dim)', fontSize: '0.78rem', letterSpacing: '0.05em' }}>
            COINS & CHESTS
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff' }}>🪙 3,425</span>
            <button type="button" className="circle-add-btn">+</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <small style={{ color: 'var(--wild-text-dim)', fontSize: '0.68rem', display: 'block' }}>NEXT CHEST IN</small>
              <strong style={{ fontSize: '0.88rem', color: '#fff' }}>7 / 10 days</strong>
            </div>
            <span style={{ fontSize: '1.6rem' }}>📦</span>
          </div>
        </div>

        {/* Right Card: STORE */}
        <div className="profile-store-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ color: 'var(--wild-text-dim)', fontSize: '0.78rem', letterSpacing: '0.05em' }}>STORE</h4>
            <span style={{ color: 'var(--wild-emerald)', fontSize: '0.75rem', fontWeight: '700' }}>View All</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
            <div className="store-chest-item">
              <span style={{ fontSize: '1.3rem' }}>🧰</span>
              <small>Explorer Chest</small>
              <strong>🪙 1,000</strong>
            </div>
            <div className="store-chest-item purple">
              <span style={{ fontSize: '1.3rem' }}>💎</span>
              <small>Elite Chest</small>
              <strong>🪙 3,000</strong>
            </div>
          </div>

          <div style={{ marginTop: '8px', padding: '6px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#fff' }}>🪙 Coin Pack</span>
            <strong style={{ fontSize: '0.8rem', color: 'var(--wild-gold)' }}>₹199.00</strong>
          </div>
        </div>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </main>
  );
}


