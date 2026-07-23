import 'package:flutter/material.dart';

import 'app/app.dart';
import 'app_services.dart';

/// Entry point for the HABBIT Quest mobile application.
///
/// Initializes Supabase services when configured, then launches
/// the fantasy quest journal app shell.
///
/// Run without Supabase (dev mode, legacy API):
/// ```bash
/// flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
/// ```
///
/// Run with Supabase auth:
/// ```bash
/// flutter run \
///   --dart-define=SUPABASE_URL=https://your-project.supabase.co \
///   --dart-define=SUPABASE_PUBLISHABLE_KEY=your-anon-key \
///   --dart-define=API_BASE_URL=http://10.0.2.2:3001
/// ```
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final services = await QuestMobileServices.createFromEnvironment();
  runApp(HabbitQuestApp(services: services));
}
