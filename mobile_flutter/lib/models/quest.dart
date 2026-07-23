/// A quest returned by the HABBIT API.
///
/// Matches the legacy `/api/quests` response shape exactly:
/// id, title, summary, detail, category, rarity, xp, status, progress,
/// target, instructions, proofType, cadence.
class Quest {
  const Quest({
    required this.id,
    required this.title,
    required this.summary,
    required this.detail,
    required this.category,
    required this.rarity,
    required this.xp,
    required this.status,
    required this.progress,
    required this.target,
    required this.instructions,
    required this.proofType,
    required this.cadence,
  });

  /// Parse from the legacy `/api/quests` response (mapLegacyQuest shape).
  factory Quest.fromLegacyJson(Map<String, dynamic> json) => Quest(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        summary: json['summary'] as String? ?? '',
        detail: json['detail'] as String? ?? '',
        category: json['category'] as String? ?? 'Discovery',
        rarity: json['rarity'] as String? ?? 'Common',
        xp: (json['xp'] as num?)?.toInt() ?? 0,
        status: json['status'] as String? ?? 'Not Started',
        progress: (json['progress'] as num?)?.toDouble() ?? 0.0,
        target: json['target'] as String? ?? '0/0',
        instructions: _parseInstructions(json['instructions']),
        proofType: json['proofType'] as String? ?? 'auto',
        cadence: json['cadence'] as String? ?? 'daily',
      );

  /// Parse from V1 `/api/v1/quests/active` response (raw assignment shape).
  factory Quest.fromV1Json(Map<String, dynamic> json) => Quest(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        summary: json['description'] as String? ?? '',
        detail: json['description'] as String? ?? '',
        category: (json['category'] as String?) == 'Weekly'
            ? 'Discovery'
            : (json['category'] as String? ?? 'Discovery'),
        rarity: json['rarity'] as String? ?? 'Common',
        xp: (json['xpReward'] as num?)?.toInt() ?? 0,
        status: _mapV1Status(json['status'] as String?),
        progress: _safeProgress(json),
        target:
            '${(json['progressValue'] as num?)?.toInt() ?? 0}/${(json['targetValue'] as num?)?.toInt() ?? 1} ${json['unit'] ?? ''}',
        instructions: _parseInstructions(json['instructions']),
        proofType:
            (json['verificationType'] as String? ?? 'AUTO').toLowerCase(),
        cadence: json['cadence'] as String? ?? 'daily',
      );

  final String id;
  final String title;
  final String summary;
  final String detail;
  final String category;
  final String rarity;
  final int xp;
  final String status;
  final double progress; // 0.0–1.0
  final String target; // e.g. "3/5 minutes"
  final List<String> instructions;
  final String proofType;
  final String cadence;

  bool get isDaily => cadence == 'daily';
  bool get isWeekly => cadence == 'weekly';
  bool get isCompleted => status == 'Completed';
  bool get isInProgress => status == 'In Progress';
  bool get canComplete => !isCompleted && status != 'Awaiting Proof';

  Quest copyWith({String? status, double? progress, String? target}) => Quest(
        id: id,
        title: title,
        summary: summary,
        detail: detail,
        category: category,
        rarity: rarity,
        xp: xp,
        status: status ?? this.status,
        progress: progress ?? this.progress,
        target: target ?? this.target,
        instructions: instructions,
        proofType: proofType,
        cadence: cadence,
      );

  static List<String> _parseInstructions(dynamic value) {
    if (value is List) return value.cast<String>();
    return const [];
  }

  static String _mapV1Status(String? status) => switch (status) {
        'completed' => 'Completed',
        'pending_verification' => 'Awaiting Proof',
        'active' || 'rejected' => 'In Progress',
        _ => 'Not Started',
      };

  static double _safeProgress(Map<String, dynamic> json) {
    final target = (json['targetValue'] as num?)?.toDouble() ?? 1;
    final progress = (json['progressValue'] as num?)?.toDouble() ?? 0;
    return target > 0 ? (progress / target).clamp(0.0, 1.0) : 0.0;
  }
}
