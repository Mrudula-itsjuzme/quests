import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'theme/app_colors.dart';
import 'theme/app_theme.dart';
import '../models/quest.dart';
import '../services/api_client.dart';
import '../services/quest_service.dart';
import '../state/quest_controller.dart';
import '../screens/home/home_screen.dart';
import '../screens/quests/quests_screen.dart';
import '../screens/quests/quest_detail_screen.dart';
import '../screens/guild/guild_screen.dart';
import '../screens/rewards/rewards_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../widgets/fantasy/fantasy_bottom_nav.dart';
import '../widgets/fantasy/fantasy_panel.dart';
import '../app_services.dart';

/// Root application widget.
class HabbitQuestApp extends StatelessWidget {
  const HabbitQuestApp({super.key, this.services, this.httpClient});

  final QuestMobileServices? services;
  final dynamic httpClient; // Using dynamic to avoid importing http in app.dart, but typically it would be typed or handled via a provider.

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HABBIT Quest',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      home: services == null
          ? QuestShell(httpClient: httpClient)
          : _AuthGate(services: services!),
    );
  }
}

/// Auth gate: checks Supabase session, shows login or app shell.
class _AuthGate extends StatefulWidget {
  const _AuthGate({required this.services});
  final QuestMobileServices services;

  @override
  State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate> {
  StreamSubscription<AuthState>? _sub;
  User? _user;

  @override
  void initState() {
    super.initState();
    _user = widget.services.currentUser;
    _sub = widget.services.authChanges.listen((state) {
      if (mounted) setState(() => _user = state.session?.user);
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_user == null) {
      return _SimpleLoginPlaceholder(services: widget.services);
    }
    return FutureBuilder<MobileProfile>(
      future: widget.services.api.getProfile(),
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return _LoadingScreen(label: 'Opening your quest log…');
        }
        if (snap.hasError) {
          return _ErrorScreen(
            message: snap.error is MobileApiException
                ? (snap.error! as MobileApiException).friendlyMessage
                : 'The quest service is unavailable.',
            onRetry: () => setState(() {}),
          );
        }
        final profile = snap.data!;
        return QuestShell(
          profile: profile,
          services: widget.services,
        );
      },
    );
  }
}

/// The main app shell with bottom navigation and quest controller.
///
/// Works in two modes:
/// * **Authenticated** — Supabase services + V1/legacy API.
/// * **Dev / offline** — uses legacy API directly via `DEV_AUTH_ENABLED`.
class QuestShell extends StatefulWidget {
  const QuestShell({
    super.key,
    this.profile,
    this.services,
    this.httpClient,
  });

  final MobileProfile? profile;
  final QuestMobileServices? services;
  final dynamic httpClient;

  @override
  State<QuestShell> createState() => _QuestShellState();
}

class _QuestShellState extends State<QuestShell> {
  int _selectedIndex = 0;
  late final ApiClient _apiClient;
  late final QuestService _questService;
  late final QuestController _controller;

  // Profile data (from services or defaults).
  String get _displayName =>
      widget.profile?.displayName ?? 'Adventurer';
  int get _level => widget.profile?.level ?? 1;
  String get _tier => _tierForLevel(_level);
  int get _totalXp => widget.profile?.totalXp ?? 0;
  int get _xpIntoLevel => widget.profile?.xpIntoLevel ?? 0;
  int get _xpForCurrentLevel =>
      widget.profile?.xpForCurrentLevel ?? 250;
  int get _streakDays => widget.profile?.streakDays ?? 0;
  String? get _primaryPath => widget.profile?.primaryPath;
  String? get _reminderTime => widget.profile?.reminderTime;
  String get _timezone => widget.profile?.timezone ?? 'UTC';
  String get _motionPref =>
      widget.profile?.motionPreference ?? 'system';

  @override
  void initState() {
    super.initState();
    // Set up API client — uses Supabase token if available.
    final token = widget.services?.client.auth.currentSession?.accessToken;
    _apiClient = ApiClient(authToken: token, httpClient: widget.httpClient);
    _questService = QuestService(_apiClient);
    _controller = QuestController(_questService);
    _controller.loadAll();
  }

  @override
  void dispose() {
    _controller.dispose();
    _apiClient.dispose();
    super.dispose();
  }

