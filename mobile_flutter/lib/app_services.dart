import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

class MobileProfile {
  const MobileProfile({
    required this.id,
    required this.displayName,
    required this.timezone,
    required this.totalXp,
    required this.streakDays,
    required this.level,
    required this.xpIntoLevel,
    required this.xpForCurrentLevel,
    required this.motionPreference,
    required this.tourVersionSeen,
    this.primaryPath,
    this.reminderTime,
    this.onboardingCompletedAt,
  });

  factory MobileProfile.fromJson(Map<String, dynamic> json) => MobileProfile(
        id: json['id'] as String,
        displayName: json['displayName'] as String? ?? 'Adventurer',
        timezone: json['timezone'] as String? ?? 'UTC',
        totalXp: (json['totalXp'] as num?)?.toInt() ?? 0,
        streakDays: (json['streakDays'] as num?)?.toInt() ?? 0,
        level: (json['level'] as num?)?.toInt() ?? 1,
        xpIntoLevel: (json['xpIntoLevel'] as num?)?.toInt() ?? 0,
        xpForCurrentLevel: (json['xpForCurrentLevel'] as num?)?.toInt() ?? 250,
        primaryPath: json['primaryPath'] as String?,
        reminderTime: json['reminderTime'] as String?,
        motionPreference: json['motionPreference'] as String? ?? 'system',
        onboardingCompletedAt: json['onboardingCompletedAt'] as String?,
        tourVersionSeen: (json['tourVersionSeen'] as num?)?.toInt() ?? 0,
      );

  final String id;
  final String displayName;
  final String timezone;
  final int totalXp;
  final int streakDays;
  final int level;
  final int xpIntoLevel;
  final int xpForCurrentLevel;
  final String? primaryPath;
  final String? reminderTime;
  final String motionPreference;
  final String? onboardingCompletedAt;
  final int tourVersionSeen;
}

class MobileQuestAssignment {
  const MobileQuestAssignment({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.cadence,
    required this.verificationType,
    required this.targetValue,
    required this.progressValue,
    required this.unit,
    required this.xpReward,
    required this.status,
  });

  factory MobileQuestAssignment.fromJson(Map<String, dynamic> json) =>
      MobileQuestAssignment(
        id: json['id'] as String,
        title: json['title'] as String,
        description: json['description'] as String? ?? '',
        category: json['category'] as String? ?? 'Discovery',
        cadence: json['cadence'] as String? ?? 'daily',
        verificationType: json['verificationType'] as String? ?? 'AUTO',
        targetValue: (json['targetValue'] as num?)?.toDouble() ?? 1,
        progressValue: (json['progressValue'] as num?)?.toDouble() ?? 0,
        unit: json['unit'] as String? ?? 'quest',
        xpReward: (json['xpReward'] as num?)?.toInt() ?? 0,
        status: json['status'] as String? ?? 'active',
      );

  final String id;
  final String title;
  final String description;
  final String category;
  final String cadence;
  final String verificationType;
  final double targetValue;
  final double progressValue;
  final String unit;
  final int xpReward;
  final String status;
}

class MobileCollectible {
  const MobileCollectible({
    required this.id,
    required this.title,
    required this.rarity,
    required this.caption,
  });

  factory MobileCollectible.fromJson(Map<String, dynamic> json) =>
      MobileCollectible(
        id: json['assetId'] as String,
        title: json['title'] as String,
        rarity: json['rarity'] as String? ?? 'Common',
        caption: json['caption'] as String? ?? '',
      );

  final String id;
  final String title;
  final String rarity;
  final String caption;
}

class MobileApiException implements Exception {
  const MobileApiException(this.code, this.status);
  final String code;
  final int status;

  String get friendlyMessage => switch (code) {
        'authentication_required' ||
        'invalid_access_token' =>
          'Your session has ended. Sign in again.',
        'provider_not_configured' => 'Verification is not connected yet.',
        'quest_expired' => 'This quest has expired. Refresh your path.',
        'duplicate_submission' => 'That proof was already submitted.',
        _ => 'The quest service could not complete that action.',
      };
}

