import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { progressionEngine } from './progression-engine.js';

export class PostgresQuestRepository {
  constructor(pool) {
    this.pool = pool;
    this._definitionCache = null;
  }

  async ensureUser(user) {
    await this.pool.query(
      `INSERT INTO quest_users (id, display_name, timezone)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [user.id, user.displayName || 'Adventurer', user.timezone || 'UTC'],
    );
    return this.getUser(user.id);
  }
  async getUser(userId) { const { rows } = await this.pool.query('SELECT * FROM quest_users WHERE id = $1', [userId]); return rows[0] ? mapUser(rows[0]) : null; }
  async listUsers() { const { rows } = await this.pool.query('SELECT * FROM quest_users ORDER BY id'); return rows.map(mapUser); }
  async updateUserProfile(userId, patch) {
    const fields = {
      displayName: 'display_name',
      timezone: 'timezone',
      primaryPath: 'primary_path',
      reminderTime: 'reminder_time',
      motionPreference: 'motion_preference',
      onboardingCompletedAt: 'onboarding_completed_at',
      tourVersionSeen: 'tour_version_seen',
    };
    const entries = Object.entries(patch).filter(([key, value]) => fields[key] && value !== undefined);
    if (!entries.length) return this.getUser(userId);
    const values = entries.map(([, value]) => value);
    values.push(userId);
    const set = entries.map(([key], index) => `${fields[key]} = $${index + 1}`);
    const { rows } = await this.pool.query(
      `UPDATE quest_users SET ${set.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return rows[0] ? mapUser(rows[0]) : null;
  }
  async requestAccountDeletion(userId, { reason = null } = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM quest_users WHERE id = $1 FOR UPDATE', [userId]);
      const existing = await client.query("SELECT * FROM account_deletion_requests WHERE user_id = $1 AND status = 'pending'", [userId]);
      if (existing.rows[0]) {
        await client.query('COMMIT');
        return { ...mapAccountDeletionRequest(existing.rows[0]), created: false };
      }
      const { rows } = await client.query(
        `INSERT INTO account_deletion_requests (id, user_id, reason, status)
         VALUES ($1,$2,$3,'pending') RETURNING *`,
        [randomUUID(), userId, reason],
      );
      await client.query("UPDATE quest_users SET account_status = 'deletion_requested', deletion_requested_at = NOW(), updated_at = NOW() WHERE id = $1", [userId]);
      await client.query('COMMIT');
      return { ...mapAccountDeletionRequest(rows[0]), created: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  async reconcileStreak(userId, currentPeriodKey) {
    await this.pool.query(`UPDATE quest_users SET streak_days = 0, updated_at = NOW()
      WHERE id = $1 AND streak_days > 0
        AND (last_streak_period IS NULL OR last_streak_period::date < $2::date - 1)`, [userId, currentPeriodKey]);
  }
  async listDefinitions(filters = {}) {
    if (!this._definitionCache) {
      const { rows } = await this.pool.query('SELECT * FROM quest_definitions WHERE enabled = TRUE ORDER BY id');
      this._definitionCache = rows.map(mapDefinition);
    }
    let result = this._definitionCache;
    if (filters.cadence) result = result.filter((d) => d.cadence === filters.cadence);
    if (filters.category) result = result.filter((d) => d.category === filters.category);
    return result;
  }
  async createDefinition(definition) {
    this._definitionCache = null;
    const { rows } = await this.pool.query(
      `INSERT INTO quest_definitions (id,title,description,category,rarity,cadence,verification_type,subject_tag,target_value,unit,cooldown_days,xp_reward,instructions,enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,TRUE)
       ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, updated_at=NOW()
       RETURNING *`,
      [definition.id, definition.title, definition.description, definition.category, definition.rarity, definition.cadence, definition.verificationType, definition.subjectTag, definition.targetValue, definition.unit, definition.cooldownDays, definition.xpReward, JSON.stringify(definition.instructions)],
    );
    return mapDefinition(rows[0]);
  }
  async listAssignments(userId) { const { rows } = await this.pool.query('SELECT * FROM quest_assignments WHERE user_id = $1 ORDER BY assigned_at DESC', [userId]); return rows.map(mapAssignment); }
  async listActive(userId, now) { const { rows } = await this.pool.query(`SELECT * FROM quest_assignments WHERE user_id = $1 AND status = ANY($2) AND expires_at > $3 ORDER BY assigned_at`, [userId, ['active', 'pending_verification', 'rejected'], now]); return rows.map(mapAssignment); }
  async listHistory(userId) { const { rows } = await this.pool.query(`SELECT * FROM quest_assignments WHERE user_id = $1 AND status = ANY($2) ORDER BY updated_at DESC LIMIT 200`, [userId, ['completed', 'expired', 'abandoned']]); return rows.map(mapAssignment); }
  async findPeriodAssignments(userId, cadence, periodKey) { const { rows } = await this.pool.query('SELECT * FROM quest_assignments WHERE user_id = $1 AND cadence = $2 AND period_key = $3 ORDER BY category', [userId, cadence, periodKey]); return rows.map(mapAssignment); }
  async recentAssignments(userId, cadence, since) { const { rows } = await this.pool.query('SELECT * FROM quest_assignments WHERE user_id = $1 AND cadence = $2 AND assigned_at >= $3 ORDER BY assigned_at DESC', [userId, cadence, since]); return rows.map(mapAssignment); }
  async createAssignments(items) {
    const created = [];
    for (const item of items) {
      const { rows } = await this.pool.query(
        `INSERT INTO quest_assignments
          (id, user_id, definition_id, title, description, category, rarity, cadence, verification_type, subject_tag, target_value, unit, xp_reward, instructions, period_key, status, progress_value, assigned_at, starts_at, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'active',0,$16,$17,$18)
         ON CONFLICT (user_id, cadence, period_key, definition_id) DO UPDATE SET updated_at = quest_assignments.updated_at
         RETURNING *`,
        [randomUUID(), item.userId, item.definitionId, item.title, item.description, item.category, item.rarity, item.cadence, item.verificationType, item.subjectTag, item.targetValue, item.unit, item.xpReward, JSON.stringify(item.instructions), item.periodKey, item.assignedAt, item.startsAt, item.expiresAt],
      );
      created.push(mapAssignment(rows[0]));
    }
    return created;
  }
  async createReplacementAssignment(item) {
    const [created] = await this.createAssignments([item]);
    return created;
  }
  async runGenerationTransaction({ userId, cadence, periodKey, idempotencyKey, select }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM quest_users WHERE id = $1 FOR UPDATE', [userId]);
      const existingRun = await client.query(`SELECT status FROM quest_generation_runs
        WHERE user_id = $1 AND cadence = $2 AND period_key = $3 FOR UPDATE`, [userId, cadence, periodKey]);
      if (existingRun.rows[0]?.status === 'completed') {
        const existing = await client.query('SELECT * FROM quest_assignments WHERE user_id = $1 AND cadence = $2 AND period_key = $3 ORDER BY category', [userId, cadence, periodKey]);
        await client.query('COMMIT');
        return existing.rows.map(mapAssignment);
      }
      const transaction = {
        listDefinitions: async (filters = {}) => {
          const values = [];
          const where = ['enabled = TRUE'];
          if (filters.cadence) { values.push(filters.cadence); where.push(`cadence = $${values.length}`); }
          if (filters.category) { values.push(filters.category); where.push(`category = $${values.length}`); }
          const result = await client.query(`SELECT * FROM quest_definitions WHERE ${where.join(' AND ')} ORDER BY id`, values);
          return result.rows.map(mapDefinition);
        },
        recentAssignments: async (_selectedUserId, selectedCadence, since) => {
          const result = await client.query('SELECT * FROM quest_assignments WHERE user_id = $1 AND cadence = $2 AND assigned_at >= $3 ORDER BY assigned_at DESC', [userId, selectedCadence, since]);
          return result.rows.map(mapAssignment);
        },
      };
      const items = await select(transaction);
      await client.query(`INSERT INTO quest_generation_runs
        (id, user_id, cadence, period_key, idempotency_key, status)
        VALUES ($1,$2,$3,$4,$5,'processing')
        ON CONFLICT (user_id, cadence, period_key) DO UPDATE
          SET idempotency_key = EXCLUDED.idempotency_key, status = 'processing', updated_at = NOW()`,
      [randomUUID(), userId, cadence, periodKey, idempotencyKey]);

      const created = [];
      for (const item of items) {
        const { rows } = await client.query(
          `INSERT INTO quest_assignments
            (id, user_id, definition_id, title, description, category, rarity, cadence, verification_type, subject_tag, target_value, unit, xp_reward, instructions, period_key, status, progress_value, assigned_at, starts_at, expires_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'active',0,$16,$17,$18)
           ON CONFLICT (user_id, cadence, period_key, definition_id) DO UPDATE SET updated_at = quest_assignments.updated_at
           RETURNING *`,
          [randomUUID(), userId, item.definitionId, item.title, item.description, item.category, item.rarity, cadence, item.verificationType, item.subjectTag, item.targetValue, item.unit, item.xpReward, JSON.stringify(item.instructions), periodKey, item.assignedAt, item.startsAt, item.expiresAt],
        );
        created.push(mapAssignment(rows[0]));
      }
      await client.query(`UPDATE quest_generation_runs SET status = 'completed', assignment_count = $4, completed_at = NOW(), updated_at = NOW()
        WHERE user_id = $1 AND cadence = $2 AND period_key = $3`, [userId, cadence, periodKey, created.length]);
      if (cadence === 'daily') await client.query(`INSERT INTO quest_daily_states
        (user_id, period_key, total_assignments, completed_assignments)
        VALUES ($1,$2,$3,0)
        ON CONFLICT (user_id, period_key) DO UPDATE SET total_assignments = EXCLUDED.total_assignments, updated_at = NOW()`, [userId, periodKey, created.length]);
      await client.query('COMMIT');
      return created;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  async getAssignment(userId, assignmentId) { const { rows } = await this.pool.query('SELECT * FROM quest_assignments WHERE user_id = $1 AND id = $2', [userId, assignmentId]); return rows[0] ? mapAssignment(rows[0]) : null; }
  async updateAssignment(assignmentId, patch) {
    const allowed = { status: 'status', progressValue: 'progress_value', completedAt: 'completed_at' };
    const entries = Object.entries(patch).filter(([key]) => allowed[key]);
    if (!entries.length) return null;
    const values = entries.map(([, value]) => value);
    const set = entries.map(([key], index) => `${allowed[key]} = $${index + 1}`);
    values.push(assignmentId);
    const { rows } = await this.pool.query(`UPDATE quest_assignments SET ${set.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`, values);
    return rows[0] ? mapAssignment(rows[0]) : null;
  }
  async expireAssignments(userId, now) { await this.pool.query(`UPDATE quest_assignments SET status = 'expired', updated_at = NOW() WHERE user_id = $1 AND status = ANY($2) AND expires_at <= $3`, [userId, ['active', 'pending_verification', 'rejected'], now]); }
  async hasImageHash(userId, hash) { const { rowCount } = await this.pool.query('SELECT 1 FROM quest_submissions WHERE user_id = $1 AND image_hash = $2 LIMIT 1', [userId, hash]); return rowCount > 0; }
  async hasSimilarImageHash(userId, hash, threshold = 0.95) {
    // Exact match first (index lookup, O(1)); only fall back to JS similarity
    // scan on a bounded sample when threshold allows near-duplicates.
    if (threshold >= 1) {
      const { rowCount } = await this.pool.query(
        'SELECT 1 FROM quest_submissions WHERE user_id = $1 AND image_hash = $2 LIMIT 1',
        [userId, hash],
      );
      return rowCount > 0;
    }
    const { rows } = await this.pool.query(
      'SELECT image_hash FROM quest_submissions WHERE user_id = $1 AND image_hash IS NOT NULL LIMIT 1000',
      [userId],
    );
    return rows.some((row) => hashSimilarity(row.image_hash, hash) >= threshold);
  }
  async hasGlobalSimilarImageHash(userId, hash, threshold = 0.95) {
    // Exact match first — avoids JS scan for the common duplicate-detection case.
    if (threshold >= 1) {
      const { rowCount } = await this.pool.query(
        'SELECT 1 FROM quest_submissions WHERE user_id <> $1 AND image_hash = $2 LIMIT 1',
        [userId, hash],
      );
      return rowCount > 0;
    }
    // Bounded scan — prevents full-table read at scale (100+ users × N captures).
    const { rows } = await this.pool.query(
      'SELECT image_hash FROM quest_submissions WHERE user_id <> $1 AND image_hash IS NOT NULL LIMIT 1000',
      [userId],
    );
    return rows.some((row) => hashSimilarity(row.image_hash, hash) >= threshold);
  }
  async countRecentRejectedSubmissions(userId, since) {
    const { rows } = await this.pool.query("SELECT COUNT(*)::int AS count FROM quest_submissions WHERE user_id=$1 AND status='rejected' AND created_at >= $2", [userId, since]);
    return rows[0].count;
  }
  async createSubmission(value) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO quest_submissions (id, user_id, assignment_id, verification_type, status, image_hash, confidence, feed_posted, upload_id, metadata, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [randomUUID(), value.userId, value.assignmentId, value.verificationType, value.status, value.imageHash, value.confidence, value.feedPosted, value.uploadId, JSON.stringify(value.metadata || {}), value.createdAt],
      );
      return mapSubmission(rows[0]);
    } catch (error) {
      if (error.code === '23505' && error.constraint === 'quest_submissions_user_image_unique') throw conflict('duplicate_submission');
      throw error;
    }
  }
  async countRejectedSubmissions(assignmentId) {
    const { rows } = await this.pool.query("SELECT COUNT(*)::int AS count FROM quest_submissions WHERE assignment_id = $1 AND status = 'rejected'", [assignmentId]);
    return rows[0].count;
  }
  async getSubmission(submissionId) {
    const { rows } = await this.pool.query('SELECT * FROM quest_submissions WHERE id=$1', [submissionId]);
    return rows[0] ? mapSubmission(rows[0]) : null;
  }
  async listReviewQueue() {
    const { rows } = await this.pool.query("SELECT * FROM quest_submissions WHERE status='manual_review' ORDER BY created_at ASC LIMIT 200");
    return rows.map(mapSubmission);
  }
  async updateSubmission(submissionId, patch) {
    const { rows } = await this.pool.query(`UPDATE quest_submissions SET
      status=COALESCE($2,status), reviewed_at=COALESCE($3,reviewed_at),
      reviewed_by=COALESCE($4,reviewed_by), review_reason=COALESCE($5,review_reason)
      WHERE id=$1 RETURNING *`, [submissionId, patch.status, patch.reviewedAt, patch.reviewedBy, patch.reviewReason]);
    return rows[0] ? mapSubmission(rows[0]) : null;
  }
  async completeAssignment({ userId, assignmentId, now, dailyPeriodKey }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Serializing reward mutations per user prevents two different final
      // daily assignments from both observing an incomplete three-quest set.
      await client.query('SELECT id FROM quest_users WHERE id = $1 FOR UPDATE', [userId]);
      const assignmentResult = await client.query('SELECT * FROM quest_assignments WHERE id = $1 AND user_id = $2 FOR UPDATE', [assignmentId, userId]);
      if (!assignmentResult.rows[0]) { await client.query('ROLLBACK'); return null; }
      const assignment = assignmentResult.rows[0];
      if (assignment.status === 'completed') {
        const user = await client.query('SELECT * FROM quest_users WHERE id = $1', [userId]);
        await client.query('COMMIT');
        return { assignment: mapAssignment(assignment), user: mapUser(user.rows[0]), xpCredited: 0, bonusXp: 0 };
      }
      await client.query(`UPDATE quest_assignments SET status = 'completed', progress_value = target_value, completed_at = $3, updated_at = $3 WHERE id = $1 AND user_id = $2`, [assignmentId, userId, now]);
      const ledgerKey = `${userId}:quest:${assignmentId}`;
      const ledger = await client.query(`INSERT INTO quest_xp_ledger (id, ledger_key, user_id, assignment_id, amount, reason) VALUES ($1,$2,$3,$4,$5,'quest_completion') ON CONFLICT (ledger_key) DO NOTHING RETURNING amount`, [randomUUID(), ledgerKey, userId, assignmentId, assignment.xp_reward]);
      const xpCredited = Number(ledger.rows[0]?.amount || 0);
      if (xpCredited) await client.query('UPDATE quest_users SET total_xp = total_xp + $2, updated_at = NOW() WHERE id = $1', [userId, xpCredited]);
      let bonusXp = 0;
      if (assignment.cadence === 'daily') {
        const count = await client.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'completed')::int AS completed FROM quest_assignments WHERE user_id = $1 AND cadence = 'daily' AND period_key = $2`, [userId, dailyPeriodKey]);
        await client.query(`INSERT INTO quest_daily_states
          (user_id, period_key, total_assignments, completed_assignments, bonus_awarded, updated_at)
          VALUES ($1,$2,$3,$4,FALSE,NOW())
          ON CONFLICT (user_id, period_key) DO UPDATE
            SET total_assignments = EXCLUDED.total_assignments,
                completed_assignments = EXCLUDED.completed_assignments,
                updated_at = NOW()`, [userId, dailyPeriodKey, count.rows[0].total, count.rows[0].completed]);
        if (count.rows[0].total > 0 && count.rows[0].completed === count.rows[0].total) {
          const bonusKey = `${userId}:${dailyPeriodKey}:bonus`;
          const bonus = await client.query(`INSERT INTO quest_xp_ledger (id, ledger_key, user_id, amount, reason) VALUES ($1,$2,$3,150,'daily_bonus') ON CONFLICT (ledger_key) DO NOTHING RETURNING amount`, [randomUUID(), bonusKey, userId]);
          bonusXp = Number(bonus.rows[0]?.amount || 0);
          if (bonusXp) await client.query(`UPDATE quest_users
            SET total_xp = total_xp + 150,
                streak_days = CASE
                  WHEN last_streak_period::date = $2::text::date - 1 THEN streak_days + 1
                  WHEN last_streak_period = $2::text THEN streak_days
                  ELSE 1
                END,
                last_streak_period = $2::text,
                updated_at = NOW()
            WHERE id = $1`, [userId, dailyPeriodKey]);
          if (bonusXp) await client.query(`UPDATE quest_daily_states SET
            bonus_awarded = TRUE,
            bonus_awarded_at = $3,
            streak_applied = TRUE,
            streak_after = (SELECT streak_days FROM quest_users WHERE id = $1),
            updated_at = NOW()
            WHERE user_id = $1 AND period_key = $2`, [userId, dailyPeriodKey, now]);
        }
      }
      if (xpCredited && ['Discovery', 'Weekly', 'Monthly'].includes(assignment.category)) {
        await client.query(`INSERT INTO collectible_unlocks
          (user_id, asset_id, quest_id, title, category, rarity, caption, unlocked_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          ON CONFLICT (user_id, asset_id) DO NOTHING`,
        [userId, `${assignment.definition_id}:${assignmentId}`, assignmentId, assignment.title, assignment.category, assignment.rarity, `Earned by completing ${assignment.title}.`, now]);
      }
      if (xpCredited || bonusXp) {
        const currentXp = await client.query('SELECT total_xp FROM quest_users WHERE id = $1', [userId]);
        const currentLevel = levelFromXp(Number(currentXp.rows[0].total_xp));
        await client.query(`INSERT INTO quest_user_rewards (user_id, level)
          SELECT $1, level FROM quest_level_rewards WHERE level <= $2
          ON CONFLICT (user_id, level) DO NOTHING`, [userId, currentLevel]);
      }
      const updatedAssignment = await client.query('SELECT * FROM quest_assignments WHERE id = $1', [assignmentId]);
      const updatedUser = await client.query('SELECT * FROM quest_users WHERE id = $1', [userId]);
      await client.query('COMMIT');
      return { assignment: mapAssignment(updatedAssignment.rows[0]), user: mapUser(updatedUser.rows[0]), xpCredited, bonusXp };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async getCollectibles(userId) { const { rows } = await this.pool.query('SELECT * FROM collectible_unlocks WHERE user_id = $1 ORDER BY unlocked_at DESC', [userId]); return rows.map((row) => ({ assetId: row.asset_id, questId: row.quest_id, title: row.title, category: row.category, rarity: row.rarity, caption: row.caption, unlockedAt: row.unlocked_at })); }
  async createCapturedCard(card) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const cardId = randomUUID();
      const imageRef = card.imageRef || ((card.mediaData || card.storageRef) ? `/api/v1/captures/${cardId}/media` : null);
      if (card.captureId) {
        const existing = await client.query('SELECT * FROM captured_cards WHERE user_id = $1 AND capture_id = $2 FOR UPDATE', [card.userId, card.captureId]);
        if (existing.rows[0]) {
          await client.query('COMMIT');
          return mapCapturedCard(existing.rows[0]);
        }
        const foreign = await client.query('SELECT 1 FROM captured_cards WHERE capture_id = $1 LIMIT 1', [card.captureId]);
        if (foreign.rows[0]) throw conflict('duplicate_capture_id');
      }
      const { rows } = await client.query(
        `INSERT INTO captured_cards
          (id, user_id, capture_id, item_name, category, card_title, rarity_tier, rarity_score, description, notes, image_ref, image_hash,
           status, gps_lat, gps_lng, gps_accuracy_m, gps_altitude, heading, captured_at, server_received_at,
           anti_cheat_verdict, anti_cheat_reason, anti_cheat_detail, reject_reason,
           species_id, confidence, rarity_grade, rarity_stars, rarity_weight_set_version, rarity_factor_breakdown, xp_awarded, coins_awarded)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
        RETURNING *`,
        [
          cardId, card.userId, card.captureId || null, card.itemName, card.category, card.cardTitle, card.rarityTier, card.rarityScore,
          card.description, card.notes || null, imageRef, card.imageHash || null,
          card.status || 'final', card.gps?.lat ?? null, card.gps?.lng ?? null, card.gps?.accuracyM ?? null, card.gps?.altitude ?? null,
          card.heading ?? null, card.capturedAt || new Date(), card.serverReceivedAt || new Date(),
          card.antiCheatVerdict || null, card.antiCheatReason || null, JSON.stringify(card.antiCheatDetail || []), card.rejectReason || null,
          card.speciesId || null, card.confidence ?? null, card.rarityGrade || null,
          card.rarityStars ?? Math.max(1, Math.round(Number(card.rarityScore || 0) * 5)),
          card.rarityWeightSetVersion ?? null, JSON.stringify(card.rarityFactorBreakdown || {}), card.xpAwarded || 0, card.coinsAwarded || 0,
        ],
      );
      const created = rows[0];
      if (card.mediaData || card.storageRef) {
        await client.query(
          `INSERT INTO capture_media (card_id, user_id, content_type, media_data, storage_ref, public_safe)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (card_id) DO UPDATE SET
             content_type = EXCLUDED.content_type,
             media_data = EXCLUDED.media_data,
             storage_ref = EXCLUDED.storage_ref,
             public_safe = EXCLUDED.public_safe,
             updated_at = NOW()`,
          [created.id, card.userId, card.mediaContentType || 'image/jpeg', card.mediaData || null, card.storageRef || null, created.status === 'final'],
        );
      }
      // Provisional (pending human verification) captures don't credit XP until approved — blueprint §6/§21.
      // ON CONFLICT DO NOTHING makes the INSERT idempotent so a network-timeout
      // retry that re-runs createCapturedCard cannot double-credit XP.
      if (created.status === 'final' && card.xpAwarded > 0) {
        const credited = await client.query(
          'INSERT INTO capture_xp_ledger (id, card_id, user_id, amount) VALUES ($1,$2,$3,$4) ON CONFLICT (card_id) DO NOTHING RETURNING id',
          [randomUUID(), created.id, card.userId, card.xpAwarded],
        );
        if (credited.rowCount) await client.query('UPDATE quest_users SET total_xp = total_xp + $2, updated_at = NOW() WHERE id = $1', [card.userId, card.xpAwarded]);
      }
      // Coins follow the same rule as XP: only credited once the capture is final.
      if (created.status === 'final' && card.coinsAwarded > 0) {
        await client.query(
          `INSERT INTO coin_ledger (id, ledger_key, user_id, card_id, amount, reason)
           VALUES ($1,$2,$3,$4,$5,'capture_reward')
           ON CONFLICT (ledger_key) DO NOTHING`,
          [randomUUID(), `capture:${created.id}`, card.userId, created.id, card.coinsAwarded],
        );
      }
      await client.query('COMMIT');
      return mapCapturedCard(created);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  async getCapturedCards(userId) { const { rows } = await this.pool.query('SELECT * FROM captured_cards WHERE user_id = $1 ORDER BY captured_at DESC', [userId]); return rows.map(mapCapturedCard); }
  async getCapturedCardById(userId, cardId) {
    const { rows } = await this.pool.query('SELECT * FROM captured_cards WHERE user_id = $1 AND id = $2', [userId, cardId]);
    return rows[0] ? mapCapturedCard(rows[0]) : null;
  }
  async getCapturedCardMedia(userId, cardId) {
    const { rows } = await this.pool.query(
      `SELECT m.* FROM capture_media m
       JOIN captured_cards c ON c.id = m.card_id
       WHERE m.user_id = $1 AND m.card_id = $2 AND c.user_id = $1`,
      [userId, cardId],
    );
    return rows[0] ? mapCaptureMedia(rows[0]) : null;
  }
  async getCapturedCardByCaptureId(userId, captureId) {
    const { rows } = await this.pool.query('SELECT * FROM captured_cards WHERE user_id = $1 AND capture_id = $2', [userId, captureId]);
    return rows[0] ? mapCapturedCard(rows[0]) : null;
  }
  async updateCapturedCard(userId, cardId, patch) {
    const { rows } = await this.pool.query(
      `UPDATE captured_cards
       SET card_title = COALESCE($3, card_title),
           notes = CASE WHEN $4::boolean THEN $5 ELSE notes END,
           updated_at = NOW()
       WHERE user_id = $1 AND id = $2
       RETURNING *`,
      [userId, cardId, patch.cardTitle ?? null, Object.prototype.hasOwnProperty.call(patch, 'notes'), patch.notes ?? null],
    );
    return rows[0] ? mapCapturedCard(rows[0]) : null;
  }
  /** Any provisional capture, across all players — an admin queue, not scoped to one user. */
  async getCapturedCardByIdAnyUser(cardId) {
    const { rows } = await this.pool.query('SELECT * FROM captured_cards WHERE id = $1', [cardId]);
    return rows[0] ? mapCapturedCard(rows[0]) : null;
  }
  async listCaptureReviewQueue() {
    const { rows } = await this.pool.query("SELECT * FROM captured_cards WHERE status='provisional' ORDER BY captured_at ASC LIMIT 200");
    return rows.map(mapCapturedCard);
  }
  /**
   * Admin approve/reject for a provisional capture — blueprint §21. Approve
   * finalizes the card and credits the XP/coins that were computed but
   * withheld at capture time (createCapturedCard only credits when status is
   * already 'final'); reject leaves them uncredited. Both are idempotent:
   * re-reviewing an already-decided card is a no-op that returns its current
   * state rather than erroring or double-crediting.
   */
  async reviewCapturedCard(cardId, { decision, reviewerId, reason }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query('SELECT * FROM captured_cards WHERE id = $1 FOR UPDATE', [cardId]);
      if (!current.rows[0]) { await client.query('ROLLBACK'); return null; }
      const card = current.rows[0];
      if (card.status !== 'provisional') {
        // Already decided — return as-is rather than re-applying a decision
        // (prevents a double-credit if an admin double-clicks Approve).
        await client.query('ROLLBACK');
        return mapCapturedCard(card);
      }

      const nextStatus = decision === 'approve' ? 'final' : 'rejected';
      const { rows } = await client.query(
        `UPDATE captured_cards SET status = $2, human_verified = $3, reviewed_at = NOW(),
           reviewed_by = $4, review_reason = $5, updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [cardId, nextStatus, decision === 'approve', reviewerId, reason || null],
      );
      const updated = rows[0];
      await client.query('UPDATE capture_media SET public_safe = $2, updated_at = NOW() WHERE card_id = $1', [cardId, decision === 'approve']);

      if (decision === 'approve') {
        if (Number(card.xp_awarded) > 0) {
          await client.query(
            'INSERT INTO capture_xp_ledger (id, card_id, user_id, amount) VALUES ($1,$2,$3,$4)',
            [randomUUID(), cardId, card.user_id, card.xp_awarded],
          );
          await client.query('UPDATE quest_users SET total_xp = total_xp + $2, updated_at = NOW() WHERE id = $1', [card.user_id, card.xp_awarded]);
        }
        if (Number(card.coins_awarded) > 0) {
          await client.query(
            `INSERT INTO coin_ledger (id, ledger_key, user_id, card_id, amount, reason)
             VALUES ($1,$2,$3,$4,$5,'capture_reward')
             ON CONFLICT (ledger_key) DO NOTHING`,
            [randomUUID(), `capture:${cardId}`, card.user_id, cardId, card.coins_awarded],
          );
        }
      }

      await client.query('COMMIT');
      return mapCapturedCard(updated);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  async getLastCaptureLocation(userId) {
    const { rows } = await this.pool.query(
      `SELECT gps_lat, gps_lng, captured_at FROM captured_cards
       WHERE user_id = $1 AND gps_lat IS NOT NULL AND gps_lng IS NOT NULL
       ORDER BY captured_at DESC LIMIT 1`,
      [userId],
    );
    if (!rows[0]) return null;
    return { gps: { lat: Number(rows[0].gps_lat), lng: Number(rows[0].gps_lng) }, capturedAt: rows[0].captured_at };
  }
  async hasCapturedSpecies(userId, speciesId) {
    const { rowCount } = await this.pool.query('SELECT 1 FROM captured_cards WHERE user_id = $1 AND species_id = $2 AND status <> $3 LIMIT 1', [userId, speciesId, 'rejected']);
    return rowCount > 0;
  }
  async hasAnyCaptureOfSpecies(speciesId) {
    const { rowCount } = await this.pool.query('SELECT 1 FROM captured_cards WHERE species_id = $1 AND status <> $2 LIMIT 1', [speciesId, 'rejected']);
    return rowCount > 0;
  }
  async getActiveRarityConfig() {
    const { rows } = await this.pool.query('SELECT version, weights, grade_bands AS "gradeBands" FROM rarity_weight_sets WHERE active = TRUE LIMIT 1');
    if (rows.length === 0) return null;
    return rows[0];
  }

  async getSpeciesDiscoveryStats(speciesId) {
    const [speciesCount, totalCount] = await Promise.all([
      this.pool.query("SELECT COUNT(*)::int AS count FROM captured_cards WHERE species_id = $1 AND status <> 'rejected'", [speciesId]),
      this.pool.query("SELECT COUNT(*)::int AS count FROM captured_cards WHERE status <> 'rejected'"),
    ]);
    return { speciesCount: speciesCount.rows[0].count, totalCount: totalCount.rows[0].count };
  }
  async hasSimilarCaptureImageHash(userId, hash, threshold = 0.95) {
    // 10-minute recent window is already small; exact match first for speed.
    if (threshold >= 1) {
      const { rowCount } = await this.pool.query(
        "SELECT 1 FROM captured_cards WHERE user_id = $1 AND image_hash = $2 AND captured_at >= NOW() - INTERVAL '10 minutes' LIMIT 1",
        [userId, hash],
      );
      return rowCount > 0;
    }
    const { rows } = await this.pool.query(
      "SELECT image_hash FROM captured_cards WHERE user_id = $1 AND image_hash IS NOT NULL AND captured_at >= NOW() - INTERVAL '10 minutes'",
      [userId],
    );
    return rows.some((row) => hashSimilarity(row.image_hash, hash) >= threshold);
  }
  async hasGlobalSimilarCaptureImageHash(userId, hash, threshold = 0.98) {
    // Exact lookup first (covers threshold = 1.0 and the common re-photo case).
    if (threshold >= 0.98) {
      const { rowCount } = await this.pool.query(
        'SELECT 1 FROM captured_cards WHERE user_id <> $1 AND image_hash = $2 LIMIT 1',
        [userId, hash],
      );
      if (rowCount > 0) return true;
    }
    // Bounded scan — prevents unbounded full-table read at scale.
    const { rows } = await this.pool.query(
      'SELECT image_hash FROM captured_cards WHERE user_id <> $1 AND image_hash IS NOT NULL ORDER BY captured_at DESC LIMIT 1000',
      [userId],
    );
    return rows.some((row) => hashSimilarity(row.image_hash, hash) >= threshold);
  }
  // --- World ---
  async listWorldHotspots({ category = null, bbox = null, limit = 200 } = {}) {
    const values = [];
    const where = ['enabled'];
    if (category) { values.push(category); where.push(`category = $${values.length}`); }
    if (bbox) {
      // Explicit min/max per axis, so a caller cannot accidentally filter
      // latitude by a longitude range.
      values.push(bbox.minLat, bbox.maxLat, bbox.minLng, bbox.maxLng);
      where.push(`lat BETWEEN $${values.length - 3} AND $${values.length - 2}`);
      where.push(`lng BETWEEN $${values.length - 1} AND $${values.length}`);
    }
    values.push(Math.min(Number(limit) || 200, 500));
    const { rows } = await this.pool.query(
      `SELECT * FROM world_hotspots WHERE ${where.join(' AND ')} ORDER BY name LIMIT $${values.length}`,
      values,
    );
    return rows.map(mapWorldHotspot);
  }

  // --- Community ---
  async createCommunityPost(post) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Sharing the same capture twice is a no-op that returns the original
      // post, so a double-tap on Share can't create duplicate feed entries.
      if (post.cardId) {
        const shareable = await client.query(
          "SELECT id FROM captured_cards WHERE id = $1 AND user_id = $2 AND status = 'final' AND COALESCE(rarity_stars, 0) > 1",
          [post.cardId, post.userId],
        );
        if (!shareable.rows[0]) throw conflict('capture_not_shareable');
        const existing = await client.query('SELECT id FROM community_posts WHERE card_id = $1', [post.cardId]);
        if (existing.rows[0]) {
          await client.query('COMMIT');
          return { post: await this.getCommunityPost(post.userId, existing.rows[0].id), created: false };
        }
      }
      const { rows } = await client.query(
        `INSERT INTO community_posts (id, user_id, card_id, caption, hashtags, place_label, gps_lat, gps_lng, visibility)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [randomUUID(), post.userId, post.cardId || null, post.caption || '', JSON.stringify(post.hashtags || []),
          post.placeLabel || null, post.gps?.lat ?? null, post.gps?.lng ?? null, post.visibility || 'public'],
      );
      if (post.cardId) await client.query('UPDATE capture_media SET public_safe = TRUE, updated_at = NOW() WHERE card_id = $1', [post.cardId]);
      await client.query('COMMIT');
      // Pass post.userId (the sharer / viewer) so viewerLiked is computed from
      // the correct perspective, not the captured card's owner (same person here,
      // but explicit is safer for future multi-share scenarios).
      return { post: await this.getCommunityPost(post.userId, rows[0].id), created: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listCommunityPosts(viewerId, { scope = 'public', limit = 50, authorUserId = null } = {}) {
    const values = [viewerId, Math.min(Number(limit) || 50, 100)];
    const visibleClause = communityVisibleClause('$1');
    const scopeClause = scope === 'friends'
      ? `AND p.user_id <> $1 AND EXISTS (
           SELECT 1 FROM community_friendships f
           WHERE f.status = 'accepted'
             AND ((f.requester_id = $1 AND f.addressee_id = p.user_id)
               OR (f.addressee_id = $1 AND f.requester_id = p.user_id))
         )`
      : "AND p.visibility = 'public'";
    const authorClause = authorUserId ? 'AND p.user_id = $3' : '';
    if (authorUserId) values.push(authorUserId);
    const { rows } = await this.pool.query(
      `${COMMUNITY_POST_SELECT} WHERE ${visibleClause} ${scopeClause} ${authorClause}
         AND (p.card_id IS NULL OR COALESCE(c.rarity_stars, 0) > 1)
       ORDER BY p.created_at DESC LIMIT $2`,
      values,
    );
    return rows.map(mapCommunityPost);
  }

  async getCommunityPost(viewerId, postId) {
    const { rows } = await this.pool.query(
      `${COMMUNITY_POST_SELECT} WHERE p.id = $2 AND ${communityVisibleClause('$1')} AND (p.card_id IS NULL OR COALESCE(c.rarity_stars, 0) > 1)`,
      [viewerId, postId],
    );
    return rows[0] ? mapCommunityPost(rows[0]) : null;
  }

  async listCommunityStories(viewerId, { limit = 20 } = {}) {
    const { rows } = await this.pool.query(
      `${COMMUNITY_POST_SELECT}
       WHERE ${communityVisibleClause('$1')}
         AND p.created_at >= NOW() - INTERVAL '24 hours'
         AND p.card_id IS NOT NULL
         AND COALESCE(c.rarity_stars, 0) > 1
       ORDER BY p.created_at DESC LIMIT $2`,
      [viewerId, Math.min(Number(limit) || 20, 50)],
    );
    return rows.map((row) => {
      const post = mapCommunityPost(row);
      return {
        id: post.id,
        postId: post.id,
        author: post.author,
        discovery: post.discovery,
        placeLabel: post.placeLabel,
        createdAt: post.createdAt,
        viewed: Boolean(row.story_viewed),
      };
    });
  }

  async markCommunityStoryViewed(viewerId, postId) {
    const post = await this.getCommunityPost(viewerId, postId);
    if (!post) return null;
    await this.pool.query(
      `INSERT INTO community_story_views (post_id, viewer_id, viewed_at)
       VALUES ($1,$2,NOW())
       ON CONFLICT (post_id, viewer_id) DO UPDATE SET viewed_at = EXCLUDED.viewed_at`,
      [postId, viewerId],
    );
    return { postId, viewerId, viewed: true };
  }
  async getCommunityPostMedia(viewerId, postId) {
    const { rows } = await this.pool.query(
      `SELECT m.* FROM community_posts p
       JOIN captured_cards c ON c.id = p.card_id
       JOIN capture_media m ON m.card_id = c.id
       WHERE p.id = $2 AND ${communityVisibleClause('$1')} AND c.status = 'final' AND m.public_safe = TRUE`,
      [viewerId, postId],
    );
    return rows[0] ? mapCaptureMedia(rows[0]) : null;
  }

  async setCommunityPostLike(userId, postId, liked) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const post = await client.query(`SELECT id FROM community_posts p WHERE id = $2 AND ${communityVisibleClause('$1')} FOR UPDATE`, [userId, postId]);
      if (!post.rows[0]) { await client.query('ROLLBACK'); return null; }
      // Counters are recomputed from the like rows rather than incremented, so
      // repeated likes/unlikes stay consistent under concurrency.
      if (liked) {
        await client.query('INSERT INTO community_post_likes (post_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [postId, userId]);
      } else {
        await client.query('DELETE FROM community_post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      }
      await client.query('UPDATE community_posts SET like_count = (SELECT COUNT(*) FROM community_post_likes WHERE post_id = $1), updated_at = NOW() WHERE id = $1', [postId]);
      await client.query('COMMIT');
      return this.getCommunityPost(userId, postId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createCommunityComment(userId, postId, body) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const post = await client.query(`SELECT id FROM community_posts p WHERE id = $2 AND ${communityVisibleClause('$1')} FOR UPDATE`, [userId, postId]);
      if (!post.rows[0]) { await client.query('ROLLBACK'); return null; }
      const { rows } = await client.query(
        'INSERT INTO community_post_comments (id, post_id, user_id, body) VALUES ($1,$2,$3,$4) RETURNING *',
        [randomUUID(), postId, userId, body],
      );
      await client.query('UPDATE community_posts SET comment_count = (SELECT COUNT(*) FROM community_post_comments WHERE post_id = $1), updated_at = NOW() WHERE id = $1', [postId]);
      await client.query('COMMIT');
      return mapCommunityComment({ ...rows[0], display_name: (await this.getUser(userId))?.displayName });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listCommunityComments(userId, postId) {
    const { rows } = await this.pool.query(
      `SELECT c.*, u.display_name FROM community_post_comments c
       JOIN quest_users u ON u.id = c.user_id
       JOIN community_posts p ON p.id = c.post_id
       WHERE c.post_id = $2 AND ${communityVisibleClause('$1')}
       ORDER BY c.created_at ASC LIMIT 200`,
      [userId, postId],
    );
    if (rows.length === 0) {
      const post = await this.getCommunityPost(userId, postId);
      if (!post) return null;
    }
    return rows.map(mapCommunityComment);
  }

  async reportCommunityPost(userId, postId, { reason, details = '' }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const post = await client.query(`SELECT id FROM community_posts p WHERE id = $2 AND ${communityVisibleClause('$1')} FOR UPDATE`, [userId, postId]);
      if (!post.rows[0]) { await client.query('ROLLBACK'); return null; }
      const { rows } = await client.query(
        `INSERT INTO community_post_reports (id, post_id, user_id, reason, details)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (post_id, user_id) DO UPDATE SET post_id = EXCLUDED.post_id
         RETURNING *, (xmax = 0) AS inserted`,
        [randomUUID(), postId, userId, reason, details],
      );
      await client.query('COMMIT');
      return { ...mapCommunityReport(rows[0]), created: Boolean(rows[0].inserted) };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteCommunityPost(userId, postId) {
    // Ownership is part of the predicate, so another user's post can never be
    // deleted even if the id is guessed.
    const { rowCount } = await this.pool.query('DELETE FROM community_posts WHERE id = $1 AND user_id = $2', [postId, userId]);
    return rowCount > 0;
  }

  async listFriends(userId) {
    const { rows } = await this.pool.query(
      `SELECT f.status,
              f.requester_id = $1 AS outgoing,
              u.id, u.display_name, u.total_xp, u.streak_days
       FROM community_friendships f
       JOIN quest_users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
       WHERE (f.requester_id = $1 OR f.addressee_id = $1) AND f.status <> 'blocked'
       ORDER BY u.total_xp DESC LIMIT 200`,
      [userId],
    );
    return rows.map((row) => ({
      userId: row.id,
      displayName: row.display_name,
      totalXp: Number(row.total_xp),
      streakDays: Number(row.streak_days),
      status: row.status,
      direction: row.outgoing ? 'outgoing' : 'incoming',
    }));
  }

  async getCommunityProfile(viewerId, profileUserId) {
    const [aggregate, recentPosts] = await Promise.all([
      this.pool.query(
        `SELECT u.id, u.display_name, u.total_xp, u.streak_days, u.primary_path,
                COUNT(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL AND (p.card_id IS NULL OR COALESCE(c.rarity_stars, 0) > 1))::int AS post_count,
                COUNT(DISTINCT followers.follower_id)::int AS follower_count,
                COUNT(DISTINCT following.following_id)::int AS following_count,
                COUNT(DISTINCT f.requester_id || ':' || f.addressee_id)::int AS friend_count,
                EXISTS (SELECT 1 FROM community_follows vf WHERE vf.follower_id = $1 AND vf.following_id = u.id) AS viewer_following,
                EXISTS (
                  SELECT 1 FROM community_friendships vf
                  WHERE vf.status = 'accepted'
                    AND ((vf.requester_id = $1 AND vf.addressee_id = u.id)
                      OR (vf.addressee_id = $1 AND vf.requester_id = u.id))
                ) AS viewer_friend
         FROM quest_users u
         LEFT JOIN community_posts p ON p.user_id = u.id AND ${communityVisibleClause('$1')}
         LEFT JOIN captured_cards c ON c.id = p.card_id
         LEFT JOIN community_follows followers ON followers.following_id = u.id
         LEFT JOIN community_follows following ON following.follower_id = u.id
         LEFT JOIN community_friendships f ON f.status = 'accepted' AND (f.requester_id = u.id OR f.addressee_id = u.id)
         WHERE u.id = $2
         GROUP BY u.id`,
        [viewerId, profileUserId],
      ),
      // The author's recent posts are independent of the aggregate above, so
      // fetch them concurrently and only for this author instead of pulling
      // the whole public feed and filtering.
      this.listCommunityPosts(viewerId, { scope: 'public', limit: 9, authorUserId: profileUserId }),
    ]);
    if (!aggregate.rows[0]) return null;
    return mapCommunityProfile(aggregate.rows[0], viewerId, recentPosts);
  }

  async setCommunityFollow(viewerId, profileUserId, following) {
    if (viewerId === profileUserId) return null;
    const exists = await this.pool.query('SELECT id FROM quest_users WHERE id = $1', [profileUserId]);
    if (!exists.rows[0]) return null;
    if (following) {
      await this.pool.query(
        'INSERT INTO community_follows (follower_id, following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [viewerId, profileUserId],
      );
    } else {
      await this.pool.query('DELETE FROM community_follows WHERE follower_id = $1 AND following_id = $2', [viewerId, profileUserId]);
    }
    return this.getCommunityProfile(viewerId, profileUserId);
  }

  // Dev-only community seed (see api/server.js — invoked when NODE_ENV is
  // development). Idempotent: users/cards/posts are inserted once with fixed
  // ids, while friendships/likes/follows are ensured per viewer on every call.
  async seedDemoSocial(viewerId) {
    if (!viewerId) return;
    const now = Date.now();
    const hoursAgo = (hours) => new Date(now - hours * 3600_000).toISOString();
    const postId = (cardId) => cardId.replace('20000000', '30000000');

    const demoUsers = [
      { id: '10000000-0000-4000-8000-000000000101', displayName: 'Mira Fern', totalXp: 2840, streakDays: 12, primaryPath: 'Discovery' },
      { id: '10000000-0000-4000-8000-000000000102', displayName: 'Arjun Vale', totalXp: 760, streakDays: 4, primaryPath: 'Body' },
      { id: '10000000-0000-4000-8000-000000000103', displayName: 'Nila Skies', totalXp: 5320, streakDays: 21, primaryPath: 'Discovery' },
      { id: '10000000-0000-4000-8000-000000000104', displayName: 'Lyra Moonweaver', totalXp: 9840, streakDays: 34, primaryPath: 'Mind' },
      { id: '10000000-0000-4000-8000-000000000105', displayName: 'Theron Ironheart', totalXp: 1640, streakDays: 9, primaryPath: 'Body' },
      { id: '10000000-0000-4000-8000-000000000106', displayName: 'Aria Sunwalker', totalXp: 305, streakDays: 1, primaryPath: 'Mind' },
    ];
    // Card rows: species names/categories are copied from the catalog so the
    // seed never depends on catalog ordering at runtime.
    const demoCards = [
      { id: '20000000-0000-4000-8000-000000000201', userId: demoUsers[0].id, speciesId: 'water-waterfall', itemName: 'Forest Waterfall', category: 'Landscape', cardTitle: 'Hidden Monsoon Falls', rarityTier: 'A', rarityStars: 4, description: 'A trail-side cascade running full after the rain.', gpsLat: 13.0356, gpsLng: 77.5913, caption: 'Mira found a waterfall trail after the rain cleared.', placeLabel: 'Hebbal morning loop', hashtags: ['#waterfall', '#afterrain'], hoursAgo: 6 },
      { id: '20000000-0000-4000-8000-000000000202', userId: demoUsers[1].id, speciesId: 'sky-indian-roller', itemName: 'Indian Roller', category: 'Fauna', cardTitle: 'Blue Flash Over Lalbagh', rarityTier: 'B', rarityStars: 3, description: 'A roller perched on the old rain trees at dusk.', gpsLat: 12.9507, gpsLng: 77.5848, caption: 'Arjun caught the blue wing flash right before sunset.', placeLabel: 'Lalbagh Botanical Garden', hashtags: ['#birding', '#lalbagh'], hoursAgo: 9 },
      { id: '20000000-0000-4000-8000-000000000203', userId: demoUsers[2].id, speciesId: 'fire-rainbow', itemName: 'Rainbow', category: 'Landscape', cardTitle: 'Double Rainbow Break', rarityTier: 'S', rarityStars: 5, description: 'Two full arcs over the valley after a squall.', gpsLat: 13.3702, gpsLng: 77.6835, caption: 'Nila found a rare sky card on the walk home.', placeLabel: 'Nandi Hills outlook', hashtags: ['#rare', '#skycard'], hoursAgo: 26 },
      { id: '20000000-0000-4000-8000-000000000204', userId: demoUsers[0].id, speciesId: 'earth-domestic-cat', itemName: 'Domestic Cat', category: 'Fauna', cardTitle: 'Canteen Cat Watch', rarityTier: 'D', rarityStars: 2, description: 'A very serious snack inspector on the lane.', gpsLat: 12.9718, gpsLng: 77.6412, caption: 'Daily quest proof: a very serious snack inspector.', placeLabel: 'Neighborhood lane', hashtags: ['#dailyquest', '#citynature'], hoursAgo: 30 },
      { id: '20000000-0000-4000-8000-000000000205', userId: demoUsers[3].id, speciesId: 'fire-sunrise', itemName: 'Sunrise', category: 'Landscape', cardTitle: 'First Light Over the Escarpment', rarityTier: 'A', rarityStars: 4, description: 'The cloud layer glowed gold for about five minutes.', gpsLat: 13.3702, gpsLng: 77.6835, caption: 'Worth the 4 a.m. alarm — every time.', placeLabel: 'Nandi Hills summit', hashtags: ['#sunrise', '#goldenhour'], hoursAgo: 3 },
      { id: '20000000-0000-4000-8000-000000000206', userId: demoUsers[4].id, speciesId: 'sky-kingfisher', itemName: 'Common Kingfisher', category: 'Fauna', cardTitle: 'Kingfisher on the Reeds', rarityTier: 'C', rarityStars: 2, description: 'Waited forty minutes; it posed for three seconds.', gpsLat: 13.0033, gpsLng: 77.5806, caption: 'Forty patient minutes for one perfect frame.', placeLabel: 'Sankey Tank', hashtags: ['#birding', '#patience'], hoursAgo: 12 },
      { id: '20000000-0000-4000-8000-000000000207', userId: demoUsers[3].id, speciesId: 'water-lake', itemName: 'Still Lake', category: 'Landscape', cardTitle: 'Mirror at Ulsoor', rarityTier: 'B', rarityStars: 3, description: 'Glass-calm water doubled the evening sky.', gpsLat: 12.9833, gpsLng: 77.6157, caption: 'The lake doubled the sky tonight.', placeLabel: 'Ulsoor Lake', hashtags: ['#lake', '#evening'], hoursAgo: 22 },
      { id: '20000000-0000-4000-8000-000000000208', userId: demoUsers[5].id, speciesId: 'grass-fern', itemName: 'Fiddlehead Fern', category: 'Flora', cardTitle: 'Unfurling Fern', rarityTier: 'C', rarityStars: 2, description: 'A young frond unfurling in the understory.', gpsLat: 12.9763, gpsLng: 77.5924, caption: 'My first fern find — tiny and perfect.', placeLabel: 'Cubbon Park', hashtags: ['#plants', '#firstfind'], hoursAgo: 7 },
    ];

    const seeded = await this.pool.query('SELECT 1 FROM quest_users WHERE id = $1 LIMIT 1', [demoUsers[0].id]);
    if (seeded.rowCount === 0) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        for (const user of demoUsers) {
          await client.query(
            `INSERT INTO quest_users (id, display_name, timezone, total_xp, streak_days, last_streak_period, primary_path, onboarding_completed_at)
             VALUES ($1,$2,'Asia/Kolkata',$3,$4,to_char(NOW() - INTERVAL '1 day', 'YYYY-MM-DD'),$5,NOW() - INTERVAL '30 days')
             ON CONFLICT (id) DO NOTHING`,
            [user.id, user.displayName, user.totalXp, user.streakDays, user.primaryPath],
          );
        }
        const mediaData = demoCaptureMediaData();
        for (const card of demoCards) {
          await client.query(
            `INSERT INTO captured_cards
              (id, user_id, item_name, category, card_title, rarity_tier, rarity_score, description, status,
               species_id, rarity_stars, rarity_grade, gps_lat, gps_lng, captured_at, server_received_at,
               anti_cheat_verdict, anti_cheat_detail, image_hash, rarity_weight_set_version, rarity_factor_breakdown)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'final',$9,$10,$11,$12,$13,$14,$14,'demo_seed','[]','demo-seed',1,'{}')
             ON CONFLICT (id) DO NOTHING`,
            [card.id, card.userId, card.itemName, card.category, card.cardTitle, card.rarityTier,
              (card.rarityStars / 5).toFixed(4), card.description, card.speciesId, card.rarityStars, card.rarityTier,
              card.gpsLat, card.gpsLng, hoursAgo(card.hoursAgo)],
          );
          await client.query(
            `INSERT INTO capture_media (card_id, user_id, content_type, media_data, public_safe)
             VALUES ($1,$2,'image/png',$3,TRUE)
             ON CONFLICT (card_id) DO NOTHING`,
            [card.id, card.userId, mediaData],
          );
          await client.query(
            `INSERT INTO community_posts (id, user_id, card_id, caption, hashtags, place_label, gps_lat, gps_lng, visibility)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'public')
             ON CONFLICT (id) DO NOTHING`,
            [card.id.replace('20000000', '30000000'), card.userId, card.id, card.caption, JSON.stringify(card.hashtags),
              card.placeLabel, card.gpsLat, card.gpsLng],
          );
        }
        const likes = [
          { post: postId(demoCards[0].id), user: demoUsers[1].id },
          { post: postId(demoCards[2].id), user: demoUsers[0].id },
          { post: postId(demoCards[2].id), user: demoUsers[1].id },
          { post: postId(demoCards[2].id), user: demoUsers[4].id },
          { post: postId(demoCards[4].id), user: demoUsers[5].id },
          { post: postId(demoCards[5].id), user: demoUsers[3].id },
          { post: postId(demoCards[6].id), user: demoUsers[0].id },
          { post: postId(demoCards[7].id), user: demoUsers[4].id },
        ];
        for (const like of likes) {
          await client.query(
            'INSERT INTO community_post_likes (post_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [like.post, like.user],
          );
        }
        const comments = [
          { post: postId(demoCards[0].id), user: demoUsers[2].id, body: 'This trail deserves a spot on the map.', hoursAgo: 5.5 },
          { post: postId(demoCards[1].id), user: demoUsers[0].id, body: 'Adding this to tomorrow morning route.', hoursAgo: 8.5 },
          { post: postId(demoCards[2].id), user: demoUsers[1].id, body: 'S rank deserved!', hoursAgo: 25 },
          { post: postId(demoCards[4].id), user: demoUsers[2].id, body: 'The colours in this are unreal.', hoursAgo: 2.5 },
          { post: postId(demoCards[6].id), user: demoUsers[4].id, body: 'Great mirror shot.', hoursAgo: 21 },
        ];
        for (const comment of comments) {
          await client.query(
            `INSERT INTO community_post_comments (id, post_id, user_id, body, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4) ON CONFLICT DO NOTHING`,
            [comment.post, comment.user, comment.body, hoursAgo(comment.hoursAgo)],
          );
        }
        // Demo users follow one another so profiles have real follower counts.
        const follows = [
          [demoUsers[2].id, demoUsers[3].id],
          [demoUsers[3].id, demoUsers[2].id],
          [demoUsers[0].id, demoUsers[3].id],
          [demoUsers[4].id, demoUsers[0].id],
          [demoUsers[5].id, demoUsers[3].id],
        ];
        for (const [followerId, followingId] of follows) {
          await client.query(
            'INSERT INTO community_follows (follower_id, following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [followerId, followingId],
          );
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    // Per-viewer wiring: friendships and a light touch of likes/follows so a
    // brand-new dev account sees a populated friends list and community.
    for (const user of demoUsers) {
      await this.pool.query(
        `INSERT INTO community_friendships (requester_id, addressee_id, status)
         VALUES ($1,$2,'accepted') ON CONFLICT DO NOTHING`,
        [user.id, viewerId],
      );
    }
    const viewerLiked = [postId(demoCards[2].id), postId(demoCards[5].id)];
    for (const post of viewerLiked) {
      await this.pool.query('INSERT INTO community_post_likes (post_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [post, viewerId]);
    }
    for (const followingId of [demoUsers[0].id, demoUsers[3].id]) {
      if (followingId !== viewerId) {
        await this.pool.query('INSERT INTO community_follows (follower_id, following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [viewerId, followingId]);
      }
    }
  }

  async getCoinBalance(userId) {
    const { rows } = await this.pool.query('SELECT COALESCE(SUM(amount), 0)::int AS balance FROM coin_ledger WHERE user_id = $1', [userId]);
    return rows[0].balance;
  }
  async createFeedEntry(entry) {
    const { rows } = await this.pool.query(`INSERT INTO quest_feed_entries
      (id,user_id,assignment_id,submission_id,quest_name,display_name,xp_earned,rank_title,image_ref,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (submission_id) DO UPDATE SET submission_id = EXCLUDED.submission_id RETURNING *`,
    [randomUUID(), entry.userId, entry.assignmentId, entry.submissionId, entry.questName, entry.displayName, entry.xpEarned, entry.rankTitle, entry.imageRef, entry.createdAt]);
    return mapFeedEntry(rows[0]);
  }
  async listFeed() {
    const { rows } = await this.pool.query('SELECT * FROM quest_feed_entries ORDER BY created_at DESC LIMIT 100');
    return rows.map(mapFeedEntry);
  }
  async listLeaderboard(userId) {
    const { rows } = await this.pool.query(`SELECT id, display_name, total_xp,
      RANK() OVER (ORDER BY total_xp DESC) AS position,
      PERCENT_RANK() OVER (ORDER BY total_xp DESC) * 100 AS percentile
      FROM quest_users ORDER BY total_xp DESC LIMIT 100`);
    return rows.map((row) => ({ position: Number(row.position), userId: row.id, displayName: row.display_name, totalXp: Number(row.total_xp), rankTitle: rankTitleForPercentile(Number(row.percentile)), isCurrentUser: row.id === userId }));
  }
  async listRewards(userId) {
    const { rows } = await this.pool.query(`SELECT r.level,r.reward_type,r.reward_key,r.amount,r.label,u.status,u.unlocked_at,u.claimed_at
      FROM quest_user_rewards u JOIN quest_level_rewards r ON r.level = u.level WHERE u.user_id = $1 ORDER BY r.level`, [userId]);
    return rows.map(mapReward);
  }
  async claimRewards(userId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM quest_users WHERE id=$1 FOR UPDATE', [userId]);
      const { rows } = await client.query(`UPDATE quest_user_rewards u SET status='claimed', claimed_at=NOW()
        FROM quest_level_rewards r WHERE u.level=r.level AND u.user_id=$1 AND u.status='claimable'
        RETURNING r.level,r.reward_type,r.reward_key,r.amount,r.label,u.status,u.unlocked_at,u.claimed_at`, [userId]);
      for (const reward of rows) {
        if (reward.reward_type === 'xp') {
          const credited = await client.query(`INSERT INTO quest_xp_ledger
            (id,ledger_key,user_id,amount,reason) VALUES ($1,$2,$3,$4,'level_reward')
            ON CONFLICT (ledger_key) DO NOTHING RETURNING amount`,
          [randomUUID(), `${userId}:level-reward:${reward.level}`, userId, reward.amount]);
          if (credited.rowCount) await client.query('UPDATE quest_users SET total_xp=total_xp+$2,updated_at=NOW() WHERE id=$1', [userId, reward.amount]);
        } else {
          await client.query(`INSERT INTO quest_inventory (user_id,item_key,item_type,quantity,label)
            VALUES ($1,$2,$3,$4,$5)
            ON CONFLICT (user_id,item_key) DO UPDATE SET quantity=quest_inventory.quantity+EXCLUDED.quantity`,
          [userId, reward.reward_key, reward.reward_type, reward.amount, reward.label]);
        }
      }
      await client.query('COMMIT');
      return rows.map(mapReward);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  async createNotification(notification) {
    const { rows } = await this.pool.query(`INSERT INTO quest_notifications (id,user_id,kind,title,body,dedupe_key) VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (user_id,dedupe_key) WHERE dedupe_key IS NOT NULL DO UPDATE SET dedupe_key=EXCLUDED.dedupe_key RETURNING *`,
      [randomUUID(), notification.userId, notification.kind, notification.title, notification.body, notification.dedupeKey || null]);
    return mapNotification(rows[0]);
  }
  async listNotifications(userId) {
    const { rows } = await this.pool.query('SELECT * FROM quest_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100', [userId]);
    return rows.map(mapNotification);
  }
  async markNotificationRead(userId, notificationId) {
    const { rows } = await this.pool.query('UPDATE quest_notifications SET read_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *', [notificationId, userId]);
    return rows[0] ? mapNotification(rows[0]) : null;
  }
  async runIdempotent(userId, operation, key, callback) {
    await this.pool.query(`DELETE FROM quest_idempotency_keys
      WHERE user_id = $1 AND (
        (status = 'processing' AND created_at < NOW() - INTERVAL '2 minutes')
        OR (status = 'completed' AND completed_at < NOW() - INTERVAL '7 days')
      )`, [userId]);
    const existing = await this.pool.query('SELECT status, response_body FROM quest_idempotency_keys WHERE user_id = $1 AND operation = $2 AND key = $3', [userId, operation, key]);
    if (existing.rows[0]?.status === 'completed') return existing.rows[0].response_body;
    if (existing.rows[0]) throw conflict('request_in_progress');
    const inserted = await this.pool.query(`INSERT INTO quest_idempotency_keys (user_id, operation, key, status) VALUES ($1,$2,$3,'processing') ON CONFLICT DO NOTHING RETURNING key`, [userId, operation, key]);
    if (!inserted.rowCount) throw conflict('request_in_progress');
    try {
      const value = await callback();
      await this.pool.query(`UPDATE quest_idempotency_keys SET status = 'completed', response_body = $4, completed_at = NOW() WHERE user_id = $1 AND operation = $2 AND key = $3`, [userId, operation, key, JSON.stringify(value)]);
      return value;
    } catch (error) {
      await this.pool.query('DELETE FROM quest_idempotency_keys WHERE user_id = $1 AND operation = $2 AND key = $3 AND status = $4', [userId, operation, key, 'processing']);
      throw error;
    }
  }

  // Store & Inventory
  async getStoreCatalog() {
    const { rows } = await this.pool.query('SELECT item_id as "itemId", name, type, price_coins as "priceCoins" FROM store_catalog ORDER BY price_coins ASC');
    return rows;
  }

  async purchaseStoreItem(userId, itemId, idempotencyKey) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM quest_users WHERE id = $1 FOR UPDATE', [userId]);
      const replay = await client.query(
        `SELECT status, response_body FROM quest_idempotency_keys
         WHERE user_id = $1 AND operation = 'store_purchase' AND key = $2 FOR UPDATE`,
        [userId, idempotencyKey],
      );
      if (replay.rows[0]?.status === 'completed') {
        const response = replay.rows[0].response_body;
        if (response.itemId !== itemId) throw conflict('idempotency_key_reused');
        await client.query('COMMIT');
        return response;
      }
      await client.query(
        `INSERT INTO quest_idempotency_keys (user_id, operation, key, status)
         VALUES ($1, 'store_purchase', $2, 'processing')`,
        [userId, idempotencyKey],
      );
      const item = await client.query('SELECT price_coins FROM store_catalog WHERE item_id = $1', [itemId]);
      if (item.rows.length === 0) throw new Error('Item not found');

      const price = Number(item.rows[0].price_coins);
      const balance = await client.query('SELECT COALESCE(SUM(amount), 0)::int AS balance FROM coin_ledger WHERE user_id = $1', [userId]);
      const balanceBefore = Number(balance.rows[0]?.balance || 0);
      if (balanceBefore < price) throw new Error('INSUFFICIENT_FUNDS');

      await client.query(`INSERT INTO coin_ledger (id, ledger_key, user_id, amount, reason)
        VALUES ($1, $2, $3, $4, 'store_purchase')`,
      [randomUUID(), `store-purchase:${userId}:${idempotencyKey}`, userId, -price]);

      await client.query(`INSERT INTO inventory (user_id, item_id, quantity) VALUES ($1, $2, 1) ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = inventory.quantity + 1, updated_at = NOW()`,
        [userId, itemId]);

      const response = { success: true, itemId, priceCoins: price, balance: balanceBefore - price };
      await client.query(
        `UPDATE quest_idempotency_keys SET status = 'completed', response_body = $3, completed_at = NOW()
         WHERE user_id = $1 AND operation = 'store_purchase' AND key = $2`,
        [userId, idempotencyKey, JSON.stringify(response)],
      );
      await client.query('COMMIT');
      return response;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async consumeInventoryItem(userId, itemId) {
    const { rows } = await this.pool.query(`UPDATE inventory SET quantity = quantity - 1, updated_at = NOW() WHERE user_id = $1 AND item_id = $2 AND quantity > 0 RETURNING id`, [userId, itemId]);
    return rows.length > 0;
  }

  async grantRewards(userId, loot) {
    if (loot.coins > 0) {
      await this.pool.query(`INSERT INTO coin_ledger (id, ledger_key, user_id, amount, reason) VALUES ($1, $2, $3, $4, 'chest_loot')`, 
        [randomUUID(), `loot:${Date.now()}`, userId, loot.coins]);
    }
  }

  async openChest(userId, chestId, regionId, idempotencyKey, loot) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM quest_users WHERE id = $1 FOR UPDATE', [userId]);
      const replay = await client.query(
        `SELECT status, response_body FROM quest_idempotency_keys
         WHERE user_id = $1 AND operation = 'chest_open' AND key = $2 FOR UPDATE`,
        [userId, idempotencyKey],
      );
      if (replay.rows[0]?.status === 'completed') {
        const response = replay.rows[0].response_body;
        if (response.chestId !== chestId || (response.regionId || null) !== (regionId || null)) throw conflict('idempotency_key_reused');
        await client.query('COMMIT');
        return { ...response, _replayed: true };
      }
      await client.query(
        `INSERT INTO quest_idempotency_keys (user_id, operation, key, status)
         VALUES ($1, 'chest_open', $2, 'processing')`,
        [userId, idempotencyKey],
      );

      const consumed = await client.query(
        `UPDATE inventory SET quantity = quantity - 1, updated_at = NOW()
         WHERE user_id = $1 AND item_id = $2 AND quantity > 0 RETURNING quantity`,
        [userId, chestId],
      );
      if (!consumed.rowCount) throw new Error('Chest not found in inventory');

      if (Number(loot.coins) > 0) {
        await client.query(
          `INSERT INTO coin_ledger (id, ledger_key, user_id, amount, reason)
           VALUES ($1, $2, $3, $4, 'chest_loot')`,
          [randomUUID(), `chest-open:${userId}:${idempotencyKey}:coins`, userId, Number(loot.coins)],
        );
      }

      let event = null;
      if (chestId.startsWith('event_chest_') && regionId) {
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${regionId}:${chestId}`]);
        let eventRow = await client.query(
          `SELECT id, counter, threshold, state FROM regional_events
           WHERE region_id = $1 AND chest_id = $2 AND state = 'accumulating' FOR UPDATE`,
          [regionId, chestId],
        );
        if (!eventRow.rowCount) {
          eventRow = await client.query(
            `INSERT INTO regional_events (region_id, chest_id) VALUES ($1, $2)
             RETURNING id, counter, threshold, state`,
            [regionId, chestId],
          );
        }
        const current = eventRow.rows[0];
        const contribution = await client.query(
          `INSERT INTO regional_event_contributors (event_id, user_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING RETURNING user_id`,
          [current.id, userId],
        );
        let counter = Number(current.counter);
        let justActivated = false;
        if (contribution.rowCount) {
          const updated = await client.query(
            'UPDATE regional_events SET counter = counter + 1, updated_at = NOW() WHERE id = $1 RETURNING counter, threshold',
            [current.id],
          );
          counter = Number(updated.rows[0].counter);
          if (counter >= Number(updated.rows[0].threshold)) {
            await client.query("UPDATE regional_events SET state = 'active', active_until = NOW() + INTERVAL '24 hours' WHERE id = $1", [current.id]);
            justActivated = true;
          }
        }
        event = { eventId: current.id, counter, threshold: Number(current.threshold), justActivated };
      }

      const response = { chestId, regionId: regionId || null, loot, event };
      await client.query(
        `UPDATE quest_idempotency_keys SET status = 'completed', response_body = $3, completed_at = NOW()
         WHERE user_id = $1 AND operation = 'chest_open' AND key = $2`,
        [userId, idempotencyKey, JSON.stringify(response)],
      );
      await client.query('COMMIT');
      return response;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async contributeToRegionalEvent(userId, chestId, regionId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      let event = await client.query(`SELECT id, counter, threshold, state FROM regional_events WHERE region_id = $1 AND chest_id = $2 AND state = 'accumulating' FOR UPDATE`, [regionId, chestId]);
      
      if (event.rows.length === 0) {
        event = await client.query(`INSERT INTO regional_events (region_id, chest_id) VALUES ($1, $2) RETURNING id, counter, threshold, state`, [regionId, chestId]);
      }
      
      const evt = event.rows[0];
      let justActivated = false;

      // Try inserting into contributors (to enforce one per user)
      const contrib = await client.query(`INSERT INTO regional_event_contributors (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING user_id`, [evt.id, userId]);
      
      if (contrib.rows.length > 0) {
        // User actually contributed
        const update = await client.query(`UPDATE regional_events SET counter = counter + 1, updated_at = NOW() WHERE id = $1 RETURNING counter, threshold`, [evt.id]);
        if (update.rows[0].counter >= update.rows[0].threshold) {
          await client.query(`UPDATE regional_events SET state = 'active', active_until = NOW() + INTERVAL '24 hours' WHERE id = $1`, [evt.id]);
          justActivated = true;
        }
        evt.counter = update.rows[0].counter;
      }

      await client.query('COMMIT');
      return { eventId: evt.id, counter: evt.counter, threshold: evt.threshold, justActivated };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getRegionalEventStatus(regionId) {
    const { rows } = await this.pool.query(`SELECT chest_id, counter, threshold, state, active_until FROM regional_events WHERE region_id = $1 ORDER BY created_at DESC LIMIT 10`, [regionId]);
    return rows;
  }
}

// Joins the author and the shared capture so a feed row is renderable in one
// query. `viewer_liked` is parameterised on $1 (the viewer).
const COMMUNITY_POST_SELECT = `
  SELECT p.*,
         u.display_name, u.total_xp,
         c.item_name, c.card_title, c.rarity_tier, c.rarity_grade, c.rarity_stars,
         c.species_id, c.image_ref, c.captured_at,
         EXISTS (SELECT 1 FROM community_post_likes l WHERE l.post_id = p.id AND l.user_id = $1) AS viewer_liked,
         EXISTS (SELECT 1 FROM community_story_views sv WHERE sv.post_id = p.id AND sv.viewer_id = $1) AS story_viewed
  FROM community_posts p
  JOIN quest_users u ON u.id = p.user_id
  LEFT JOIN captured_cards c ON c.id = p.card_id`;

function mapCommunityPost(row) {
  return {
    id: row.id,
    userId: row.user_id,
    author: {
      userId: row.user_id,
      displayName: row.display_name,
      totalXp: Number(row.total_xp),
      rankTitle: progressionEngine.rankTitleForXp(Number(row.total_xp)),
    },
    cardId: row.card_id,
    discovery: row.card_id
      ? {
        itemName: row.item_name,
        cardTitle: row.card_title,
        rarityTier: row.rarity_tier,
        rarityGrade: row.rarity_grade,
        rarityStars: row.rarity_stars == null ? null : Number(row.rarity_stars),
        speciesId: row.species_id,
        imageRef: row.image_ref ? `/api/v1/community/posts/${row.id}/media` : null,
        capturedAt: row.captured_at,
      }
      : null,
    caption: row.caption,
    hashtags: row.hashtags || [],
    placeLabel: row.place_label,
    gps: row.gps_lat != null ? { lat: Number(row.gps_lat), lng: Number(row.gps_lng) } : null,
    visibility: row.visibility,
    likeCount: Number(row.like_count),
    commentCount: Number(row.comment_count),
    viewerLiked: Boolean(row.viewer_liked),
    createdAt: row.created_at,
  };
}

function mapCaptureMedia(row) {
  return {
    cardId: row.card_id,
    userId: row.user_id,
    contentType: row.content_type,
    mediaData: row.media_data,
    storageRef: row.storage_ref,
    publicSafe: row.public_safe,
  };
}

function mapWorldHotspot(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    // Numeric columns arrive as strings from pg; coerce so the client never
    // does arithmetic on a string coordinate.
    gps: { lat: Number(row.lat), lng: Number(row.lng) },
    region: row.region,
    featuredSpecies: row.featured_species || [],
    isDemo: row.is_demo,
  };
}

function mapCommunityComment(row) {
  return { id: row.id, postId: row.post_id, userId: row.user_id, displayName: row.display_name, body: row.body, createdAt: row.created_at };
}
function mapCommunityReport(row) { return { id: row.id, postId: row.post_id, userId: row.user_id, reason: row.reason, details: row.details || '', status: row.status, createdAt: row.created_at }; }
function mapAccountDeletionRequest(row) { return { id: row.id, userId: row.user_id, reason: row.reason, status: row.status, requestedAt: row.requested_at, retentionUntil: row.retention_until }; }

function mapCommunityProfile(row, viewerId, recentPosts = []) {
  const totalXp = Number(row.total_xp);
  return {
    userId: row.id,
    displayName: row.display_name,
    totalXp,
    streakDays: Number(row.streak_days),
    rankTitle: progressionEngine.rankTitleForXp(totalXp),
    primaryPath: row.primary_path ?? null,
    stats: {
      posts: Number(row.post_count || 0),
      followers: Number(row.follower_count || 0),
      following: Number(row.following_count || 0),
      friends: Number(row.friend_count || 0),
    },
    viewer: {
      isSelf: row.id === viewerId,
      isFollowing: Boolean(row.viewer_following),
      isFriend: Boolean(row.viewer_friend),
    },
    recentPosts,
  };
}

function mapUser(row) { return { id: row.id, displayName: row.display_name, timezone: row.timezone, totalXp: Number(row.total_xp), streakDays: Number(row.streak_days), lastStreakPeriod: row.last_streak_period, primaryPath: row.primary_path ?? null, reminderTime: row.reminder_time ? String(row.reminder_time).slice(0, 5) : null, motionPreference: row.motion_preference || 'system', onboardingCompletedAt: row.onboarding_completed_at ?? null, tourVersionSeen: Number(row.tour_version_seen || 0) }; }
function mapDefinition(row) { return { id: row.id, title: row.title, description: row.description, category: row.category, rarity: row.rarity, cadence: row.cadence, verificationType: row.verification_type, subjectTag: row.subject_tag, targetValue: Number(row.target_value), unit: row.unit, cooldownDays: Number(row.cooldown_days), xpReward: Number(row.xp_reward), enabled: row.enabled, instructions: row.instructions || [] }; }
function mapAssignment(row) { return { id: row.id, userId: row.user_id, definitionId: row.definition_id, title: row.title, description: row.description, category: row.category, rarity: row.rarity, cadence: row.cadence, verificationType: row.verification_type, subjectTag: row.subject_tag, targetValue: Number(row.target_value), progressValue: Number(row.progress_value), unit: row.unit, xpReward: Number(row.xp_reward), instructions: row.instructions || [], periodKey: row.period_key, status: row.status, assignedAt: row.assigned_at, startsAt: row.starts_at, expiresAt: row.expires_at, completedAt: row.completed_at, updatedAt: row.updated_at }; }
function mapSubmission(row) { return { id: row.id, userId: row.user_id, assignmentId: row.assignment_id, verificationType: row.verification_type, status: row.status, imageHash: row.image_hash, confidence: row.confidence == null ? null : Number(row.confidence), metadata: row.metadata || {}, uploadId: row.upload_id, feedPosted: row.feed_posted, createdAt: row.created_at }; }
function mapFeedEntry(row) { return { id: row.id, userId: row.user_id, assignmentId: row.assignment_id, submissionId: row.submission_id, questName: row.quest_name, displayName: row.display_name, xpEarned: Number(row.xp_earned), rankTitle: row.rank_title, imageRef: row.image_ref, createdAt: row.created_at }; }
function mapReward(row) { return { level: Number(row.level), rewardType: row.reward_type, rewardKey: row.reward_key, amount: Number(row.amount), label: row.label, status: row.status, unlockedAt: row.unlocked_at, claimedAt: row.claimed_at }; }
function mapNotification(row) { return { id: row.id, userId: row.user_id, kind: row.kind, title: row.title, body: row.body, readAt: row.read_at, createdAt: row.created_at }; }
function mapCapturedCard(row) {
  return {
    id: row.id,
    userId: row.user_id,
    captureId: row.capture_id,
    itemName: row.item_name,
    category: row.category,
    cardTitle: row.card_title,
    rarityTier: row.rarity_tier,
    rarityScore: Number(row.rarity_score),
    description: row.description,
    notes: row.notes ?? null,
    imageRef: row.image_ref,
    status: row.status,
    gps: row.gps_lat != null ? { lat: Number(row.gps_lat), lng: Number(row.gps_lng), accuracyM: row.gps_accuracy_m != null ? Number(row.gps_accuracy_m) : null, altitude: row.gps_altitude != null ? Number(row.gps_altitude) : null } : null,
    heading: row.heading != null ? Number(row.heading) : null,
    capturedAt: row.captured_at,
    antiCheatVerdict: row.anti_cheat_verdict,
    antiCheatReason: row.anti_cheat_reason,
    rejectReason: row.reject_reason,
    speciesId: row.species_id,
    confidence: row.confidence != null ? Number(row.confidence) : null,
    rarityGrade: row.rarity_grade,
    rarityStars: row.rarity_stars,
    rarityWeightSetVersion: row.rarity_weight_set_version,
    // xpAwarded/coinsAwarded are credited (capture_xp_ledger / coin_ledger)
    // once the capture reaches status 'final' — either immediately in
    // createCapturedCard for a non-provisional grade, or later via
    // reviewCapturedCard when an A/S-grade capture is approved (blueprint §21).
    xpAwarded: row.xp_awarded != null ? Number(row.xp_awarded) : 0,
    coinsAwarded: row.coins_awarded != null ? Number(row.coins_awarded) : 0,
    humanVerified: Boolean(row.human_verified),
    reviewedAt: row.reviewed_at ?? null,
    reviewedBy: row.reviewed_by ?? null,
    reviewReason: row.review_reason ?? null,
  };
}
function conflict(code) { const error = new Error(code); error.code = code; error.status = 409; return error; }
function levelFromXp(totalXp) {
  let remaining = totalXp;
  let level = 1;
  const cost = (value) => value <= 20 ? 250 : value <= 40 ? 500 : value <= 60 ? 750 : value <= 80 ? 1000 : value <= 100 ? 1500 : 2000;
  while (remaining >= cost(level)) { remaining -= cost(level); level += 1; }
  return level;
}
function rankTitleForPercentile(percentile) {
  if (percentile <= .1) return 'Legend Circle';
  if (percentile <= 1) return 'Mythril Knight';
  if (percentile <= 5) return 'Pathfinder';
  if (percentile <= 10) return 'Guardian';
  if (percentile <= 25) return 'Scout';
  return 'Adventurer';
}
function communityVisibleClause(viewerSql) {
  return `(p.visibility = 'public'
    OR p.user_id = ${viewerSql}
    OR (p.visibility = 'friends' AND EXISTS (
      SELECT 1 FROM community_friendships f
      WHERE f.status = 'accepted'
        AND ((f.requester_id = ${viewerSql} AND f.addressee_id = p.user_id)
          OR (f.addressee_id = ${viewerSql} AND f.requester_id = p.user_id))
    )))`;
}
function hashSimilarity(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  if (!a || a.length !== b.length) return a === b ? 1 : 0;
  if (/^[a-f0-9]+$/i.test(a) && /^[a-f0-9]+$/i.test(b)) {
    let differingBits = 0;
    for (let index = 0; index < a.length; index += 1) differingBits += bitCount(parseInt(a[index], 16) ^ parseInt(b[index], 16));
    return 1 - differingBits / (a.length * 4);
  }
  let equal = 0;
  for (let index = 0; index < a.length; index += 1) if (a[index] === b[index]) equal += 1;
  return equal / a.length;
}
function bitCount(value) { let bits = value; let count = 0; while (bits) { count += bits & 1; bits >>>= 1; } return count; }

let _demoMediaData;
function demoCaptureMediaData() {
  if (!_demoMediaData) {
    const iconPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/icon-192.png');
    _demoMediaData = `data:image/png;base64,${readFileSync(iconPath).toString('base64')}`;
  }
  return _demoMediaData;
}

