-- Community stories and public profile graph.
--
-- Stories are ephemeral views over recent, shareable community posts. The
-- post remains the source of truth for caption, capture media, privacy, and
-- moderation; this table records per-viewer seen state without duplicating
-- media or bypassing post visibility.

CREATE TABLE IF NOT EXISTS community_story_views (
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, viewer_id)
);
CREATE INDEX IF NOT EXISTS community_story_views_viewer_idx
  ON community_story_views (viewer_id, viewed_at DESC);

CREATE TABLE IF NOT EXISTS community_follows (
  follower_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX IF NOT EXISTS community_follows_following_idx
  ON community_follows (following_id, created_at DESC);

ALTER TABLE public.community_story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all access" ON public.community_story_views FOR ALL TO public USING (false);
CREATE POLICY "Deny all access" ON public.community_follows FOR ALL TO public USING (false);
