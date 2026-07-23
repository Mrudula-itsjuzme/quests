import 'package:flutter/foundation.dart';

import '../models/quest.dart';
import '../models/collectible.dart';
import '../services/api_client.dart';
import '../services/quest_service.dart';

/// Loading lifecycle for API-backed data.
enum LoadingState { initial, loading, loaded, error }

/// Central state controller for quests and collectibles.
///
/// Uses [ChangeNotifier] to avoid extra dependencies.
/// All displayed quest data flows from the backend —
/// no hardcoded quests are created here.
class QuestController extends ChangeNotifier {
  QuestController(this._service);

  final QuestService _service;

  // ─── State ─────────────────────────────────────────────────
  LoadingState _state = LoadingState.initial;
  LoadingState get state => _state;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  List<Quest> _quests = const [];
  List<Quest> get quests => _quests;

  List<Collectible> _collectibles = const [];
  List<Collectible> get collectibles => _collectibles;

  // ─── Filters ───────────────────────────────────────────────
  String? _categoryFilter;
  String? get categoryFilter => _categoryFilter;

  String? _statusFilter;
  String? get statusFilter => _statusFilter;

  // ─── Completion guard ──────────────────────────────────────
  final Set<String> _completing = {};
  bool isCompleting(String questId) => _completing.contains(questId);

  // ─── Derived data ──────────────────────────────────────────
  List<Quest> get dailyQuests =>
      _quests.where((q) => q.isDaily).toList();

  List<Quest> get weeklyQuests =>
      _quests.where((q) => q.isWeekly).toList();

  Quest? get featuredWeekly =>
      weeklyQuests.isEmpty ? null : weeklyQuests.first;

  int get completedDailyCount =>
      dailyQuests.where((q) => q.isCompleted).length;

  int get totalDailyCount => dailyQuests.length;

  bool get allDailyComplete =>
      totalDailyCount > 0 && completedDailyCount == totalDailyCount;

  /// Quests filtered by current category and status selection.
  List<Quest> get filteredQuests {
    var result = _quests;
    if (_categoryFilter != null) {
      result = result
          .where((q) => q.category == _categoryFilter)
          .toList();
    }
    if (_statusFilter != null) {
      result = result
          .where((q) => q.status == _statusFilter)
          .toList();
    }
    return result;
  }

  /// Quests for the home screen: daily quests (up to 3) excluding
  /// the featured weekly.
  List<Quest> get homeQuests {
    final daily = dailyQuests;
    return daily.length > 3 ? daily.sublist(0, 3) : daily;
  }

  /// Remaining quests not shown in homeQuests or featuredWeekly.
  List<Quest> get remainingQuests {
    final homeIds = homeQuests.map((q) => q.id).toSet();
    final weeklyId = featuredWeekly?.id;
    return _quests
        .where((q) => !homeIds.contains(q.id) && q.id != weeklyId)
        .toList();
  }

  // ─── Actions ───────────────────────────────────────────────

  /// Load quests and collectibles from the API.
  Future<void> loadAll() async {
    _state = LoadingState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _service.fetchQuests(),
        _service.fetchCollectibles(),
      ]);
      _quests = results[0] as List<Quest>;
      _collectibles = results[1] as List<Collectible>;
      _state = LoadingState.loaded;
      _errorMessage = null;
    } on ApiException catch (e) {
      // Keep previously loaded data visible.
      _state = _quests.isEmpty ? LoadingState.error : LoadingState.loaded;
      _errorMessage = e.friendlyMessage;
    } catch (e) {
      _state = _quests.isEmpty ? LoadingState.error : LoadingState.loaded;
      _errorMessage = 'Could not reach the quest server. Check your connection.';
    }
    notifyListeners();
  }

  /// Complete a quest. Prevents duplicate requests.
  /// Returns the completion result on success, null on failure.
  Future<QuestCompletionResult?> completeQuest(String questId) async {
    if (_completing.contains(questId)) return null;
    _completing.add(questId);
    notifyListeners();

    try {
      final result = await _service.completeQuest(questId);

      // Update the quest in our local list from the server response.
      _quests = _quests.map((q) {
        if (q.id == questId) return result.quest;
        return q;
      }).toList();

      // If a collectible was returned, add it.
      if (result.collectible != null) {
        _collectibles = [..._collectibles, result.collectible!];
      }

      _completing.remove(questId);
      notifyListeners();
      return result;
    } on ApiException catch (e) {
      _completing.remove(questId);
      _errorMessage = e.friendlyMessage;
      notifyListeners();
      return null;
    } catch (_) {
      _completing.remove(questId);
      _errorMessage = 'Quest completion failed. Try again.';
      notifyListeners();
      return null;
    }
  }

  void setCategoryFilter(String? category) {
    _categoryFilter = category;
    notifyListeners();
  }

  void setStatusFilter(String? status) {
    _statusFilter = status;
    notifyListeners();
  }

  void clearFilters() {
    _categoryFilter = null;
    _statusFilter = null;
    notifyListeners();
  }

  /// Dismiss a transient error message.
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
