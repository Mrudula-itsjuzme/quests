import '../models/quest.dart';
import '../models/collectible.dart';
import 'api_client.dart';

/// Service layer for quest-related API calls.
///
/// Uses the legacy endpoints:
/// * `GET /api/quests`
/// * `GET /api/collectibles`
/// * `POST /api/quests/:id/complete`
class QuestService {
  QuestService(this._client);

  final ApiClient _client;

  /// Fetch all active quests. The server auto-generates daily and weekly
  /// quests when none exist for the current period.
  Future<List<Quest>> fetchQuests() async {
    final data = await _client.get('/api/quests');
    if (data is! List) return const [];
    return data
        .cast<Map<String, dynamic>>()
        .map(Quest.fromLegacyJson)
        .toList();
  }

  /// Fetch all unlocked collectibles.
  Future<List<Collectible>> fetchCollectibles() async {
    final data = await _client.get('/api/collectibles');
    if (data is! List) return const [];
    return data
        .cast<Map<String, dynamic>>()
        .map(Collectible.fromJson)
        .toList();
  }

  /// Complete a quest by ID. Returns the full response including
  /// the updated quest, collectible (if any), and XP credited.
  Future<QuestCompletionResult> completeQuest(String questId) async {
    final data = await _client.post('/api/quests/$questId/complete');
    if (data is! Map<String, dynamic>) {
      throw const ApiException('invalid_response', 500);
    }
    return QuestCompletionResult.fromJson(data);
  }
}

/// Result of completing a quest via the legacy endpoint.
class QuestCompletionResult {
  const QuestCompletionResult({
    required this.quest,
    this.collectible,
    required this.xpCredited,
    required this.bonusXp,
  });

  factory QuestCompletionResult.fromJson(Map<String, dynamic> json) {
    final questJson = json['quest'] as Map<String, dynamic>?;
    final collectibleJson = json['collectible'];

    return QuestCompletionResult(
      quest: questJson != null
          ? Quest.fromLegacyJson(questJson)
          : throw const FormatException('missing quest in response'),
      collectible: collectibleJson is Map<String, dynamic>
          ? Collectible.fromJson(collectibleJson)
          : null,
      xpCredited: (json['xpCredited'] as num?)?.toInt() ?? 0,
      bonusXp: (json['bonusXp'] as num?)?.toInt() ?? 0,
    );
  }

  final Quest quest;
  final Collectible? collectible;
  final int xpCredited;
  final int bonusXp;
}
