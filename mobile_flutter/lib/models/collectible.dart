/// A collectible relic returned by `GET /api/collectibles`.
class Collectible {
  const Collectible({
    required this.assetId,
    required this.questId,
    required this.title,
    required this.category,
    required this.rarity,
    required this.caption,
    this.unlockedAt,
  });

  factory Collectible.fromJson(Map<String, dynamic> json) => Collectible(
        assetId: json['assetId'] as String? ?? '',
        questId: json['questId'] as String? ?? '',
        title: json['title'] as String? ?? 'Unknown Relic',
        category: json['category'] as String? ?? 'Discovery',
        rarity: json['rarity'] as String? ?? 'Common',
        caption: json['caption'] as String? ?? '',
        unlockedAt: json['unlockedAt'] as String?,
      );

  final String assetId;
  final String questId;
  final String title;
  final String category;
  final String rarity;
  final String caption;
  final String? unlockedAt;
}
