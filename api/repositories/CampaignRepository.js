import { randomUUID } from 'node:crypto';

export class CampaignRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async create(campaign) {
    const id = campaign.id || randomUUID();
    const { rows } = await this.pool.query(
      `INSERT INTO campaigns 
       (id, title, description, banner, theme, start_date, end_date, visibility, reward_pool, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id, campaign.title, campaign.description, campaign.banner, campaign.theme,
        campaign.startDate, campaign.endDate, campaign.visibility || 'public',
        campaign.rewardPool || {}, campaign.status || 'draft'
      ]
    );
    return this.mapRow(rows[0]);
  }

  async getById(id) {
    const { rows } = await this.pool.query('SELECT * FROM campaigns WHERE id = $1', [id]);
    if (!rows[0]) return null;
    
    const campaign = this.mapRow(rows[0]);
    // Fetch attached quests
    const quests = await this.pool.query(
      'SELECT quest_template_id, display_order FROM campaign_quests WHERE campaign_id = $1 ORDER BY display_order ASC', 
      [id]
    );
    campaign.quests = quests.rows.map(r => ({ templateId: r.quest_template_id, displayOrder: r.display_order }));
    return campaign;
  }

  async listActive(now = new Date()) {
    const { rows } = await this.pool.query(
      \`SELECT * FROM campaigns WHERE status = 'active' AND (start_date IS NULL OR start_date <= $1) AND (end_date IS NULL OR end_date >= $1) ORDER BY start_date DESC\`,
      [now]
    );
    return rows.map(row => this.mapRow(row));
  }

  async addQuest(campaignId, questTemplateId, displayOrder = 0) {
    await this.pool.query(
      'INSERT INTO campaign_quests (campaign_id, quest_template_id, display_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [campaignId, questTemplateId, displayOrder]
    );
  }

  mapRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      banner: row.banner,
      theme: row.theme,
      startDate: row.start_date,
      endDate: row.end_date,
      visibility: row.visibility,
      rewardPool: row.reward_pool,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