class QuestMobileServices {
  QuestMobileServices._(this.client, this.api);

  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const publishableKey =
      String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3001/api',
  );

  static bool get configured =>
      supabaseUrl.isNotEmpty && publishableKey.isNotEmpty;

  static Future<QuestMobileServices?> createFromEnvironment() async {
    if (!configured) return null;
    await Supabase.initialize(url: supabaseUrl, publishableKey: publishableKey);
    final client = Supabase.instance.client;
    return QuestMobileServices._(
      client,
      MobileQuestApi(client: client, baseUrl: apiBaseUrl),
    );
  }

  final SupabaseClient client;
  final MobileQuestApi api;

  User? get currentUser => client.auth.currentUser;
  Stream<AuthState> get authChanges => client.auth.onAuthStateChange;

  Future<AuthResponse> signIn(String email, String password) =>
      client.auth.signInWithPassword(email: email, password: password);

  Future<AuthResponse> signUp(
    String email,
    String password,
    String displayName,
  ) =>
      client.auth.signUp(
        email: email,
        password: password,
        data: {
          'name': displayName,
          'zoneinfo': DateTime.now().timeZoneName,
        },
        emailRedirectTo: 'io.supabase.habbitquest://auth-callback/',
      );

  Future<void> sendPasswordReset(String email) =>
      client.auth.resetPasswordForEmail(
        email,
        redirectTo: 'io.supabase.habbitquest://reset-password/',
      );

  Future<void> signOut() => client.auth.signOut();
}

class MobileQuestApi {
  MobileQuestApi({
    required this.client,
    required this.baseUrl,
    http.Client? httpClient,
  }) : httpClient = httpClient ?? http.Client();

  final SupabaseClient client;
  final String baseUrl;
  final http.Client httpClient;
  final Random _random = Random.secure();

  Future<MobileProfile> getProfile() async => MobileProfile.fromJson(
        await _request('GET', '/v1/me') as Map<String, dynamic>,
      );

  Future<MobileProfile> updateProfile(Map<String, dynamic> profile) async =>
      MobileProfile.fromJson(
        await _request('PATCH', '/v1/me', body: profile)
            as Map<String, dynamic>,
      );

  Future<List<MobileQuestAssignment>> getActiveQuests() async =>
      ((await _request('GET', '/v1/quests/active')) as List<dynamic>)
          .cast<Map<String, dynamic>>()
          .map(MobileQuestAssignment.fromJson)
          .toList();

  Future<List<MobileCollectible>> getCollectibles() async =>
      ((await _request('GET', '/collectibles')) as List<dynamic>)
          .cast<Map<String, dynamic>>()
          .map(MobileCollectible.fromJson)
          .toList();

  Future<void> generateFirstPath() async {
    await Future.wait([
      _request(
        'POST',
        '/v1/quests/generate-daily',
        body: const {},
        idempotency: _key('mobile-daily'),
      ),
      _request(
        'POST',
        '/v1/quests/generate-weekly',
        body: const {},
        idempotency: _key('mobile-weekly'),
      ),
    ]);
  }

  Future<void> progress(MobileQuestAssignment quest) async {
    await _request(
      'POST',
      '/v1/quests/${quest.id}/progress',
      body: {'value': quest.targetValue},
      idempotency: _key('mobile-progress'),
    );
  }

  Future<void> submitText(MobileQuestAssignment quest, String text) async {
    await _request(
      'POST',
      '/v1/quests/${quest.id}/submissions',
      body: {'text': text, 'feedOptIn': false},
      idempotency: _key('mobile-text'),
    );
  }

  Future<dynamic> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    String? idempotency,
  }) async {
    final token = client.auth.currentSession?.accessToken;
    if (token == null)
      throw const MobileApiException('authentication_required', 401);
    final headers = <String, String>{
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
      if (body != null) 'Content-Type': 'application/json',
      if (idempotency != null) 'Idempotency-Key': idempotency,
    };
    final uri = Uri.parse('$baseUrl$path');
    final response = switch (method) {
      'POST' =>
        await httpClient.post(uri, headers: headers, body: jsonEncode(body)),
      'PATCH' =>
        await httpClient.patch(uri, headers: headers, body: jsonEncode(body)),
      _ => await httpClient.get(uri, headers: headers),
    };
    final payload = response.body.isEmpty ? null : jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      String? code;
      if (payload is Map<String, dynamic>) {
        final error = payload['error'];
        if (error is Map<String, dynamic>) code = error['code'] as String?;
      }
      throw MobileApiException(code ?? 'request_failed', response.statusCode);
    }
    return payload;
  }

  String _key(String prefix) =>
      '$prefix-${DateTime.now().microsecondsSinceEpoch}-${_random.nextInt(1 << 31)}';
}
