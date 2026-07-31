export class UserRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async ensureUserProgress(userId) {
    const { rows } = await this.pool.query(
      `INSERT INTO user_progress (user_id, level, xp, coins, streak, rank)
       VALUES ($1, 1, 0, 0, 0, 'Adventurer')
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [userId]
    );
    if (rows[0]) return this.mapRow(rows[0]);
    return this.getProgress(userId);
  }

  async getProgress(userId) {
    const { rows } = await this.pool.query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async addXp(userId, amount) {
    const { rows } = await this.pool.query(
      `UPDATE user_progress 
       SET xp = xp + $2, updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, amount]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async updateLevel(userId, newLevel, rank = null) {
    let query = 'UPDATE user_progress SET level = $2, updated_at = NOW()';
    const values = [userId, newLevel];
    
    if (rank) {
      values.push(rank);
      query += `, rank = $3`;
    }
    
    query += ` WHERE user_id = $1 RETURNING *`;
    
    const { rows } = await this.pool.query(query, values);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  mapRow(row) {
    return {
      userId: row.user_id,
      level: row.level,
      xp: row.xp,
      coins: row.coins,
      streak: row.streak,
      rank: row.rank,
      statistics: row.statistics,
      updatedAt: row.updated_at
    };
  }
}