  void _openQuestDetail(Quest quest) {
    QuestDetailSheet.show(context,
        quest: quest, controller: _controller);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.ink,
      body: SafeArea(
        bottom: false,
        child: ListenableBuilder(
          listenable: _controller,
          builder: (context, _) {
            return Column(
              children: [
                // Loading indicator
                if (_controller.state == LoadingState.loading)
                  const LinearProgressIndicator(
                    minHeight: 2,
                    color: AppColors.antiqueGold,
                    backgroundColor: AppColors.deepBrown,
                  ),

                // Error banner
                if (_controller.errorMessage != null)
                  _ErrorBanner(
                    message: _controller.errorMessage!,
                    onDismiss: _controller.clearError,
                    onRetry: _controller.loadAll,
                  ),

                // Main content
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: _controller.state == LoadingState.error &&
                            _controller.quests.isEmpty
                        ? _FullErrorPanel(
                            message: _controller.errorMessage ??
                                'Could not load quests.',
                            onRetry: _controller.loadAll,
                          )
                        : KeyedSubtree(
                            key: ValueKey(_selectedIndex),
                            child: _buildScreen(),
                          ),
                  ),
                ),

                // Bottom navigation
                FantasyBottomNav(
                  selectedIndex: _selectedIndex,
                  onSelected: (i) =>
                      setState(() => _selectedIndex = i),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildScreen() => switch (_selectedIndex) {
        0 => HomeScreen(
            controller: _controller,
            displayName: _displayName,
            level: _level,
            tier: _tier,
            totalXp: _totalXp,
            xpIntoLevel: _xpIntoLevel,
            xpForCurrentLevel: _xpForCurrentLevel,
            streakDays: _streakDays,
            onViewAllQuests: () =>
                setState(() => _selectedIndex = 1),
            onQuestTap: _openQuestDetail,
            onNotifications: () => _showMessage(
              'No new notices',
              'Your path is clear.',
            ),
          ),
        1 => QuestsScreen(
            controller: _controller,
            onQuestTap: _openQuestDetail,
          ),
        2 => const GuildScreen(),
        3 => RewardsScreen(
            controller: _controller,
            level: _level,
            streakDays: _streakDays,
          ),
        _ => ProfileScreen(
            displayName: _displayName,
            level: _level,
            tier: _tier,
            totalXp: _totalXp,
            xpIntoLevel: _xpIntoLevel,
            xpForCurrentLevel: _xpForCurrentLevel,
            streakDays: _streakDays,
            primaryPath: _primaryPath,
            reminderTime: _reminderTime,
            timezone: _timezone,
            motionPreference: _motionPref,
            onSignOut: widget.services?.signOut,
          ),
      };

  void _showMessage(String title, String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.notifications_none_rounded,
                  color: AppColors.brightGold),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            color: AppColors.parchment,
                            fontWeight: FontWeight.w700)),
                    Text(message,
                        style:
                            const TextStyle(color: AppColors.mutedText)),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
  }

  static String _tierForLevel(int level) {
    if (level <= 20) return 'Bronze';
    if (level <= 40) return 'Silver';
    if (level <= 60) return 'Gold';
    if (level <= 80) return 'Platinum';
    if (level <= 100) return 'Mythril';
    if (level <= 120) return 'Diamond';
    return 'Ascendant';
  }
}

// ─── Shared utility widgets ─────────────────────────────────────

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.ink,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(
                  color: AppColors.antiqueGold),
              const SizedBox(height: 18),
              Text(label,
                  style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ),
      );
}

class _ErrorScreen extends StatelessWidget {
  const _ErrorScreen({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.ink,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cloud_off_rounded,
                    color: AppColors.error, size: 40),
                const SizedBox(height: 16),
                Text('The path is unavailable.',
                    style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 8),
                Text(message, textAlign: TextAlign.center),
                const SizedBox(height: 20),
                FilledButton(
                    onPressed: onRetry,
                    child: const Text('Try again')),
              ],
            ),
          ),
        ),
      );
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({
    required this.message,
    required this.onDismiss,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onDismiss;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      color: AppColors.error.withValues(alpha: 0.12),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded,
              color: AppColors.error, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                  color: AppColors.parchment, fontSize: 12),
              maxLines: 2,
            ),
          ),
          TextButton(
            onPressed: onRetry,
            child: const Text('Retry',
                style: TextStyle(fontSize: 12)),
          ),
          GestureDetector(
            onTap: onDismiss,
            child: const Icon(Icons.close_rounded,
                color: AppColors.mutedText, size: 16),
          ),
        ],
      ),
    );
  }
}

class _FullErrorPanel extends StatelessWidget {
  const _FullErrorPanel({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: FantasyPanel(
          goldBorder: true,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.error.withValues(alpha: 0.12),
                  border: Border.all(color: AppColors.error),
                ),
                child: const Icon(Icons.cloud_off_rounded,
                    color: AppColors.error, size: 26),
              ),
              const SizedBox(height: 16),
              Text(
                'The quest server is unreachable.',
                style: Theme.of(context).textTheme.headlineSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                message,
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SimpleLoginPlaceholder extends StatelessWidget {
  const _SimpleLoginPlaceholder({required this.services});
  final QuestMobileServices services;

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.ink,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('HABBIT QUEST',
                    style: TextStyle(
                      fontFamily: 'Cinzel',
                      color: AppColors.brightGold,
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.5,
                    )),
                const SizedBox(height: 8),
                Text('Sign in to begin your quest.',
                    style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: 24),
                const Text(
                  'Supabase authentication is required.\nConfigure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.',
                  textAlign: TextAlign.center,
                  style:
                      TextStyle(color: AppColors.mutedText, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      );
}
