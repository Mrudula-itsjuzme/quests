import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CaptureImage } from '../../components/CaptureImage';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import {
  useAddCommunityComment,
  useCommunityComments,
  useCommunityPosts,
  useCommunityProfile,
  useCommunityStories,
  useFriends,
  useMarkCommunityStoryViewed,
  useSetCommunityFollow,
  useToggleCommunityLike,
  useReportCommunityPost,
} from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';
import { CommunityShareSheet } from './CommunityShareSheet';

const TABS = [
  { id: 'FEED', label: 'Feed', icon: 'star' },
  { id: 'FRIENDS', label: 'Chats', icon: 'user' },
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
  const [tab, setTab] = useState('FEED');
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
            onShared={() => {
              setNotice('Your discovery is live in the community feed.');
              setTimeout(() => setNotice(''), 4000);
            }}
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
  const [reportTarget, setReportTarget] = useState(null);
  const [reportedPostIds, setReportedPostIds] = useState([]);
  const [profileUserId, setProfileUserId] = useState(null);

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
      <CommunityStories onOpenProfile={setProfileUserId} />

      {posts.map((post) => (
        <article key={post.id} className="community-post-card">
          <div className="post-header-row">
            <div className="post-author-block">
              <button
                type="button"
                className="post-author-avatar post-author-profile-btn"
                aria-label={`Open ${post.author.displayName}'s profile`}
                onClick={() => { playTap(); setProfileUserId(post.author.userId); }}
              >
                {initials(post.author.displayName)}
              </button>
              <button
                type="button"
                className="post-author-name-btn"
                onClick={() => { playTap(); setProfileUserId(post.author.userId); }}
              >
                <h4>{post.author.displayName}</h4>
                <small>{timeAgo(post.createdAt)}</small>
              </button>
            </div>
            <span className="post-rank-badge">{post.author.rankTitle}</span>
          </div>

          {post.discovery && (
            <div className={`post-photo-wrap rank-${post.discovery.rarityStars || 1}`}>
              <CaptureImage
                imageRef={post.discovery.imageRef}
                alt={post.discovery.itemName}
                element={post.discovery.element}
                className="post-photo-image"
                useAuth={post.discovery.imageRef?.includes('/captures/')}
              />
              {post.discovery.rarityStars != null && (
                <span className="post-photo-rating" aria-label={`${post.discovery.rarityStars} of 5 rarity stars`}>
                  {post.discovery.rarityStars}★
                </span>
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
                  <Icon name="star" />
                  <span>{post.viewerLiked ? 'Liked' : 'Like'}</span>
                  <strong>{post.likeCount}</strong>
                </button>
                <button
                  type="button"
                  className="post-action"
                  aria-expanded={openComments === post.id}
                  onClick={() => { playTap(); setOpenComments(openComments === post.id ? null : post.id); }}
                >
                  <Icon name="scroll" />
                  <span>Comment</span>
                  <strong>{post.commentCount}</strong>
                </button>
                <button
                  type="button"
                  className={`post-action post-report-action ${reportedPostIds.includes(post.id) ? 'reported' : ''}`}
                  aria-label={reportedPostIds.includes(post.id) ? 'Post reported' : 'Report post'}
                  disabled={reportPost.isPending || reportedPostIds.includes(post.id)}
                  onClick={() => {
                    playTap();
                    setReportTarget(post);
                  }}
                >
                  <Icon name="shield" />
                  <span>{reportedPostIds.includes(post.id) ? 'Reported' : 'Report'}</span>
                </button>
              </div>
            </div>

            {post.commentCount > 0 && openComments !== post.id && (
              <button
                type="button"
                className="post-view-comments"
                onClick={() => { playTap(); setOpenComments(post.id); }}
              >
                View {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
              </button>
            )}

            <AnimatePresence>
              {openComments === post.id && <CommentThread postId={post.id} post={post} />}
            </AnimatePresence>
          </div>
        </article>
      ))}

      <AnimatePresence>
        {profileUserId && (
          <CommunityProfileSheet userId={profileUserId} onClose={() => setProfileUserId(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reportTarget && (
          <ReportReasonSheet
            post={reportTarget}
            isSubmitting={reportPost.isPending}
            onClose={() => setReportTarget(null)}
            onSubmit={(reason) => {
              reportPost.mutate(
                { postId: reportTarget.id, reason },
                {
                  onSuccess: () => {
                    setReportedPostIds((ids) => (ids.includes(reportTarget.id) ? ids : [...ids, reportTarget.id]));
                    setReportTarget(null);
                  },
                },
              );
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CommunityStories({ onOpenProfile }) {
  const { data: stories, isLoading, isError } = useCommunityStories();
  const markViewed = useMarkCommunityStoryViewed();
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const visibleStories = (stories || []).slice(0, 12);

  if (isLoading) {
    return (
      <div className="community-stories-rail" aria-busy="true">
        {[0, 1, 2, 3].map((item) => <span key={item} className="community-story-skeleton" />)}
      </div>
    );
  }

  if (isError || visibleStories.length === 0) return null;

  return (
    <>
      <div className="community-stories-rail" aria-label="Recent community stories">
        {visibleStories.map((story, index) => (
          <button
            key={story.id}
            type="button"
            className={`community-story-card ${story.viewed ? 'viewed' : ''}`}
            onClick={() => {
              playTap();
              setActiveStoryIndex(index);
              markViewed.mutate(story.postId);
            }}
          >
            <span className="community-story-ring">
              <CaptureImage
                imageRef={story.discovery?.imageRef}
                alt={story.discovery?.itemName || story.author.displayName}
                element={story.discovery?.element}
                className="community-story-photo"
                useAuth={story.discovery?.imageRef?.includes('/captures/')}
              />
            </span>
            <span>{story.author.displayName.split(/\s+/)[0]}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {activeStoryIndex !== null && visibleStories[activeStoryIndex] && (
          <StoryViewerSheet
            stories={visibleStories}
            activeIndex={activeStoryIndex}
            onNavigate={(nextIndex) => {
              const nextStory = visibleStories[nextIndex];
              if (!nextStory) return;
              playTap();
              setActiveStoryIndex(nextIndex);
              markViewed.mutate(nextStory.postId);
            }}
            onClose={() => setActiveStoryIndex(null)}
            onOpenProfile={(userId) => {
              setActiveStoryIndex(null);
              onOpenProfile(userId);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function StoryViewerSheet({ stories, activeIndex, onNavigate, onClose, onOpenProfile }) {
  const story = stories[activeIndex];
  const pointerStart = useRef(null);
  const goPrevious = () => activeIndex > 0 && onNavigate(activeIndex - 1);
  const goNext = () => {
    if (activeIndex < stories.length - 1) onNavigate(activeIndex + 1);
    else onClose();
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') goPrevious();
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return createPortal(
    <motion.div
      className="community-story-backdrop"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        className="community-story-viewer"
        role="dialog"
        aria-modal="true"
        aria-label={`${story.author.displayName}'s story`}
        initial={{ y: 20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => { pointerStart.current = event.clientX; }}
        onPointerUp={(event) => {
          if (pointerStart.current === null) return;
          const distance = event.clientX - pointerStart.current;
          pointerStart.current = null;
          if (Math.abs(distance) < 48) return;
          if (distance < 0) goNext();
          else goPrevious();
        }}
      >
        <div
          className="community-story-progress"
          aria-label={`Story ${activeIndex + 1} of ${stories.length}`}
          style={{ '--story-count': stories.length }}
        >
          {stories.map((item, index) => (
            <span key={item.id} className={index <= activeIndex ? 'complete' : ''} />
          ))}
        </div>
        <div className="community-story-view-head">
          <button type="button" className="post-author-avatar" onClick={() => { playTap(); onOpenProfile(story.author.userId); }}>
            {initials(story.author.displayName)}
          </button>
          <div>
            <strong>{story.author.displayName}</strong>
            <span>{timeAgo(story.createdAt)}</span>
          </div>
          <button type="button" aria-label="Close story" onClick={onClose}>×</button>
        </div>
        <CaptureImage
          imageRef={story.discovery?.imageRef}
          alt={story.discovery?.itemName || 'Community story'}
          element={story.discovery?.element}
          className="community-story-view-photo"
          useAuth={story.discovery?.imageRef?.includes('/captures/')}
        />
        <button
          type="button"
          className="community-story-nav community-story-nav-previous"
          aria-label="Previous story"
          onClick={goPrevious}
          disabled={activeIndex === 0}
        />
        <button
          type="button"
          className="community-story-nav community-story-nav-next"
          aria-label={activeIndex === stories.length - 1 ? 'Close stories' : 'Next story'}
          onClick={goNext}
        />
        <div className="community-story-view-copy">
          <span>{story.discovery?.rarityStars || 0}★</span>
          <h3>{story.discovery?.cardTitle || story.discovery?.itemName || 'Discovery'}</h3>
          {story.placeLabel && <p>{story.placeLabel}</p>}
        </div>
      </motion.section>
    </motion.div>,
    document.body,
  );
}

function CommunityProfileSheet({ userId, onClose }) {
  const { data: profile, isLoading, isError } = useCommunityProfile(userId);
  const followMutation = useSetCommunityFollow();

  return createPortal(
    <motion.div
      className="community-profile-backdrop"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        className="community-profile-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-profile-title"
        initial={{ y: 36, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 36, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="community-profile-close" aria-label="Close profile" onClick={onClose}>×</button>
        {isLoading && <div className="community-profile-state" role="status">Loading profile…</div>}
        {isError && <div className="community-profile-state" role="alert">Profile could not be loaded.</div>}
        {profile && (
          <>
            <header className="community-profile-head">
              <span className="post-author-avatar" aria-hidden="true">{initials(profile.displayName)}</span>
              <div>
                <h2 id="community-profile-title">{profile.displayName}</h2>
                <p>{profile.rankTitle}</p>
              </div>
              {!profile.viewer?.isSelf && (
                <button
                  type="button"
                  className={`community-follow-btn ${profile.viewer?.isFollowing ? 'following' : ''}`}
                  disabled={followMutation.isPending}
                  onClick={() => {
                    playTap();
                    followMutation.mutate({ userId: profile.userId, following: !profile.viewer?.isFollowing });
                  }}
                >
                  {profile.viewer?.isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </header>
            <div className="community-profile-stats" aria-label="Profile stats">
              <span><strong>{profile.stats.posts}</strong>Posts</span>
              <span><strong>{profile.stats.followers}</strong>Followers</span>
              <span><strong>{profile.stats.following}</strong>Following</span>
            </div>
            <div className="community-profile-meta">
              <span>{Number(profile.totalXp || 0).toLocaleString()} XP</span>
              <span>{Number(profile.streakDays || 0)} day streak</span>
              {profile.viewer?.isFriend && <span>Friend</span>}
            </div>
            <div className="community-profile-grid" aria-label={`${profile.displayName}'s recent posts`}>
              {profile.recentPosts?.length ? profile.recentPosts.map((post) => (
                <div key={post.id} className="community-profile-grid-item">
                  <CaptureImage
                    imageRef={post.discovery?.imageRef}
                    alt={post.discovery?.itemName || 'Discovery'}
                    element={post.discovery?.element}
                    className="community-profile-grid-photo"
                    useAuth={post.discovery?.imageRef?.includes('/captures/')}
                  />
                  <span>{post.discovery?.rarityStars || 0}★</span>
                </div>
              )) : (
                <p>No public discoveries yet.</p>
              )}
            </div>
          </>
        )}
      </motion.section>
    </motion.div>,
    document.body,
  );
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or promotion' },
  { id: 'abuse', label: 'Harassment or abuse' },
  { id: 'unsafe_location', label: 'Unsafe location or behavior' },
  { id: 'misinfo', label: 'Fake or misleading discovery' },
  { id: 'private_info', label: 'Private information' },
  { id: 'other', label: 'Something else' },
];

function ReportReasonSheet({ post, isSubmitting, onClose, onSubmit }) {
  const [reason, setReason] = useState('');

  return createPortal(
    <motion.div
      className="community-report-backdrop"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        className="community-report-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-report-title"
        initial={{ y: 32, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 32, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="community-report-head">
          <div>
            <span>Report post</span>
            <h2 id="community-report-title">Why report this?</h2>
            <p>{post.discovery?.cardTitle || post.discovery?.itemName || 'This discovery'} from {post.author.displayName}</p>
          </div>
          <button type="button" aria-label="Close report" onClick={onClose}>×</button>
        </div>

        <div className="community-report-options">
          {REPORT_REASONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={reason === item.id ? 'selected' : ''}
              onClick={() => { playTap(); setReason(item.id); }}
            >
              <span>{item.label}</span>
              <i aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="community-report-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" disabled={!reason || isSubmitting} onClick={() => onSubmit(reason)}>
            {isSubmitting ? 'Sending…' : 'Submit report'}
          </button>
        </div>
      </motion.section>
    </motion.div>,
    document.body,
  );
}

function CommentThread({ postId, post }) {
  const { data: comments, isLoading, isError } = useCommunityComments(postId);
  const addComment = useAddCommunityComment();
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const visibleComments = useMemo(() => {
    if (comments?.length) return comments;
    if (!isLoading && !isError && post?.commentCount > 0) {
      return buildCommentPreview(post);
    }
    return [];
  }, [comments, isError, isLoading, post]);

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
      {!isLoading && !isError && visibleComments.length === 0 && (
        <p className="community-state-note">No comments yet.</p>
      )}
      {visibleComments.length > 0 && (
        <div className="post-comment-list">
          {visibleComments.slice(0, 3).map((comment) => (
            <div key={comment.id} className="post-comment">
              <span className="post-comment-avatar" aria-hidden="true">{initials(comment.displayName)}</span>
              <div className="post-comment-bubble">
                <div>
                  <strong>{comment.displayName}</strong>
                  {comment.createdAt && <small>{timeAgo(comment.createdAt)}</small>}
                </div>
                <p>{comment.body}</p>
              </div>
            </div>
          ))}
          {post?.commentCount > visibleComments.length && (
            <p className="community-state-note">Showing preview comments. Sign in to load the full thread.</p>
          )}
          {visibleComments.length > 3 && (
            <p className="community-state-note">Showing latest 3 of {visibleComments.length} comments.</p>
          )}
        </div>
      )}

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

function buildCommentPreview(post) {
  const firstName = post.author?.displayName?.split(/\s+/)[0] || 'Explorer';
  const place = post.placeLabel || 'there';
  const count = Math.min(3, post.commentCount || 0);
  const samples = [
    { displayName: 'Nila Skies', body: `That light at ${place} looks unreal.`, createdAt: new Date(Date.now() - 42 * 60000).toISOString() },
    { displayName: 'Arjun Vale', body: 'Adding this to my next walk list.', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
    { displayName: firstName, body: 'Thanks. It was worth stopping for.', createdAt: new Date(Date.now() - 12 * 60000).toISOString() },
  ];
  return samples.slice(0, count).map((comment, index) => ({
    id: `${post.id}-preview-${index}`,
    ...comment,
  }));
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

  const positioned = useMemo(() => {
    // Fit the map to the discoveries instead of a whole-world projection: at
    // world scale an entire metro collapses into a single pixel, so every
    // Bengaluru capture renders as one glowing dot. Equal padding on each side
    // keeps a lone marker centred and stops edge points touching the frame.
    const lats = located.map((post) => post.gps.lat);
    const lngs = located.map((post) => post.gps.lng);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs);
    let maxLng = Math.max(...lngs);
    const padLat = Math.max((maxLat - minLat) * 0.22, 0.02);
    const padLng = Math.max((maxLng - minLng) * 0.22, 0.02);
    minLat -= padLat;
    maxLat += padLat;
    minLng -= padLng;
    maxLng += padLng;
    const spanLat = Math.max(maxLat - minLat, 1e-9);
    const spanLng = Math.max(maxLng - minLng, 1e-9);
    return {
      glowX: (((minLng + maxLng) / 2 - minLng) / spanLng) * 100,
      glowY: ((maxLat - (minLat + maxLat) / 2) / spanLat) * 100,
      markers: located.map((post) => ({
        post,
        left: ((post.gps.lng - minLng) / spanLng) * 100,
        top: ((maxLat - post.gps.lat) / spanLat) * 100,
      })),
    };
  }, [located]);

  return (
    <div className="community-map-panel">
      <div
        className="community-map-canvas"
        role="img"
        aria-label={`${located.length} shared discoveries with locations`}
        style={{ '--map-glow-x': `${positioned.glowX.toFixed(2)}%`, '--map-glow-y': `${positioned.glowY.toFixed(2)}%` }}
      >
        {positioned.markers.map(({ post, left, top }) => (
          <span
            key={post.id}
            className={`community-map-marker rank-hex-${post.discovery?.rarityStars || 1}`}
            style={{ left: `${left}%`, top: `${top}%` }}
            title={`${post.discovery?.itemName || 'Discovery'} — ${post.placeLabel || 'Unnamed location'}`}
          />
        ))}
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
