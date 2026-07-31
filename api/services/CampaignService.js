import { DomainEventBus, DomainEvents } from '../lib/domain-events.js';

export class CampaignService {
  constructor(campaignRepository, eventBus = new DomainEventBus()) {
    this.campaignRepository = campaignRepository;
    this.eventBus = eventBus;
  }

  async createCampaign(data) {
    if (!data.title) throw new Error('Campaign title is required');
    const campaign = await this.campaignRepository.create(data);
    return campaign;
  }

  async getCampaign(id) {
    const campaign = await this.campaignRepository.getById(id);
    if (!campaign) throw new Error('Campaign not found');
    return campaign;
  }

  async listActiveCampaigns() {
    return this.campaignRepository.listActive();
  }

  async addQuestToCampaign(campaignId, questTemplateId, displayOrder) {
    await this.campaignRepository.addQuest(campaignId, questTemplateId, displayOrder);
  }

  async launchCampaign(id) {
    const campaign = await this.campaignRepository.getById(id);
    if (!campaign) throw new Error('Campaign not found');
    
    // In a real app we might update the status here
    await this.eventBus.publish(DomainEvents.CampaignStarted, { campaignId: id });
    return true;
  }
}
