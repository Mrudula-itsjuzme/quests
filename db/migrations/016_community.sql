-- Community: discovery posts, likes, comments and friendships.
--
-- quest_feed_entries already records quest-submission activity, but it is
-- append-only telemetry with no engagement model and no link to captures.
-- Sharing a discovery is a distinct user action, so it gets its own normalized
-- tables rather than overloading the quest feed.

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  -- Each capture can be shared at most once; the partial unique index below
  -- makes re-sharing idempotent rather than creating duplicate posts.
  card_id UUID REFERENCES captured_cards(id) ON DELETE CASCADE,
  caption TEXT NOT NULL DEFAULT '' CHECK (char_length(caption) <= 500),
  hashtags JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Denormalized location so a post keeps its place even if the card changes.
  place_label TEXT,
  gps_lat NUMERIC(9,6),
  gps_lng NUMERIC(9,6),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'friends')),
  like_count INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  comment_count INTEGER NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_posts_created_idx ON community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_user_idx ON community_posts (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS community_posts_card_unique
  ON community_posts (card_id) WHERE card_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS community_post_likes (
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_post_comments (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_comments_post_idx ON community_post_comments (post_id, created_at);

-- Friendships are stored as a single row per pair, ordered so that
-- (a,b) and (b,a) collapse to the same key and can't be duplicated.
CREATE TABLE IF NOT EXISTS community_friendships (
  requester_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  addressee_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
CREATE INDEX IF NOT EXISTS community_friendships_addressee_idx ON community_friendships (addressee_id, status);
