import { useMemo, useState } from 'react';
import { CaptureImage } from '../../components/CaptureImage';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import {
  useAddCommunityComment,
  useCommunityComments,
  useCommunityPosts,
  useFriends,
  useToggleCommunityLike,
  useReportCommunityPost
} from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';
import { CommunityShareSheet } from './CommunityShareSheet';

const TABS = [
  { id: 'FRIENDS', label: 'Chats', icon: 'user' },
  { id: 'FEED', label: 'Realm', icon: 'star' },
  { id: 'MAP', label: 'Places', icon: 'compass' },
];

function timeAgo(value) {
  const elapsed = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsed)) return '';
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(value).toLocaleDateString();
}

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function GuildPage() {
  const [tab, setTab] = useState('FRIENDS');
  const [shareOpen, setShareOpen] = useState(false);
  const [notice, setNotice] = useState('');

  return (
    <main className="guild-page page-stack">
      <h1 className="sr-only">Community</h1>

      <div className="community-tabs-bar" role="tablist" aria-label="Community sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`community-tab-${item.id}`}
            aria-controls={`community-panel-${item.id}`}
            aria-selected={tab === item.id}
            className={`community-tab-btn ${tab === item.id ? 'active' : ''}`}
            onClick={() => { playTap(); setTab(item.id); }}
          >
            <Icon name={item.icon} />
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`community-panel-${tab}`} aria-labelledby={`community-tab-${tab}`}>
        {tab === 'FEED' && <CommunityFeed onShare={() => setShareOpen(true)} />}
        {tab === 'FRIENDS' && <FriendsPanel />}
        {tab === 'MAP' && <CommunityMap />}
      </div>

      {tab === 'FEED' && (
        <motion.button
          type="button"
          className="community-fab-btn"
          aria-label="Share a discovery"
          whileTap={{ scale: 0.9 }}
          onClick={() => { playTap(); setShareOpen(true); }}
        >
          +
        </motion.button>
      )}

      <AnimatePresence>
        {shareOpen && (
          <CommunityShareSheet
            onClose={() => setShareOpen(false)}
            onShared={() => setNotice('Your discovery is live in the community feed.')}
          />
        )}
      </AnimatePresence>

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
    </main>
  );
}

