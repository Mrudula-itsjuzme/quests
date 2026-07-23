import { randomUUID } from 'node:crypto';

export class PostgresQuestRepository {
  constructor(pool) { this.pool = pool; }

  async ensureUser(user) {
    const { rows } = await this.pool.query(
      `INSERT INTO quest_users (id, display_name, timezone)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, timezone = EXCLUDED.timezone, updated_at = NOW()
       RETURNING *`,
      [user.id, user.displayName || 'Adventurer', user.timezone || 'UTC'],
    );
    return mapUser(rows[0]);
  }
  async getUser(userId) { const { rows } = await this.pool.query('SELECT * FROM quest_users WHERE id = $1', [userId]); return rows[0] ? mapUser(rows[0]) : null; }
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
  async reconcileStreak(userId, currentPeriodKey) {
    await this.pool.query(`UPDATE quest_users SET streak_days = 0, updated_at = NOW()
      WHERE id = $1 AND streak_days > 0
        AND (last_streak_period IS NULL OR last_streak_period::date < $2::date - 1)`, [userId, currentPeriodKey]);
  }
  async listDefinitions(filters = {}) {
    const values = [];
    const where = ['enabled = TRUE'];
    if (filters.cadence) { values.push(filters.cadence); where.push(`cadence = $${values.length}`); }
    if (filters.category) { values.push(filters.category); where.push(`category = $${values.length}`); }
    const { rows } = await this.pool.query(`SELECT * FROM quest_definitions WHERE ${where.join(' AND ')} ORDER BY id`, values);
    return rows.map(mapDefinition);
  }
  async createDefinition(definition) {
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
         ON CONFLICT (user_id, cadence, period_key, category) DO UPDATE SET updated_at = quest_assignments.updated_at
         RETURNING *`,
        [randomUUID(), item.userId, item.definitionId, item.title, item.description, item.category, item.rarity, item.cadence, item.verificationType, item.subjectTag, item.targetValue, item.unit, item.xpReward, JSON.stringify(item.instructions), item.periodKey, item.assignedAt, item.startsAt, item.expiresAt],
      );
      created.push(mapAssignment(rows[0]));
    }
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
           ON CONFLICT (user_id, cadence, period_key, category) DO UPDATE SET updated_at = quest_assignments.updated_at
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
    const allowed = { status: 'status', progressValue: 'progress_value', completedAt: 'completed_at', updatedAt: 'updated_at' };
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
  async createSubmission(value) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO quest_submissions (id, user_id, assignment_id, verification_type, status, image_hash, confidence, feed_posted, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [randomUUID(), value.userId, value.assignmentId, value.verificationType, value.status, value.imageHash, value.confidence, value.feedPosted, value.createdAt],
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
        if (count.rows[0].total === 3 && count.rows[0].completed === 3) {
          const bonusKey = `${userId}:${dailyPeriodKey}:bonus`;
          const bonus = await client.query(`INSERT INTO quest_xp_ledger (id, ledger_key, user_id, amount, reason) VALUES ($1,$2,$3,150,'daily_bonus') ON CONFLICT (ledger_key) DO NOTHING RETURNING amount`, [randomUUID(), bonusKey, userId]);
          bonusXp = Number(bonus.rows[0]?.amount || 0);
          if (bonusXp) await client.query(`UPDATE quest_users
            SET total_xp = total_xp + 150,
                streak_days = CASE
                  WHEN last_streak_period::date = $2::date - 1 THEN streak_days + 1
                  WHEN last_streak_period = $2 THEN streak_days
                  ELSE 1
                END,
                last_streak_period = $2,
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
      const updatedAssignment = await client.query('SELECT * FROM quest_assignments WHERE id = $1', [assignmentId]);
      const updatedUser = await client.query('SELECT * FROM quest_users WHERE id = $1', [userId]);
      await client.query('COMMIT');
      return { assignment: mapAssignment(updatedAssignment.rows[0]), user: mapUser(updatedUser.rows[0]), xpCredited, bonusXp };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async getCollectibles(userId) { const { rows } = await this.pool.query('SELECT * FROM collectible_unlocks WHERE user_id = $1 ORDER BY unlocked_at DESC', [userId]); return rows.map((row) => ({ assetId: row.asset_id, questId: row.quest_id, title: row.title, category: row.category, rarity: row.rarity, caption: row.caption, unlockedAt: row.unlocked_at })); }
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
}

function mapUser(row) { return { id: row.id, displayName: row.display_name, timezone: row.timezone, totalXp: Number(row.total_xp), streakDays: Number(row.streak_days), lastStreakPeriod: row.last_streak_period, primaryPath: row.primary_path ?? null, reminderTime: row.reminder_time ? String(row.reminder_time).slice(0, 5) : null, motionPreference: row.motion_preference || 'system', onboardingCompletedAt: row.onboarding_completed_at ?? null, tourVersionSeen: Number(row.tour_version_seen || 0) }; }
function mapDefinition(row) { return { id: row.id, title: row.title, description: row.description, category: row.category, rarity: row.rarity, cadence: row.cadence, verificationType: row.verification_type, subjectTag: row.subject_tag, targetValue: Number(row.target_value), unit: row.unit, cooldownDays: Number(row.cooldown_days), xpReward: Number(row.xp_reward), enabled: row.enabled, instructions: row.instructions || [] }; }
function mapAssignment(row) { return { id: row.id, userId: row.user_id, definitionId: row.definition_id, title: row.title, description: row.description, category: row.category, rarity: row.rarity, cadence: row.cadence, verificationType: row.verification_type, subjectTag: row.subject_tag, targetValue: Number(row.target_value), progressValue: Number(row.progress_value), unit: row.unit, xpReward: Number(row.xp_reward), instructions: row.instructions || [], periodKey: row.period_key, status: row.status, assignedAt: row.assigned_at, startsAt: row.starts_at, expiresAt: row.expires_at, completedAt: row.completed_at, updatedAt: row.updated_at }; }
function mapSubmission(row) { return { id: row.id, userId: row.user_id, assignmentId: row.assignment_id, verificationType: row.verification_type, status: row.status, imageHash: row.image_hash, confidence: row.confidence == null ? null : Number(row.confidence), feedPosted: row.feed_posted, createdAt: row.created_at }; }
function conflict(code) { const error = new Error(code); error.code = code; error.status = 409; return error; }
