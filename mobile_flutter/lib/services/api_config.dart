/// Central API configuration.
///
/// The base URL is configurable via `--dart-define=API_BASE_URL=…`.
///
/// Defaults:
/// * Android emulator  → `http://10.0.2.2:3001`
/// * Physical device    → pass your LAN IP
/// * Desktop            → `http://localhost:3001`
///
/// Example:
/// ```bash
/// flutter run --dart-define=API_BASE_URL=http://192.168.1.42:3001
/// ```
class ApiConfig {
  ApiConfig._();

  /// Backend base URL — never includes a trailing `/api`.
  /// The service layer appends the correct path prefix.
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3001',
  );
}
