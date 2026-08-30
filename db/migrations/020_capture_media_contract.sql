-- Controlled capture media delivery for Discovery Cards, Library, and public
-- Community posts. The app can later swap media_data for private object storage
-- signed URLs without changing the card/community API contract.

CREATE TABLE IF NOT EXISTS capture_media (
  card_id UUID PRIMARY KEY REFERENCES captured_cards(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES quest_users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/png', 'image/jpeg', 'image/webp')),
  media_data TEXT,
  storage_ref TEXT,
  public_safe BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (media_data IS NOT NULL OR storage_ref IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS capture_media_user_idx ON capture_media (user_id);
CREATE INDEX IF NOT EXISTS capture_media_public_safe_idx ON capture_media (public_safe) WHERE public_safe;
