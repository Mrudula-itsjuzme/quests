import { randomUUID } from 'node:crypto';

export class TemplateRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async create(template) {
    const id = template.id || randomUUID();
    const { rows } = await this.pool.query(
      `INSERT INTO quest_templates 
       (id, title, description, category, difficulty, xp_reward, coin_reward, estimated_duration, icon, rarity, requirements, verification_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        id, template.title, template.description, template.category, template.difficulty,
        template.xpReward || 0, template.coinReward || 0, template.estimatedDuration,
        template.icon, template.rarity, template.requirements || {}, template.verificationType,
        template.createdBy
      ]
    );
    return this.mapRow(rows[0]);
  }

  async getById(id) {
    const { rows } = await this.pool.query('SELECT * FROM quest_templates WHERE id = $1', [id]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async list(filters = {}) {
    const conditions = [];
    const values = [];
    if (filters.category) {
      values.push(filters.category);
      conditions.push(`category = $${values.length}`);
    }
    
    const where = conditions.length > 0 ? \`WHERE \${conditions.join(' AND ')}\` : '';
    const { rows } = await this.pool.query(\`SELECT * FROM quest_templates \${where} ORDER BY created_at DESC\`, values);
    return rows.map(row => this.mapRow(row));
  }

  async update(id, updates) {
    const allowed = ['title', 'description', 'category', 'difficulty', 'xp_reward', 'coin_reward', 'estimated_duration', 'icon', 'rarity', 'requirements', 'verification_type'];
    const entries = Object.entries(updates).filter(([key]) => allowed.includes(key));
    if (!entries.length) return this.getById(id);
    
    const values = entries.map(([, val]) => val);
    const set = entries.map(([key], index) => \`\${key} = $\${index + 1}\`);
    values.push(id);
    
    const { rows } = await this.pool.query(
      \`UPDATE quest_templates SET \${set.join(', ')}, updated_at = NOW() WHERE id = $\${values.length} RETURNING *\`,
      values
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async delete(id) {
    await this.pool.query('DELETE FROM quest_templates WHERE id = $1', [id]);
  }

  mapRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      difficulty: row.difficulty,
      xpReward: row.xp_reward,
      coinReward: row.coin_reward,
      estimatedDuration: row.estimated_duration,
      icon: row.icon,
      rarity: row.rarity,
      requirements: row.requirements,
      verificationType: row.verification_type,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
