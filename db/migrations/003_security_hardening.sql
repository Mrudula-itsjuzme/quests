-- Enforce the user/assignment ownership relation at the database boundary and
-- make photo replay prevention atomic under concurrent submissions.
CREATE UNIQUE INDEX quest_assignments_id_user_unique
  ON quest_assignments (id, user_id);

ALTER TABLE quest_submissions
  ADD CONSTRAINT quest_submissions_assignment_owner_fk
  FOREIGN KEY (assignment_id, user_id)
  REFERENCES quest_assignments (id, user_id)
  ON DELETE CASCADE;

CREATE UNIQUE INDEX quest_submissions_user_image_unique
  ON quest_submissions (user_id, image_hash)
  WHERE image_hash IS NOT NULL;

CREATE INDEX quest_idempotency_retention_idx
  ON quest_idempotency_keys (user_id, status, created_at, completed_at);
