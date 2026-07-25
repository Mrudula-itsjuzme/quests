import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../services/cosmetic_preferences.dart';
import '../../widgets/fantasy/fantasy_panel.dart';
import '../../widgets/fantasy/gold_progress_bar.dart';
import '../../widgets/fantasy/reference_components.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({
    super.key,
    required this.displayName,
    required this.level,
    required this.tier,
    required this.totalXp,
    required this.xpIntoLevel,
    required this.xpForCurrentLevel,
    required this.streakDays,
    required this.totalQuests,
    required this.completedQuests,
    required this.relicCount,
    required this.primaryPath,
    required this.reminderTime,
    required this.timezone,
    required this.motionPreference,
    this.onReplayTour,
    this.onSignOut,
  });

  final String displayName;
  final int level;
  final String tier;
  final int totalXp;
  final int xpIntoLevel;
  final int xpForCurrentLevel;
  final int streakDays;
  final int totalQuests;
  final int completedQuests;
  final int relicCount;
  final String? primaryPath;
  final String? reminderTime;
  final String timezone;
  final String motionPreference;
  final VoidCallback? onReplayTour;
  final Future<void> Function()? onSignOut;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  CosmeticPreferences _cosmetics = const CosmeticPreferences();

  @override
  void initState() {
    super.initState();
    CosmeticPreferences.load().then((value) {
      if (mounted) setState(() => _cosmetics = value);
    });
  }

  String get _rank {
    if (widget.totalXp >= 2000) return 'Gold I';
    if (widget.totalXp >= 1000) return 'Silver II';
    if (widget.totalXp >= 500) return 'Novice III';
    return 'Novice I';
  }

  @override
  Widget build(BuildContext context) {
    final xpProgress = widget.xpForCurrentLevel > 0
        ? widget.xpIntoLevel / widget.xpForCurrentLevel
        : 0.0;
    return CustomScrollView(
      key: const Key('profile-screen'),
      slivers: [
        SliverList.list(children: [
          ReferencePlayerHeader(
              page: 'Profile',
              displayName: widget.displayName,
              level: widget.level,
              totalXp: widget.totalXp),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 30),
            child: Column(children: [
              FantasyPanel(
                padding: EdgeInsets.zero,
                goldBorder: true,
                child: Column(children: [
                  const WayfarerPortrait(height: 410),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(20, 18, 20, 22),
                    decoration: const BoxDecoration(
                        gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, AppColors.ink])),
                    child: Row(children: [
                      const Icon(Icons.energy_savings_leaf_rounded,
                          color: AppColors.brightGold, size: 34),
                      const SizedBox(width: 12),
                      Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_cosmetics.title,
                                style:
                                    Theme.of(context).textTheme.headlineSmall),
                            const Text('Wander. Discover. Become.',
                                style: TextStyle(
                                    color: AppColors.parchmentDark,
                                    fontFamily: 'Cinzel')),
                          ]),
                    ]),
                  ),
                ]),
              ),
              const SizedBox(height: 12),
              FantasyPanel(
                goldBorder: true,
                child: Column(children: [
                  Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _LevelLabel(level: widget.level),
                        GoldProgressRing(
                          value: xpProgress,
                          child:
                              Column(mainAxisSize: MainAxisSize.min, children: [
                            Text('${widget.xpIntoLevel}',
                                style: const TextStyle(
                                    color: AppColors.parchment,
                                    fontSize: 23,
                                    fontFamily: 'Cinzel')),
                            Text('/ ${widget.xpForCurrentLevel} XP',
                                style: const TextStyle(
                                    color: AppColors.parchmentDark,
                                    fontSize: 10)),
                          ]),
                        ),
                      ]),
                  const SizedBox(height: 18),
                  GoldProgressBar(value: xpProgress, label: 'XP progress'),
                  const SizedBox(height: 18),
                  Row(children: [
                    Expanded(
                        child: _MiniStat(
                            icon: Icons.receipt_long_rounded,
                            value: '${widget.completedQuests}',
                            label: 'Completed')),
                    Expanded(
                        child: _MiniStat(
                            icon: Icons.local_fire_department_rounded,
                            value: '${widget.streakDays}',
                            label: 'Day streak')),
                    Expanded(
                        child: _MiniStat(
                            icon: Icons.explore_rounded,
                            value: _rank,
                            label: 'Path rank')),
                  ]),
                ]),
              ),
              const SizedBox(height: 12),
              _GuildPanel(
                  onTap: () =>
                      _notice('Guild membership is not connected yet.')),
              const SizedBox(height: 12),
              _Achievements(
                  completed: widget.completedQuests,
                  streak: widget.streakDays,
                  relics: widget.relicCount),
              const SizedBox(height: 12),
              _StatsPanel(
                  total: widget.totalQuests,
                  completed: widget.completedQuests,
                  relics: widget.relicCount,
                  level: widget.level,
                  xp: widget.totalXp),
              const SizedBox(height: 12),
              _BannerPanel(cosmetics: _cosmetics, onChoose: _showOptions),
              const SizedBox(height: 12),
              _GearPanel(cosmetics: _cosmetics, onChoose: _select),
              const SizedBox(height: 12),
              _CustomisationPanel(
                  cosmetics: _cosmetics, onChoose: _showOptions),
              const SizedBox(height: 12),
              FantasyPanel(
                child: Column(children: [
                  ListTile(
                      leading: const Icon(Icons.explore_outlined,
                          color: AppColors.antiqueGold),
                      title: const Text('Primary path'),
                      subtitle: Text(widget.primaryPath ?? 'Not selected')),
                  ListTile(
                      leading: const Icon(Icons.notifications_none_rounded,
                          color: AppColors.antiqueGold),
                      title: const Text('Reminder'),
                      subtitle: Text(
                          '${widget.reminderTime ?? 'Not set'} · ${widget.timezone}')),
                  ListTile(
                      leading: const Icon(Icons.animation_rounded,
                          color: AppColors.antiqueGold),
                      title: const Text('Motion'),
                      subtitle: Text(widget.motionPreference)),
                ]),
              ),
              if (widget.onReplayTour != null)
                OutlinedButton.icon(
                    onPressed: widget.onReplayTour,
                    icon: const Icon(Icons.replay),
                    label: const Text('Replay tour')),
              if (widget.onSignOut != null)
                TextButton.icon(
                    onPressed: widget.onSignOut,
                    icon: const Icon(Icons.logout),
                    label: const Text('Sign out')),
            ]),
          ),
        ]),
      ],
    );
  }

  Future<void> _select(String key, String value) async {
    final next = await _cosmetics.select(key, value);
    if (!mounted) return;
    setState(() => _cosmetics = next);
    _notice('$value equipped.');
  }

  void _showOptions(String key) {
    final options = CosmeticPreferences.options[key] ?? const <String>[];
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.panel,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('Choose $key', style: Theme.of(context).textTheme.headlineSmall),
          ...options.map((value) => ListTile(
                title: Text(value),
                trailing: const Icon(Icons.chevron_right,
                    color: AppColors.antiqueGold),
                onTap: () {
                  Navigator.pop(context);
                  _select(key, value);
                },
              )),
        ]),
      ),
    );
  }

  void _notice(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }
}

