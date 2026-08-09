import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { playHover, playTap } from '../../lib/useSoundEffects';

const SAMPLE_POSTS = [
  {
    id: 'p1',
    authorName: 'Ananya_Explorer',
    timeAgo: '2h ago',
    avatarUrl: '/assets/african-grey-parrot.png',
    rankBadge: 'S RANK',
    title: 'Blue-billed Cuckoo',
    location: '📍 Silent Valley National Park',
    hashtags: '#WildRealm #Birding #RareFind',
    imageUrl: '/assets/blue-billed-cuckoo.png',
    likes: 232,
    comments: 18,
  },
  {
    id: 'p2',
    authorName: 'Rohit_Explorer',
    timeAgo: '5h ago',
    avatarUrl: '/assets/african-grey-parrot.png',
    rankBadge: 'A RANK',
    title: 'Athirappilly Waterfalls',
    location: '📍 Athirappilly, Kerala',
    hashtags: '#WildRealm #Landscape #Waterfalls',
    imageUrl: '/assets/water-fall.png',
    likes: 184,
    comments: 9,
  },
];

export function GuildPage() {
  const [tab, setTab] = useState('FEED');

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
        {SAMPLE_POSTS.map((post) => (
          <div key={post.id} className="community-post-card">
            {/* Post Header */}
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

            {/* Post Photo */}
            <div className="post-photo-wrap">
              <img className="post-photo-img" src={post.imageUrl} alt={post.title} />
            </div>

            {/* Post Info */}
            <div className="post-info-block">
              <h3 style={{ margin: '6px 0 2px', fontSize: '1rem', color: '#fff' }}>{post.title}</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--wild-emerald)' }}>{post.location}</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--wild-text-dim)', display: 'block', marginTop: '4px' }}>
                {post.hashtags}
              </span>

              {/* Engagement Stats */}
              <div className="post-engagement-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                </div>
                <span>📤</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <button type="button" className="community-fab-btn" aria-label="Create Post">
        +
      </button>
    </main>
  );
}

