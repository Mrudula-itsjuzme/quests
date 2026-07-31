import { randomUUID } from 'node:crypto';

export class AssignmentRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async create(assignment) {
    const id = assignment.id || randomUUID();
    const { rows } = await this.pool.query(
      `INSERT INTO live_quest_assignments 
       (id, user_id, quest_template_id, status, progress, assigned_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id, assignment.userId, assignment.questTemplateId, assignment.status || 'assigned',
        assignment.progress || 0, assignment.assignedAt || new Date(), assignment.expiresAt
      ]
    );
    return this.mapRow(rows[0]);
  }

  async getById(id) {
    const { rows } = await this.pool.query('SELECT * FROM live_quest_assignments WHERE id = $1', [id]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async listActiveByUser(userId) {
    const { rows } = await this.pool.query(
      `SELECT a.*, t.title, t.description, t.category, t.xp_reward, t.verification_type, t.requirements 
       FROM live_quest_assignments a
       JOIN quest_templates t ON a.quest_template_id = t.id
       WHERE a.user_id = $1 AND a.status IN ('assigned', 'active', 'pending_verification')
         AND (a.expires_at IS NULL OR a.expires_at > NOW())
       ORDER BY a.assigned_at DESC`,
      [userId]
    );
    return rows.map(row => ({
      ...this.mapRow(row),
      template: {
        title: row.title,
        description: row.description,
        category: row.category,
        xpReward: row.xp_reward,
        verificationType: row.verification_type,
        requirements: row.requirements
      }
    }));
  }

  async updateProgress(id, progress, status = null) {
    let query = 'UPDATE live_quest_assignments SET progress = $1, updated_at = NOW()';
    const values = [progress];
    
    if (status) {
      values.push(status);
      query += `, status = $2`;
      if (status === 'completed') {
        query += `, completed_at = NOW()`;
      }
    }
    
    values.push(id);
    query += ` WHERE id = $${values.length} RETURNING *`;
    
    const { rows } = await this.pool.query(query, values);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
  
  async updateStatus(id, status) {
    const { rows } = await this.pool.query(
      `UPDATE live_quest_assignments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  mapRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      questTemplateId: row.quest_template_id,
      status: row.status,
      progress: row.progress,
      assignedAt: row.assigned_at,
      expiresAt: row.expires_at,
      completedAt: row.completed_at,
      updatedAt: row.updated_at
    };
  }
}