class _LevelLabel extends StatelessWidget {
  const _LevelLabel({required this.level});
  final int level;
  @override
  Widget build(BuildContext context) => Column(children: [
        const Text('LEVEL',
            style: TextStyle(
                color: AppColors.brightGold,
                fontFamily: 'Cinzel',
                letterSpacing: 1)),
        Text('$level',
            style: const TextStyle(
                color: AppColors.parchment,
                fontFamily: 'Cinzel',
                fontSize: 58)),
      ]);
}

class _MiniStat extends StatelessWidget {
  const _MiniStat(
      {required this.icon, required this.value, required this.label});
  final IconData icon;
  final String value;
  final String label;
  @override
  Widget build(BuildContext context) => Column(children: [
        Icon(icon, color: AppColors.antiqueGold, size: 30),
        const SizedBox(height: 4),
        Text(value,
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: AppColors.parchment,
                fontFamily: 'Cinzel',
                fontSize: 17)),
        Text(label,
            style:
                const TextStyle(color: AppColors.parchmentDark, fontSize: 10)),
      ]);
}

class _GuildPanel extends StatelessWidget {
  const _GuildPanel({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => FantasyPanel(
          child: ListTile(
        leading: const Icon(Icons.shield_rounded,
            color: AppColors.brightGold, size: 46),
        title: const Text('GUILD',
            style:
                TextStyle(color: AppColors.brightGold, fontFamily: 'Cinzel')),
        subtitle: const Text(
            'Unsworn Wayfarer\nGuild membership is not connected yet.'),
        trailing: IconButton(
            onPressed: onTap,
            icon:
                const Icon(Icons.chevron_right, color: AppColors.antiqueGold)),
      ));
}

class _Achievements extends StatelessWidget {
  const _Achievements(
      {required this.completed, required this.streak, required this.relics});
  final int completed;
  final int streak;
  final int relics;
  @override
  Widget build(BuildContext context) {
    final entries = [
      ('First Steps', Icons.directions_walk, completed >= 1),
      ('Relentless', Icons.local_fire_department, streak >= 7),
      ('Quest Seeker', Icons.receipt_long, completed >= 10),
      ('Pathfinder', Icons.explore, relics >= 5)
    ];
    return FantasyPanel(
        child: Column(children: [
      const Text('ACHIEVEMENTS',
          style: TextStyle(color: AppColors.brightGold, fontFamily: 'Cinzel')),
      const SizedBox(height: 14),
      Row(
          children: entries
              .map((entry) => Expanded(
                  child: Opacity(
                      opacity: entry.$3 ? 1 : .35,
                      child: Column(children: [
                        CircleAvatar(
                            radius: 27,
                            backgroundColor: AppColors.panelRaised,
                            child:
                                Icon(entry.$2, color: AppColors.antiqueGold)),
                        const SizedBox(height: 5),
                        Text(entry.$1,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 9)),
                      ]))))
              .toList()),
    ]));
  }
}

class _StatsPanel extends StatelessWidget {
  const _StatsPanel(
      {required this.total,
      required this.completed,
      required this.relics,
      required this.level,
      required this.xp});
  final int total, completed, relics, level, xp;
  @override
  Widget build(BuildContext context) => FantasyPanel(
          child: Column(children: [
        const Text('STATISTICS',
            style:
                TextStyle(color: AppColors.brightGold, fontFamily: 'Cinzel')),
        _row('Total quests', '$total'),
        _row('Quests completed', '$completed'),
        _row('Relics discovered', '$relics'),
        _row('Current level', '$level'),
        _row('Total XP', '$xp'),
      ]));
  Widget _row(String label, String value) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 9),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label),
        Text(value,
            style: const TextStyle(
                color: AppColors.parchment, fontWeight: FontWeight.w700))
      ]));
}

