export class QuestService {
  constructor(templateRepository) {
    this.templateRepository = templateRepository;
  }

  async createQuest(data, adminUserId) {
    // Basic validation
    if (!data.title || !data.category || !data.verificationType) {
      throw new Error('title, category, and verificationType are required');
    }
    
    const templateData = {
      ...data,
      createdBy: adminUserId,
    };
    
    return this.templateRepository.create(templateData);
  }

  async getQuest(id) {
    const quest = await this.templateRepository.getById(id);
    if (!quest) throw new Error('Quest not found');
    return quest;
  }

  async listQuests(filters) {
    return this.templateRepository.list(filters);
  }

  async updateQuest(id, data) {
    const updated = await this.templateRepository.update(id, data);
    if (!updated) throw new Error('Quest not found');
    return updated;
  }

  async archiveQuest(id) {
    // Soft delete or hide would be better, but we'll use DB delete for now or implement a 'status' field later
    await this.templateRepository.delete(id);
  }
}
