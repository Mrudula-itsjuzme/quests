export class StoreEngine {
  constructor(repository) {
    this.repository = repository;
  }

  async getCatalog() {
    return this.repository.getStoreCatalog();
  }

  async purchaseItem(userId, itemId) {
    return this.repository.purchaseStoreItem(userId, itemId);
  }
}
