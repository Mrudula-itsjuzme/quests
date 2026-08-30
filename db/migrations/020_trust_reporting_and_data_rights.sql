-- P0 trust hardening: community reporting and account deletion requests.
--
-- Blueprint §22/§27 require report + review paths for abusive/community
-- content and GDPR-style data deletion. This migration adds the minimum
-- server-side state needed to receive reports and authenticated deletion
-- requests without pretending the operational erase policy is complete.

ALTER TABLE quest_users
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quest_users_account_status_check'
  ) THEN
    ALTER TABLE quest_users
      ADD CONSTRAINT quest_users_account_status_check
      CHECK (account_status IN ('active','suspended','banned','deletion_requested','deleted'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS community_post_reports (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('abuse','misinfo','private_info','unsafe_location','spam','other')),
  details TEXT NOT NULL DEFAULT '' CHECK (char_length(details) <= 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS community_post_reports_queue_idx
  ON community_post_reports (status, created_at) WHERE status IN ('pending','reviewing');

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retention_until TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS account_deletion_requests_pending_unique
  ON account_deletion_requests (user_id) WHERE status = 'pending';