class _BannerPanel extends StatelessWidget {
  const _BannerPanel({required this.cosmetics, required this.onChoose});
  final CosmeticPreferences cosmetics;
  final ValueChanged<String> onChoose;
  @override
  Widget build(BuildContext context) => FantasyPanel(
          child: Column(children: [
        const Text('EQUIPPED TITLE & BANNER',
            style:
                TextStyle(color: AppColors.brightGold, fontFamily: 'Cinzel')),
        const SizedBox(height: 15),
        const Icon(Icons.explore_rounded,
            color: AppColors.brightGold, size: 86),
        Text(cosmetics.title, style: Theme.of(context).textTheme.headlineSmall),
        Text('${cosmetics.banner} standard',
            style: const TextStyle(color: AppColors.parchmentDark)),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(
              child: OutlinedButton(
                  onPressed: () => onChoose('title'),
                  child: const Text('Change title'))),
          const SizedBox(width: 8),
          Expanded(
              child: OutlinedButton(
                  onPressed: () => onChoose('banner'),
                  child: const Text('Change banner')))
        ]),
      ]));
}

class _GearPanel extends StatelessWidget {
  const _GearPanel({required this.cosmetics, required this.onChoose});
  final CosmeticPreferences cosmetics;
  final void Function(String, String) onChoose;
  @override
  Widget build(BuildContext context) => FantasyPanel(
          child: Column(children: [
        const Text('GEAR PREVIEW',
            style:
                TextStyle(color: AppColors.brightGold, fontFamily: 'Cinzel')),
        const SizedBox(height: 12),
        SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
                children: (CosmeticPreferences.options['gear'] ?? [])
                    .map((item) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                              label: Text(item),
                              selected: cosmetics.gear == item,
                              onSelected: (_) => onChoose('gear', item)),
                        ))
                    .toList())),
      ]));
}

class _CustomisationPanel extends StatelessWidget {
  const _CustomisationPanel({required this.cosmetics, required this.onChoose});
  final CosmeticPreferences cosmetics;
  final ValueChanged<String> onChoose;
  @override
  Widget build(BuildContext context) {
    final entries = [
      ('appearance', cosmetics.appearance, Icons.face),
      ('outfit', cosmetics.outfit, Icons.checkroom),
      ('mount', cosmetics.mount, Icons.pets),
      ('companion', cosmetics.companion, Icons.auto_awesome)
    ];
    return FantasyPanel(
        child: Column(children: [
      const Text('CUSTOMISATION',
          style: TextStyle(color: AppColors.brightGold, fontFamily: 'Cinzel')),
      const SizedBox(height: 12),
      GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 1.7,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          children: entries
              .map((entry) => OutlinedButton.icon(
                  onPressed: () => onChoose(entry.$1),
                  icon: Icon(entry.$3),
                  label: Text('${entry.$1}\n${entry.$2}',
                      textAlign: TextAlign.center)))
              .toList()),
    ]));
  }
}
