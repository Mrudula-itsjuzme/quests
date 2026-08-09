import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { playHover, playTap } from '../../lib/useSoundEffects';


export function GuildPage() {
  const [tab, setTab] = useState('FEED');
  const [posts] = useState([]); // Real backend query would go here

  return (
    <main className="guild-page page-stack">
      {/* Top Tabs Bar: FEED, FRIENDS, MAP */}
      <div className="community-tabs-bar">
        <button
          type="button"
          className={`community-tab-btn ${tab === 'FEED' ? 'active' : ''}`}
          onClick={() => { playTap(); setTab('FEED'); }}
        >
          FEED
        </button>
        <button
          type="button"
          className={`community-tab-btn ${tab === 'FRIENDS' ? 'active' : ''}`}
          onClick={() => { playTap(); setTab('FRIENDS'); }}
        >
          FRIENDS
        </button>
        <button
          type="button"
          className={`community-tab-btn ${tab === 'MAP' ? 'active' : ''}`}
          onClick={() => { playTap(); setTab('MAP'); }}
        >
          MAP
        </button>
      </div>

      {/* Community Feed Stream */}
      <div className="community-feed-stream">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="community-post-card">
              <div className="post-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img className="post-author-avatar" src={post.avatarUrl} alt={post.authorName} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#fff' }}>{post.authorName}</h4>
                    <small style={{ color: 'var(--wild-text-dim)', fontSize: '0.72rem' }}>{post.timeAgo}</small>
                  </div>
                </div>
                <span className="post-rank-badge">{post.rankBadge}</span>
              </div>
              <div className="post-photo-wrap">
                <img className="post-photo-img" src={post.imageUrl} alt={post.title} />
              </div>
              <div className="post-info-block">
                <h3 style={{ margin: '6px 0 2px', fontSize: '1rem', color: '#fff' }}>{post.title}</h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--wild-emerald)' }}>{post.location}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--wild-text-dim)', display: 'block', marginTop: '4px' }}>
                  {post.hashtags}
                </span>
                <div className="post-engagement-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                  <span>📤</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--wild-text-dim)' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px', opacity: 0.5 }}>🌍</span>
            <p>No recent activity in your region.</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '8px' }}>Share a discovery to start the feed!</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button
        type="button"
        className="community-fab-btn"
        aria-label="Create Post"
        whileTap={{ scale: 0.9 }}
      >
        +
      </motion.button>
    </main>
  );
}

