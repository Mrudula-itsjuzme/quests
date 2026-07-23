import 'dart:convert';
import 'package:http/http.dart' as http;

import 'api_config.dart';

/// Low-level HTTP client for the HABBIT API.
///
/// Injects the auth token when available and maps HTTP errors
/// to [ApiException].
class ApiClient {
  ApiClient({
    http.Client? httpClient,
    this.authToken,
  }) : _http = httpClient ?? http.Client();

  final http.Client _http;

  /// Bearer token for authenticated requests (Supabase JWT).
  /// When null, requests are sent without Authorization (dev auth mode).
  String? authToken;

  String get _base => ApiConfig.baseUrl;

  Map<String, String> _headers({bool hasBody = false}) => {
        'Accept': 'application/json',
        if (authToken != null) 'Authorization': 'Bearer $authToken',
        if (hasBody) 'Content-Type': 'application/json',
      };

  /// GET request.
  Future<dynamic> get(String path) async {
    final response = await _http
        .get(Uri.parse('$_base$path'), headers: _headers())
        .timeout(const Duration(seconds: 12));
    return _decode(response);
  }

  /// POST request with optional JSON body.
  Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    final response = await _http
        .post(
          Uri.parse('$_base$path'),
          headers: _headers(hasBody: body != null),
          body: body != null ? jsonEncode(body) : null,
        )
        .timeout(const Duration(seconds: 12));
    return _decode(response);
  }

  dynamic _decode(http.Response response) {
    final payload =
        response.body.isEmpty ? null : jsonDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return payload;
    }

    String code = 'request_failed';
    if (payload is Map<String, dynamic>) {
      final error = payload['error'];
      if (error is Map<String, dynamic>) {
        code = (error['code'] as String?) ?? code;
      }
    }
    throw ApiException(code, response.statusCode);
  }

  void dispose() => _http.close();
}

/// Represents a structured API error.
class ApiException implements Exception {
  const ApiException(this.code, this.statusCode);

  final String code;
  final int statusCode;

  String get friendlyMessage => switch (code) {
        'authentication_required' || 'invalid_access_token' =>
          'Your session has ended. Please sign in again.',
        'provider_not_configured' =>
          'Verification is not connected yet.',
        'quest_expired' =>
          'This quest has expired. Refresh your path.',
        'quest_not_found' =>
          'This quest could not be found.',
        'legacy_mutation_disabled' =>
          'Quest completion is not enabled on this server.',
        'duplicate_submission' =>
          'That proof was already submitted.',
        _ => 'The quest service could not complete that action.',
      };

  @override
  String toString() => 'ApiException($code, $statusCode)';
}
