import { Link, useParams } from 'react-router-dom';
import { useCommunityProfile, useSetCommunityFollow } from '../quests/queries';
import { Icon } from '../../components/Icon';
import { CaptureImage } from '../../components/CaptureImage';
import { playTap } from '../../lib/useSoundEffects';

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function PublicProfile() {
  const { id } = useParams();
  const { data: profile, isLoading, isError, refetch } = useCommunityProfile(id);
  const followMutation = useSetCommunityFollow();

  if (isLoading) {
    return <div className="public-profile-page page-stack" aria-busy="true"><p>Loading profile...</p></div>;
  }

  if (isError || !profile) {
    return (
      <div className="public-profile-page page-stack error-state" role="alert">
        <header className="page-header"><Link to="/app/community" aria-label="Community"><Icon name="arrow-left" /></Link></header>
        <div className="error-content">
          <Icon name="shield" />
          <p>Profile unavailable</p>
          <button type="button" onClick={() => { playTap(); refetch(); }}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-profile-page page-stack">
      <header className="page-header">
        <Link to="/app/community" aria-label="Community" onClick={playTap}><Icon name="arrow-left" /></Link>
      </header>
      <div className="profile-content">
        <div className="profile-head">
          <span className="profile-avatar" aria-hidden="true">{initials(profile.displayName)}</span>
          <div className="profile-info">
            <h2>{profile.displayName}</h2>
            <p>{profile.rankTitle}</p>
          </div>
          {!profile.viewer?.isSelf && (
            <button
              type="button"
              className={`follow-btn ${profile.viewer?.isFollowing ? 'following' : ''}`}
              disabled={followMutation.isPending}
              onClick={() => {
                playTap();
                followMutation.mutate({ userId: profile.userId, following: !profile.viewer?.isFollowing });
              }}
            >
              {profile.viewer?.isFollowing ? 'Following' : 'Follow explorer'}
            </button>
          )}
        </div>
        <div className="profile-stats">
          <div className="stat"><strong>{profile.stats.posts}</strong><span>Posts</span></div>
          <div className="stat"><strong>{profile.stats.followers}</strong><span>Followers</span></div>
          <div className="stat"><strong>{profile.stats.following}</strong><span>Following</span></div>
        </div>
        <div className="profile-meta">
          <span>{Number(profile.totalXp || 0).toLocaleString()} XP</span>
          <span>{Number(profile.streakDays || 0)} day streak</span>
          {profile.viewer?.isFriend && <span>Friend</span>}
        </div>
        <div className="profile-grid">
          {profile.recentPosts?.length ? profile.recentPosts.map((post) => (
            <div key={post.id} className="grid-item">
              <CaptureImage
                imageRef={post.discovery?.imageRef}
                alt={post.discovery?.itemName || 'Discovery'}
                element={post.discovery?.element}
                className="grid-photo"
                useAuth={post.discovery?.imageRef?.includes('/captures/')}
              />
              <span className="rarity-stars">{post.discovery?.rarityStars || 0}★</span>
            </div>
          )) : (
            <p className="empty-message">No public discoveries yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