function CommunityFeed({ onShare }) {
  const { data: posts, isLoading, isError, refetch } = useCommunityPosts('public');
  const toggleLike = useToggleCommunityLike();
  const reportPost = useReportCommunityPost();
  const [openComments, setOpenComments] = useState(null);

  if (isLoading) {
    return (
      <div className="community-feed-stream" aria-busy="true">
        {[0, 1].map((index) => <div key={index} className="community-post-skeleton" />)}
        <p className="sr-only" role="status">Loading the community feed…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="community-state-panel" role="alert">
        <Icon name="shield" />
        <p>We couldn’t reach the community service.</p>
        <button type="button" className="continue-journey-btn" onClick={() => { playTap(); refetch(); }}>
          Try again
        </button>
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <div className="community-empty-loop">
        <div className="community-empty-copy">
          <Icon name="compass" />
          <span className="sr-only">No discoveries shared yet.</span>
          <p className="community-state-title">Start today’s discovery loop.</p>
          <p>Capture something nearby, save it to Library, then share the card when it earns a rank.</p>
          <button type="button" className="continue-journey-btn" onClick={() => { playTap(); onShare(); }}>
            Share from Library <span>→</span>
          </button>
        </div>
        <div className="retention-loop-rail" aria-label="Discovery loop">
          <span><strong>1</strong> Snap</span>
          <span><strong>2</strong> Rank</span>
          <span><strong>3</strong> Save</span>
          <span><strong>4</strong> Share</span>
        </div>
      </div>
    );
  }

  return (
    <div className="community-feed-stream">
      {posts.map((post) => (
        <article key={post.id} className="community-post-card">
          <div className="post-header-row">
            <div className="post-author-block">
              <span className="post-author-avatar" aria-hidden="true">{initials(post.author.displayName)}</span>
              <div>
                <h4>{post.author.displayName}</h4>
                <small>{timeAgo(post.createdAt)}</small>
              </div>
            </div>
            <span className="post-rank-badge">{post.author.rankTitle}</span>
          </div>

          {post.discovery && (
            <div className={`post-photo-wrap rank-${post.discovery.rarityStars || 1}`}>
              {post.discovery.imageRef ? (
                <CaptureImage
                  imageRef={post.discovery.imageRef}
                  alt={post.discovery.itemName}
                  element={post.discovery.element}
                  className="post-photo-image"
                  useAuth={post.discovery.imageRef?.includes('/captures/')}
                />
              ) : (
                <div className="post-photo-placeholder">
                  <span className={`post-rarity-crest rank-hex-${post.discovery.rarityStars || 1}`}>
                    {post.discovery.rarityStars || 1}★
                  </span>
                  {post.discovery.rarityStars != null && (
                    <span className="post-rarity-stars" aria-label={`${post.discovery.rarityStars} of 5 rarity stars`}>
                      {'★'.repeat(post.discovery.rarityStars)}<i>{'★'.repeat(Math.max(0, 5 - post.discovery.rarityStars))}</i>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="post-info-block">
            <h3>{post.discovery?.cardTitle || post.discovery?.itemName || 'Discovery'}</h3>
            {post.placeLabel && <p className="post-location">{post.placeLabel}</p>}
            {post.caption && <p className="post-caption">{post.caption}</p>}
            {post.hashtags?.length > 0 && (
              <span className="post-hashtags">{post.hashtags.join(' ')}</span>
            )}

            <div className="post-engagement-row">
              <div className="post-engagement-actions">
                <button
                  type="button"
                  className={`post-action ${post.viewerLiked ? 'active' : ''}`}
                  aria-pressed={post.viewerLiked}
                  aria-label={post.viewerLiked ? 'Remove like' : 'Like this discovery'}
                  disabled={toggleLike.isPending}
                  onClick={() => { playTap(); toggleLike.mutate({ postId: post.id, liked: !post.viewerLiked }); }}
                >
                  <Icon name="star" /> {post.likeCount}
                </button>
                <button
                  type="button"
                  className="post-action"
                  aria-expanded={openComments === post.id}
                  onClick={() => { playTap(); setOpenComments(openComments === post.id ? null : post.id); }}
                >
                  <Icon name="scroll" /> {post.commentCount}
                </button>
                <button
                  type="button"
                  className="post-action"
                  aria-label="Report post"
                  disabled={reportPost.isPending}
                  onClick={() => {
                    if (window.confirm('Report this post?')) {
                      playTap();
                      reportPost.mutate({ postId: post.id, reason: 'inappropriate' });
                      alert('Thank you, this post has been reported.');
                    }
                  }}
                >
                  <Icon name="shield" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {openComments === post.id && <CommentThread postId={post.id} />}
            </AnimatePresence>
          </div>
        </article>
      ))}
    </div>
  );
}

function CommentThread({ postId }) {
  const { data: comments, isLoading, isError } = useCommunityComments(postId);
  const addComment = useAddCommunityComment();
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || addComment.isPending) return;
    setErrorMessage('');
    try {
      await addComment.mutateAsync({ postId, body });
      setDraft('');
    } catch (error) {
      setErrorMessage(error?.code === 'guest_write_unavailable'
        ? 'Sign in to join the conversation.'
        : 'Your comment could not be posted.');
    }
  };

  return (
    <motion.div
      className="post-comment-thread"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      {isLoading && <p className="community-state-note" role="status">Loading comments…</p>}
      {isError && <p className="community-state-note error" role="alert">Comments could not be loaded.</p>}
      {!isLoading && !isError && comments?.length === 0 && (
        <p className="community-state-note">No comments yet.</p>
      )}
      {comments?.map((comment) => (
        <div key={comment.id} className="post-comment">
          <strong>{comment.displayName}</strong>
          <p>{comment.body}</p>
        </div>
      ))}

      <form className="post-comment-form" onSubmit={submit}>
        <label className="sr-only" htmlFor={`comment-${postId}`}>Add a comment</label>
        <input
          id={`comment-${postId}`}
          type="text"
          value={draft}
          maxLength={1000}
          placeholder="Add a comment…"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" disabled={!draft.trim() || addComment.isPending}>
          {addComment.isPending ? '…' : 'Post'}
        </button>
      </form>
      {errorMessage && <p className="community-state-note error" role="alert">{errorMessage}</p>}
    </motion.div>
  );
}

function FriendsPanel() {
  const { data: friends, isLoading, isError, refetch } = useFriends();

  if (isLoading) {
    return <div className="community-state-panel" aria-busy="true"><p role="status">Loading explorers…</p></div>;
  }

  if (isError) {
    return (
      <div className="community-state-panel" role="alert">
        <Icon name="shield" />
        <p>We couldn’t load your explorer network.</p>
        <button type="button" className="continue-journey-btn" onClick={() => { playTap(); refetch(); }}>Try again</button>
      </div>
    );
  }

  if (!friends?.length) {
    return (
      <div className="community-state-panel community-chat-empty">
        <Icon name="user" />
        <p className="community-state-title">Start a trail chat.</p>
        <p>Friends, streak partners, and shared quest plans will live here.</p>
        <div className="retention-loop-rail" aria-label="Chat loop">
          <span><strong>1</strong> Add</span>
          <span><strong>2</strong> Plan</span>
          <span><strong>3</strong> Snap</span>
        </div>
      </div>
    );
  }

  return (
    <div className="community-chats-screen">
      <section className="community-chats-hero" aria-label="Trail chats">
        <div>
          <span className="community-chats-kicker">Trail chats</span>
          <h2>Plan the next snap.</h2>
          <p>Message friends, build streak plans, then jump back into Camera.</p>
        </div>
        <button
          type="button"
          className="community-hero-camera"
          aria-label="Open Camera Capture"
          onClick={() => {
            playTap();
            window.dispatchEvent(new CustomEvent('wild-realm-open-capture'));
          }}
        >
          <Icon name="camera" />
        </button>
      </section>

      <div className="community-story-rail" aria-label="Friends">
        {friends.map((friend) => (
          <button key={friend.userId} type="button" className="community-story-chip" onClick={playTap}>
            <span className="post-author-avatar" aria-hidden="true">{initials(friend.displayName)}</span>
            <span>{friend.displayName.split(/\s+/)[0]}</span>
          </button>
        ))}
      </div>

      <div className="community-friend-list">
      {friends.map((friend) => (
        <article key={friend.userId} className="community-friend-card">
          <span className="post-author-avatar" aria-hidden="true">{initials(friend.displayName)}</span>
          <div className="community-friend-meta">
            <h3>{friend.displayName}</h3>
            <small>{friend.streakDays}-day streak</small>
            <p>{friend.totalXp.toLocaleString()} XP. Ready for a camera quest together.</p>
          </div>
          <button type="button" className="community-chat-action" aria-label={`Message ${friend.displayName}`} onClick={playTap}>
            <Icon name="scroll" />
          </button>
          {friend.status === 'pending' && (
            <span className="post-rank-badge">{friend.direction === 'outgoing' ? 'Requested' : 'Pending'}</span>
          )}
        </article>
      ))}
      </div>
    </div>
  );
}

function CommunityMap() {
  const { data: posts, isLoading, isError } = useCommunityPosts('public');
  const located = useMemo(() => (posts || []).filter((post) => post.gps), [posts]);

  if (isLoading) {
    return <div className="community-state-panel" aria-busy="true"><p role="status">Loading discovery locations…</p></div>;
  }

  if (isError) {
    return (
      <div className="community-state-panel" role="alert">
        <Icon name="compass" />
        <p>Discovery locations could not be loaded.</p>
      </div>
    );
  }

  if (!located.length) {
    return (
      <div className="community-state-panel">
        <Icon name="compass" />
        <p className="community-state-title">No mapped discoveries yet.</p>
        <p>Shared discoveries that carry location data appear here.</p>
      </div>
    );
  }

  return (
    <div className="community-map-panel">
      <div className="community-map-canvas" role="img" aria-label={`${located.length} shared discoveries with locations`}>
        {located.map((post) => {
          // Normalised world coordinates — the community view plots relative
          // positions rather than embedding a tile provider.
          const left = ((post.gps.lng + 180) / 360) * 100;
          const top = ((90 - post.gps.lat) / 180) * 100;
          return (
            <span
              key={post.id}
              className={`community-map-marker rank-hex-${post.discovery?.rarityStars || 1}`}
              style={{ left: `${left}%`, top: `${top}%` }}
              title={`${post.discovery?.itemName || 'Discovery'} — ${post.placeLabel || 'Unnamed location'}`}
            />
          );
        })}
      </div>
      <ul className="community-map-legend">
        {located.map((post) => (
          <li key={post.id}>
            <strong>{post.discovery?.itemName || 'Discovery'}</strong>
            <span>{post.placeLabel || `${post.gps.lat.toFixed(2)}°, ${post.gps.lng.toFixed(2)}°`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
