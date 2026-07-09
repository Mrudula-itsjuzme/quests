import 'dart:math' as math;

import 'package:flutter/material.dart';

void main() => runApp(const HabbitQuestMobileApp());

class HabbitQuestMobileApp extends StatelessWidget {
  const HabbitQuestMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HABBIT Quest Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        fontFamily: 'serif',
        scaffoldBackgroundColor: AppColors.ink,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.gold,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const FantasyPhoneShell(),
    );
  }
}

class AppColors {
  static const ink = Color(0xFF070B0D);
  static const panel = Color(0xE8121719);
  static const panelSoft = Color(0xD51A2225);
  static const line = Color(0xFF584225);
  static const gold = Color(0xFFE9BD6B);
  static const goldBright = Color(0xFFFFE5A6);
  static const parchment = Color(0xFFF4E0BF);
  static const muted = Color(0xFFAE9D83);
  static const green = Color(0xFF7DBB73);
  static const blue = Color(0xFF76C8FF);
  static const purple = Color(0xFFB08CFF);
  static const orange = Color(0xFFFF8B43);
  static const red = Color(0xFFFF5E61);
}

const _assetSheet = 'assets/images/fantasy-rewards-sheet.png';
const _sheetSize = Size(1536, 864);
const _heroRect = Rect.fromLTWH(34, 30, 350, 790);
const _seasonChestRect = Rect.fromLTWH(395, 55, 430, 360);
const _bronzeChestRect = Rect.fromLTWH(865, 235, 210, 160);
const _silverChestRect = Rect.fromLTWH(1088, 235, 210, 160);
const _goldChestRect = Rect.fromLTWH(1315, 235, 200, 160);
const _bannerRect = Rect.fromLTWH(1310, 610, 200, 235);
const _blueCrystalRect = Rect.fromLTWH(465, 655, 160, 190);
const _purpleCrystalRect = Rect.fromLTWH(640, 655, 165, 190);
const _scrollRect = Rect.fromLTWH(805, 670, 155, 150);
const _keyRect = Rect.fromLTWH(970, 665, 145, 165);
const _coinRect = Rect.fromLTWH(1135, 660, 165, 170);

const _badgeRects = [
  Rect.fromLTWH(445, 462, 135, 135),
  Rect.fromLTWH(625, 462, 135, 135),
  Rect.fromLTWH(805, 462, 135, 135),
  Rect.fromLTWH(985, 462, 135, 135),
  Rect.fromLTWH(1165, 462, 135, 135),
  Rect.fromLTWH(1344, 462, 135, 135),
];

class FantasyPhoneShell extends StatefulWidget {
  const FantasyPhoneShell({super.key});

  @override
  State<FantasyPhoneShell> createState() => _FantasyPhoneShellState();
}

class _FantasyPhoneShellState extends State<FantasyPhoneShell> {
  int selectedIndex = 0;

  static const tabs = [
    _NavItem('Home', Icons.castle_rounded),
    _NavItem('Quests', Icons.flag_rounded),
    _NavItem('Guild', Icons.shield_rounded),
    _NavItem('Rewards', Icons.inventory_2_rounded),
    _NavItem('Profile', Icons.person_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final page = switch (selectedIndex) {
      0 => const HomeScreen(),
      1 => const QuestsScreen(),
      2 => const GuildScreen(),
      3 => const RewardsScreen(),
      _ => const ProfileScreen(),
    };

    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: FantasyBackdrop()),
          SafeArea(
            bottom: false,
            child: Column(
              children: [
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 260),
                    child: page,
                  ),
                ),
                FantasyBottomNav(
                  items: tabs,
                  selectedIndex: selectedIndex,
                  onSelected: (index) => setState(() => selectedIndex = index),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ScreenScroll(
      key: const ValueKey('home'),
      children: const [
        FantasyHeader(title: 'Dashboard'),
        SizedBox(height: 18),
        HomeHero(),
        SizedBox(height: 14),
        FeatureWheel(),
        SizedBox(height: 12),
        TodayQuestsPanel(),
        SizedBox(height: 12),
        DailyChallengePanel(),
      ],
    );
  }
}

class QuestsScreen extends StatelessWidget {
  const QuestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ScreenScroll(
      key: const ValueKey('quests'),
      children: const [
        FantasyHeader(title: 'Quests'),
        SizedBox(height: 14),
        QuestFocusHero(),
        SizedBox(height: 12),
        QuestTabStrip(),
        SizedBox(height: 12),
        _TwoColumn(
          left: ActiveQuestsPanel(),
          right: Column(
            children: [
              WeeklyStreakPanel(),
              SizedBox(height: 12),
              PathRankPanel(),
            ],
          ),
        ),
        SizedBox(height: 12),
        AvailableQuestsPanel(),
      ],
    );
  }
}

class GuildScreen extends StatelessWidget {
  const GuildScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ScreenScroll(
      key: const ValueKey('guild'),
      children: const [
        FantasyHeader(title: 'Guild'),
        SizedBox(height: 14),
        GuildHero(),
        SizedBox(height: 12),
        _TwoColumn(left: PartyMembersPanel(), right: GuildOnlinePanel()),
        SizedBox(height: 12),
        _TwoColumn(left: GuildLeaderboardPanel(), right: GuildWarPanel()),
        SizedBox(height: 12),
        ActivityPanel(),
      ],
    );
  }
}

class RewardsScreen extends StatelessWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ScreenScroll(
      key: const ValueKey('rewards'),
      children: const [
        FantasyHeader(title: 'Rewards'),
        SizedBox(height: 12),
        RewardsHero(),
        SizedBox(height: 12),
        _TwoColumn(left: RewardTrackPanel(), right: BadgesPanel()),
        SizedBox(height: 12),
        _TwoColumn(left: RareLootPanel(), right: ChestCollectionPanel()),
        SizedBox(height: 12),
        _TwoColumn(left: ClaimableRewardsPanel(), right: CurrentRankPanel()),
      ],
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ScreenScroll(
      key: const ValueKey('profile'),
      children: const [
        FantasyHeader(title: 'Profile'),
        SizedBox(height: 12),
        ProfileHero(),
        SizedBox(height: 12),
        _TwoColumn(left: QuestHistoryPanel(), right: EquippedTitlePanel()),
        SizedBox(height: 12),
        StatsPanel(),
        SizedBox(height: 12),
        _TwoColumn(left: GearPreviewPanel(), right: CustomizationPanel()),
      ],
    );
  }
}

class _ScreenScroll extends StatelessWidget {
  const _ScreenScroll({required this.children, super.key});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 18),
      children: children,
    );
  }
}

class FantasyHeader extends StatelessWidget {
  const FantasyHeader({required this.title, super.key});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const ProfileMedallion(),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.parchment,
                  fontSize: 31,
                  height: 1,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 7),
              const Row(
                children: [
                  Flexible(
                    child: Text(
                      'Mind in progress',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: AppColors.parchment,
                        fontSize: 17,
                      ),
                    ),
                  ),
                  SizedBox(width: 8),
                  _GoldDot(),
                ],
              ),
              const SizedBox(height: 9),
              const XpBadge(),
            ],
          ),
        ),
        const HeaderAction(icon: Icons.notifications_none_rounded),
        const SizedBox(width: 9),
        const HeaderAction(icon: Icons.explore_rounded),
      ],
    );
  }
}

class ProfileMedallion extends StatelessWidget {
  const ProfileMedallion({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: 88,
          height: 88,
          padding: const EdgeInsets.all(7),
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: SweepGradient(
              colors: [
                Color(0xFF352817),
                AppColors.gold,
                Color(0xFF111719),
                AppColors.gold,
                Color(0xFF352817),
              ],
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black87,
                blurRadius: 20,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Container(
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFD94C55),
              border: Border.all(color: AppColors.ink, width: 4),
            ),
            child: Stack(
              children: [
                Positioned(
                  right: 7,
                  top: 9,
                  child: _avatarBlob(27, Colors.white.withValues(alpha: 0.38)),
                ),
                Positioned(
                  left: 7,
                  bottom: 7,
                  child: _avatarBlob(23, Colors.white.withValues(alpha: 0.24)),
                ),
                const Center(
                  child: Text(
                    'S',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 36,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        Positioned(
          right: -2,
          bottom: -2,
          child: Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.ink,
              border: Border.all(color: AppColors.gold, width: 1.5),
            ),
            child: const Text(
              '8',
              style: TextStyle(
                color: AppColors.parchment,
                fontSize: 16,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ),
      ],
    );
  }

  static Widget _avatarBlob(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}

class XpBadge extends StatelessWidget {
  const XpBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 27,
          height: 27,
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.gold, width: 1.2),
            color: AppColors.panel,
            shape: BoxShape.circle,
          ),
          child:
              const Icon(Icons.shield_rounded, color: AppColors.gold, size: 16),
        ),
        const SizedBox(width: 9),
        const Flexible(
          child: Text(
            '1,250 XP',
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: AppColors.goldBright,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    );
  }
}

class HeaderAction extends StatelessWidget {
  const HeaderAction({required this.icon, super.key});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.panel,
        border: Border.all(color: AppColors.line, width: 1.4),
        boxShadow: const [
          BoxShadow(
              color: Colors.black54, blurRadius: 16, offset: Offset(0, 8)),
        ],
      ),
      child: Icon(icon, color: AppColors.parchment, size: 27),
    );
  }
}

class HomeHero extends StatelessWidget {
  const HomeHero({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 340,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          const Positioned(top: 8, left: 0, child: StreakShield()),
          Positioned(
            top: 46,
            left: 112,
            right: 104,
            child: AspectRatio(
              aspectRatio: 1,
              child: CustomPaint(
                painter: ArcGaugePainter(value: 0.72),
                child: const _GaugeLabel(
                  label: 'OVERALL SCORE',
                  value: '72',
                  detail: '/100',
                ),
              ),
            ),
          ),
          const Positioned(
              right: -16, bottom: 10, child: HeroGuide(height: 285)),
          Positioned(
            right: 0,
            bottom: 0,
            child: _SpeechBubble(
              text: "Well done. You're building stronger every day.",
              width: 190,
            ),
          ),
        ],
      ),
    );
  }
}

class QuestFocusHero extends StatelessWidget {
  const QuestFocusHero({super.key});

  @override
  Widget build(BuildContext context) {
    return OrnatePanel(
      padding: const EdgeInsets.fromLTRB(16, 16, 10, 0),
      child: SizedBox(
        height: 300,
        child: Stack(
          children: [
            const Positioned(
                right: -12, bottom: -4, child: HeroGuide(height: 275)),
            Positioned(
              left: 0,
              top: 12,
              width: 146,
              height: 146,
              child: CustomPaint(
                painter: ArcGaugePainter(value: 0.6),
                child: const Center(
                  child: Icon(Icons.menu_book_rounded,
                      color: AppColors.goldBright, size: 54),
                ),
              ),
            ),
            const Positioned(
              left: 164,
              top: 36,
              right: 128,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _SectionTitle("TODAY'S FOCUS"),
                  SizedBox(height: 8),
                  Text(
                    "The Scholar's Path",
                    style: TextStyle(
                      color: AppColors.parchment,
                      fontSize: 32,
                      height: 1.02,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text('OBJECTIVE',
                      style: TextStyle(
                          color: AppColors.gold,
                          fontSize: 12,
                          fontWeight: FontWeight.w900)),
                  SizedBox(height: 4),
                  Text('Complete 5 study sessions',
                      style:
                          TextStyle(color: AppColors.parchment, fontSize: 15)),
                  SizedBox(height: 8),
                  Text('3 / 5',
                      style: TextStyle(
                          color: AppColors.parchment,
                          fontSize: 38,
                          fontWeight: FontWeight.w900)),
                  SizedBox(height: 8),
                  MiniProgress(value: 0.6, color: AppColors.gold, height: 6),
                  SizedBox(height: 12),
                  Text(
                    'Knowledge is a blade. Sharpen it.',
                    style: TextStyle(
                        color: AppColors.goldBright,
                        fontSize: 15,
                        fontStyle: FontStyle.italic),
                  ),
                ],
              ),
            ),
            const Positioned(
              right: 0,
              bottom: 18,
              child: _SpeechBubble(
                text: 'Every step forward brings you closer to legend.',
                width: 214,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class RewardsHero extends StatelessWidget {
  const RewardsHero({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 390,
      child: Stack(
        children: [
          const Positioned(right: -12, top: 0, child: HeroGuide(height: 326)),
          Positioned(
            left: 6,
            top: 28,
            width: 230,
            child: Column(
              children: [
                const _SectionTitle('SEASON CHEST'),
                const SizedBox(height: 8),
                const Text(
                  'Complete quests to fill the chest.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.parchment, fontSize: 17),
                ),
                const SizedBox(height: 4),
                const AssetCrop(rect: _seasonChestRect, height: 170),
                const Text(
                  '7,856 / 10,000',
                  style: TextStyle(
                    color: AppColors.parchment,
                    fontSize: 23,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 7),
                const MiniProgress(
                    value: 0.78, color: AppColors.gold, height: 7),
                const SizedBox(height: 6),
                Text(
                  '78% to next reward',
                  style: TextStyle(color: AppColors.goldBright, fontSize: 15),
                ),
              ],
            ),
          ),
          const Positioned(
            right: 0,
            bottom: 28,
            child: _SpeechBubble(
              text: 'Every quest brings you closer to glory.',
              width: 205,
            ),
          ),
        ],
      ),
    );
  }
}

class GuildHero extends StatelessWidget {
  const GuildHero({super.key});

  @override
  Widget build(BuildContext context) {
    return OrnatePanel(
      padding: const EdgeInsets.fromLTRB(16, 16, 12, 0),
      child: SizedBox(
        height: 280,
        child: Stack(
          children: [
            const Positioned(
                left: 0,
                top: 6,
                child: AssetCrop(rect: _bannerRect, width: 108, height: 220)),
            const Positioned(
                right: -14, bottom: -4, child: HeroGuide(height: 270)),
            Positioned(
              left: 130,
              top: 28,
              right: 122,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Emberlight Covenant',
                    style: TextStyle(
                      color: AppColors.parchment,
                      fontSize: 30,
                      height: 1,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '"United in purpose, bound by fire."',
                    style: TextStyle(
                        color: AppColors.muted,
                        fontSize: 15,
                        fontStyle: FontStyle.italic),
                  ),
                  SizedBox(height: 20),
                  Row(
                    children: [
                      _MiniStat(
                          value: '12',
                          label: 'GUILD LEVEL',
                          icon: Icons.shield_rounded),
                      SizedBox(width: 18),
                      _MiniStat(
                          value: '28/50',
                          label: 'MEMBERS',
                          icon: Icons.groups_rounded),
                    ],
                  ),
                  SizedBox(height: 18),
                  Text('GUILD CONTRIBUTION',
                      style: TextStyle(
                          color: AppColors.gold,
                          fontSize: 12,
                          fontWeight: FontWeight.w900)),
                  SizedBox(height: 8),
                  MiniProgress(value: 0.58, color: AppColors.gold, height: 7),
                  SizedBox(height: 4),
                  Text('4,680 / 8,000',
                      style: TextStyle(color: AppColors.muted, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProfileHero extends StatelessWidget {
  const ProfileHero({super.key});

  @override
  Widget build(BuildContext context) {
    return _TwoColumn(
      left: OrnatePanel(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 16),
        child: Column(
          children: const [
            AssetCrop(rect: _heroRect, height: 370),
            SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.eco_rounded, color: AppColors.gold, size: 30),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Wayfarer',
                          style: TextStyle(
                              color: AppColors.parchment,
                              fontSize: 24,
                              fontWeight: FontWeight.w900)),
                      Text('Wander. Discover. Become.',
                          style:
                              TextStyle(color: AppColors.muted, fontSize: 14)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      right: Column(
        children: const [
          ProfileProgressPanel(),
          SizedBox(height: 12),
          GuildSummaryPanel(),
          SizedBox(height: 12),
          AchievementsPanel(),
        ],
      ),
    );
  }
}

class HeroGuide extends StatelessWidget {
  const HeroGuide({required this.height, super.key});

  final double height;

  @override
  Widget build(BuildContext context) {
    return AssetCrop(rect: _heroRect, height: height, fit: BoxFit.contain);
  }
}

class AssetCrop extends StatelessWidget {
  const AssetCrop({
    required this.rect,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    super.key,
  });

  final Rect rect;
  final double? width;
  final double? height;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    final alignment = Alignment(
      ((rect.left + rect.width / 2) / _sheetSize.width) * 2 - 1,
      ((rect.top + rect.height / 2) / _sheetSize.height) * 2 - 1,
    );

    return SizedBox(
      width: width,
      height: height,
      child: FittedBox(
        fit: fit,
        child: ClipRect(
          child: Align(
            alignment: alignment,
            widthFactor: rect.width / _sheetSize.width,
            heightFactor: rect.height / _sheetSize.height,
            child: Image.asset(_assetSheet),
          ),
        ),
      ),
    );
  }
}

class FeatureWheel extends StatelessWidget {
  const FeatureWheel({super.key});

  static const stats = [
    _WheelStat('SLEEP', '7h 24m', 'Good', Icons.nightlight_round,
        AppColors.purple, 0.56),
    _WheelStat('STEPS', '7,856', '/10,000', Icons.directions_run_rounded,
        AppColors.gold, 0.78),
    _WheelStat('CALORIES\nBURNED', '1,757', 'kcal',
        Icons.local_fire_department_rounded, AppColors.orange, 0.58),
    _WheelStat('XP EARNED', '1,250', 'xp', Icons.auto_awesome_rounded,
        AppColors.gold, 0.64),
    _WheelStat('CALORIES\nCONSUMED', '1,320', 'kcal', Icons.restaurant_rounded,
        AppColors.green, 0.66),
  ];

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1.24,
      child: Stack(
        children: [
          Positioned.fill(child: CustomPaint(painter: WheelFramePainter())),
          Align(
            alignment: Alignment.center,
            child: Container(
              width: 118,
              height: 118,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const RadialGradient(
                  colors: [Color(0xFF6B4316), Color(0xFF191A16), AppColors.ink],
                ),
                border: Border.all(color: AppColors.line, width: 2),
                boxShadow: const [
                  BoxShadow(color: Color(0x88FFB84A), blurRadius: 26)
                ],
              ),
              child: const Icon(Icons.explore_rounded,
                  color: AppColors.goldBright, size: 62),
            ),
          ),
          _wheelStat(stats[0], const Alignment(-0.74, -0.18)),
          _wheelStat(stats[1], const Alignment(0, -0.76)),
          _wheelStat(stats[2], const Alignment(0.74, -0.18)),
          _wheelStat(stats[3], const Alignment(0.65, 0.72)),
          _wheelStat(stats[4], const Alignment(-0.65, 0.72)),
        ],
      ),
    );
  }

  static Widget _wheelStat(_WheelStat stat, Alignment alignment) {
    return Align(
      alignment: alignment,
      child: SizedBox(
        width: 106,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(stat.icon, color: stat.color, size: 27),
            const SizedBox(height: 6),
            Text(
              stat.label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.parchment,
                fontSize: 11,
                fontWeight: FontWeight.w900,
                height: 1.08,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              stat.value,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.parchment,
                fontSize: 25,
                height: 1,
                fontWeight: FontWeight.w900,
              ),
            ),
            Text(stat.detail,
                textAlign: TextAlign.center,
                style:
                    const TextStyle(color: AppColors.parchment, fontSize: 12)),
            const SizedBox(height: 7),
            MiniProgress(value: stat.progress, color: stat.color),
          ],
        ),
      ),
    );
  }
}

class TodayQuestsPanel extends StatelessWidget {
  const TodayQuestsPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrnatePanel(
      child: Column(
        children: [
          Row(
            children: [
              _SectionTitle("TODAY'S QUESTS"),
              Spacer(),
              Text('2/3 completed',
                  style: TextStyle(color: AppColors.muted, fontSize: 14)),
            ],
          ),
          SizedBox(height: 15),
          Row(
            children: [
              Expanded(
                  child: QuestTile(
                      icon: Icons.check_rounded,
                      color: AppColors.green,
                      title: 'Walk 10,000\nsteps',
                      progressText: '7,856 / 10,000',
                      progress: 0.78)),
              SizedBox(width: 8),
              Expanded(
                  child: QuestTile(
                      icon: Icons.water_drop_rounded,
                      color: AppColors.blue,
                      title: 'Drink 8 cups\nof water',
                      progressText: '6 / 8',
                      progress: 0.75)),
              SizedBox(width: 8),
              Expanded(
                  child: QuestTile(
                      icon: Icons.favorite_rounded,
                      color: AppColors.red,
                      title: 'Sleep 7+\nhours',
                      progressText: '7h 24m / 7h',
                      progress: 1)),
            ],
          ),
        ],
      ),
    );
  }
}

class DailyChallengePanel extends StatelessWidget {
  const DailyChallengePanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrnatePanel(
      padding: EdgeInsets.fromLTRB(16, 14, 16, 15),
      child: Row(
        children: [
          _RoundIcon(
              icon: Icons.sports_martial_arts_rounded,
              color: AppColors.gold,
              size: 58),
          SizedBox(width: 15),
          Expanded(
            child: Column(
              children: [
                Text('DAILY CHALLENGE',
                    style: TextStyle(
                        color: AppColors.gold,
                        fontSize: 13,
                        fontWeight: FontWeight.w900)),
                SizedBox(height: 5),
                Text('Burn 600 kcal through activity',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.parchment, fontSize: 16)),
                SizedBox(height: 8),
                MiniProgress(value: 0.7, color: AppColors.gold, height: 6),
                SizedBox(height: 5),
                Text('420 / 600 kcal',
                    style: TextStyle(color: AppColors.parchment, fontSize: 13)),
              ],
            ),
          ),
          SizedBox(width: 10),
          AssetCrop(rect: _bronzeChestRect, width: 62, height: 58),
        ],
      ),
    );
  }
}

class QuestTile extends StatelessWidget {
  const QuestTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.progressText,
    required this.progress,
    super.key,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String progressText;
  final double progress;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _RoundIcon(icon: icon, color: color, size: 48),
        const SizedBox(height: 9),
        Text(
          title,
          style: const TextStyle(
            color: AppColors.parchment,
            fontSize: 13,
            height: 1.08,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        MiniProgress(value: progress, color: color),
        const SizedBox(height: 4),
        Text(
          progressText,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: AppColors.parchment, fontSize: 11),
        ),
      ],
    );
  }
}

class QuestTabStrip extends StatelessWidget {
  const QuestTabStrip({super.key});

  @override
  Widget build(BuildContext context) {
    const tabs = [
      (Icons.wb_sunny_rounded, 'DAILY'),
      (Icons.calendar_month_rounded, 'WEEKLY'),
      (Icons.menu_book_rounded, 'STORY'),
      (Icons.bookmark_rounded, 'EVENT'),
    ];
    return OrnatePanel(
      padding: const EdgeInsets.all(6),
      child: Row(
        children: [
          for (var i = 0; i < tabs.length; i++)
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: i == 0 ? const Color(0xFF241B10) : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                  border: i == 0
                      ? Border.all(
                          color: AppColors.gold.withValues(alpha: 0.58))
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(tabs[i].$1,
                        color: i == 0 ? AppColors.goldBright : AppColors.muted,
                        size: 20),
                    const SizedBox(width: 7),
                    Flexible(
                      child: Text(
                        tabs[i].$2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color:
                              i == 0 ? AppColors.goldBright : AppColors.muted,
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class ActiveQuestsPanel extends StatelessWidget {
  const ActiveQuestsPanel({super.key});

  @override
  Widget build(BuildContext context) {
    const rows = [
      _QuestRowData(Icons.wb_sunny_rounded, 'Morning Ritual',
          'Complete your morning routine', '1 / 1', '150', 1),
      _QuestRowData(Icons.menu_book_rounded, 'Read Daily',
          'Read or study for 20 minutes', '12 / 20', '100', 0.6),
      _QuestRowData(Icons.eco_rounded, 'Deep Work', 'Focus for 60 minutes',
          '30 / 60', '200', 0.5),
      _QuestRowData(Icons.hiking_rounded, 'Movement', 'Move for 30 minutes',
          '10 / 30', '100', 0.33),
    ];
    return OrnatePanel(
      child: Column(
        children: [
          const Row(children: [
            _SectionTitle('ACTIVE QUESTS'),
            Spacer(),
            Icon(Icons.chevron_right_rounded, color: AppColors.gold)
          ]),
          const SizedBox(height: 10),
          for (final row in rows) QuestRow(data: row),
          const Divider(color: Color(0x334F3B23)),
          const Text('View All Active',
              style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 15,
                  fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

class QuestRow extends StatelessWidget {
  const QuestRow({required this.data, super.key});

  final _QuestRowData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.panelSoft,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.line.withValues(alpha: 0.55)),
      ),
      child: Row(
        children: [
          _RoundIcon(icon: data.icon, color: AppColors.gold, size: 52),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(data.title,
                    style: const TextStyle(
                        color: AppColors.parchment,
                        fontSize: 16,
                        fontWeight: FontWeight.w900)),
                Text(data.subtitle,
                    style:
                        const TextStyle(color: AppColors.muted, fontSize: 12),
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                        child: MiniProgress(
                            value: data.progress,
                            color: AppColors.gold,
                            height: 5)),
                    const SizedBox(width: 8),
                    Text(data.count,
                        style: const TextStyle(
                            color: AppColors.gold,
                            fontSize: 12,
                            fontWeight: FontWeight.w900)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            children: [
              const Icon(Icons.hexagon_rounded,
                  color: AppColors.gold, size: 34),
              Text(data.xp,
                  style: const TextStyle(
                      color: AppColors.goldBright,
                      fontSize: 16,
                      fontWeight: FontWeight.w900)),
            ],
          ),
        ],
      ),
    );
  }
}

class WeeklyStreakPanel extends StatelessWidget {
  const WeeklyStreakPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrnatePanel(
      child: Column(
        children: [
          _SectionTitle('WEEKLY STREAK'),
          SizedBox(height: 14),
          StreakShield(compact: true),
          SizedBox(height: 14),
          MiniProgress(value: 0.86, color: AppColors.gold, height: 6),
          SizedBox(height: 6),
          Text('Keep the flame alive!',
              style: TextStyle(color: AppColors.goldBright, fontSize: 13)),
        ],
      ),
    );
  }
}

class PathRankPanel extends StatelessWidget {
  const PathRankPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrnatePanel(
      child: Column(
        children: [
          _SectionTitle('PATH RANK'),
          SizedBox(height: 10),
          Icon(Icons.explore_rounded, color: AppColors.goldBright, size: 70),
          Text('Novice III',
              style: TextStyle(
                  color: AppColors.parchment,
                  fontSize: 20,
                  fontWeight: FontWeight.w900)),
          SizedBox(height: 8),
          MiniProgress(value: 0.64, color: AppColors.gold, height: 6),
          SizedBox(height: 5),
          Text('640 / 1,000 XP',
              style: TextStyle(color: AppColors.gold, fontSize: 13)),
        ],
      ),
    );
  }
}

class AvailableQuestsPanel extends StatelessWidget {
  const AvailableQuestsPanel({super.key});

  @override
  Widget build(BuildContext context) {
    const cards = [
      _AvailableQuest(Icons.sports_martial_arts_rounded, 'Train the Mind',
          'Complete a focus session at night', '250', '50'),
      _AvailableQuest(Icons.history_edu_rounded, "Scribe's Duty",
          "Summarize what you've learned", '200', '40'),
      _AvailableQuest(Icons.travel_explore_rounded, 'Seek & Learn',
          'Explore a new topic or skill', '300', '60'),
    ];
    return OrnatePanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              _SectionTitle('AVAILABLE QUESTS'),
              Spacer(),
              Icon(Icons.hourglass_bottom_rounded,
                  color: AppColors.gold, size: 17),
              SizedBox(width: 4),
              Text('New quests in 14h 32m',
                  style: TextStyle(color: AppColors.gold, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              for (var i = 0; i < cards.length; i++) ...[
                Expanded(child: AvailableQuestCard(data: cards[i])),
                if (i != cards.length - 1) const SizedBox(width: 8),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class AvailableQuestCard extends StatelessWidget {
  const AvailableQuestCard({required this.data, super.key});

  final _AvailableQuest data;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.panelSoft,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.line.withValues(alpha: 0.7)),
      ),
      child: Column(
        children: [
          _RoundIcon(icon: data.icon, color: AppColors.gold, size: 54),
          const SizedBox(height: 9),
          Text(
            data.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: AppColors.parchment,
                fontSize: 15,
                fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 4),
          Text(
            data.body,
            maxLines: 2,
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
                color: AppColors.muted, fontSize: 11, height: 1.15),
          ),
          const SizedBox(height: 9),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.shield_rounded, color: AppColors.gold, size: 15),
              Text(' ${data.xp}',
                  style: const TextStyle(
                      color: AppColors.goldBright,
                      fontSize: 12,
                      fontWeight: FontWeight.w900)),
              const SizedBox(width: 8),
              const Icon(Icons.bolt_rounded, color: AppColors.gold, size: 15),
              Text(' ${data.energy}',
                  style: const TextStyle(
                      color: AppColors.goldBright,
                      fontSize: 12,
                      fontWeight: FontWeight.w900)),
            ],
          ),
          const SizedBox(height: 8),
          const _GoldButton(label: 'Accept Quest', compact: true),
        ],
      ),
    );
  }
}

class PartyMembersPanel extends StatelessWidget {
  const PartyMembersPanel({super.key});

  @override
  Widget build(BuildContext context) {
    const members = [
      ('Aric Stormblade', 'Leader', '28', AppColors.gold),
      ('Lyra Moonwhisper', 'Online', '24', AppColors.green),
      ('Thorin Ironfist', 'In Quest', '20', AppColors.blue),
      ('Kaelen Shadowstep', 'Away', '18', AppColors.orange),
      ('Vespera Nightfall', 'Offline', '16', AppColors.muted),
    ];
    return OrnatePanel(
      child: Column(
        children: [
          const Row(
            children: [
              _SectionTitle('PARTY MEMBERS'),
              Spacer(),
              Text('4/5 Online',
                  style: TextStyle(color: AppColors.green, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 10),
          for (final member in members)
            _RosterRow(
                name: member.$1,
                status: member.$2,
                level: member.$3,
                color: member.$4),
          const _GoldButton(label: 'View All Members'),
        ],
      ),
    );
  }
}

class GuildOnlinePanel extends StatelessWidget {
  const GuildOnlinePanel({super.key});

  @override
  Widget build(BuildContext context) {
    return OrnatePanel(
      child: Column(
        children: [
          const Row(children: [
            _SectionTitle('FRIENDS ONLINE'),
            Spacer(),
            Text('6 Online',
                style: TextStyle(color: AppColors.green, fontSize: 13))
          ]),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              for (final rect in _badgeRects.take(5))
                AssetCrop(rect: rect, width: 42, height: 42),
              Container(
                width: 42,
                height: 42,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.line),
                    color: AppColors.panelSoft),
                child: const Text('+2',
                    style: TextStyle(
                        color: AppColors.parchment,
                        fontWeight: FontWeight.w900)),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const _GoldButton(label: 'View Friends'),
          const SizedBox(height: 12),
          const CoOpQuestsPanel(),
        ],
      ),
    );
  }
}

class CoOpQuestsPanel extends StatelessWidget {
  const CoOpQuestsPanel({super.key});

  @override
  Widget build(BuildContext context) {
    const rows = [
      ('Ancient Ruins', 'Normal', '3/5', AppColors.green),
      ('Shadow Crypt', 'Hard', '2/5', AppColors.orange),
      ("Wyrm's Lair", 'Elite', '0/5', AppColors.red),
    ];
    return Column(
      children: [
        const Row(children: [
          Icon(Icons.groups_rounded, color: AppColors.gold, size: 18),
          SizedBox(width: 6),
          _SectionTitle('CO-OP QUESTS')
        ]),
        const SizedBox(height: 8),
        for (final row in rows)
          _InfoRow(
              title: row.$1, subtitle: row.$2, trailing: row.$3, color: row.$4),
        const SizedBox(height: 8),
        const _GoldButton(label: 'Browse Quests'),
      ],
    );
  }
}

class GuildLeaderboardPanel extends StatelessWidget {
  const GuildLeaderboardPanel({super.key});

  @override
  Widget build(BuildContext context) {
    const rows = [
      ('1', 'Aric Stormblade', '2,450'),
      ('2', 'Lyra Moonwhisper', '2,010'),
      ('3', 'Thorin Ironfist', '1,650'),
      ('4', 'Kaelen Shadowstep', '1,230'),
    ];
    return OrnatePanel(
      child: Column(
        children: [
          const Row(children: [
            Icon(Icons.emoji_events_rounded, color: AppColors.gold),
            SizedBox(width: 6),
            _SectionTitle('GUILD LEADERBOARD')
          ]),
          const SizedBox(height: 8),
          for (final row in rows)
            _InfoRow(
                title: '${row.$1}. ${row.$2}',
                subtitle: 'weekly contribution',
                trailing: row.$3,
                color: AppColors.gold),
          const SizedBox(height: 8),
          const _GoldButton(label: 'View Full Leaderboard'),
        ],
      ),
    );
  }
}

class GuildWarPanel extends StatelessWidget {
  const GuildWarPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return OrnatePanel(
      child: Column(
        children: const [
          AssetCrop(rect: _bannerRect, width: 86, height: 96),
          SizedBox(height: 6),
          Text('Stonewatch Siege',
              style: TextStyle(
                  color: AppColors.parchment,
                  fontSize: 20,
                  fontWeight: FontWeight.w900)),
          Text('vs. Ironhold Vanguard',
              style: TextStyle(color: AppColors.muted, fontSize: 13)),
          SizedBox(height: 10),
          MiniProgress(value: 0.62, color: AppColors.gold, height: 8),
          SizedBox(height: 5),
          Row(children: [
            Text('3,450', style: TextStyle(color: AppColors.goldBright)),
            Spacer(),
            Text('2,180', style: TextStyle(color: AppColors.red))
          ]),
          SizedBox(height: 12),
          _GoldButton(label: 'View War Board'),
        ],
      ),
    );
  }
}

class ActivityPanel extends StatelessWidget {
  const ActivityPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrnatePanel(
      child: Column(
        children: [
          Row(children: [
            Icon(Icons.shield_rounded, color: AppColors.gold),
            SizedBox(width: 6),
            _SectionTitle('RECENT ACTIVITY')
          ]),
          SizedBox(height: 8),
          _InfoRow(
              title: 'Lyra completed Ancient Ruins.',
              subtitle: '12m ago',
              trailing: '›',
              color: AppColors.green),
          _InfoRow(
              title: 'Thorin earned 250 Contribution.',
              subtitle: '1h ago',
              trailing: '›',
              color: AppColors.blue),
          _InfoRow(
              title: 'Aric unlocked Banner of Valor.',
              subtitle: '3h ago',
              trailing: '›',
              color: AppColors.gold),
          SizedBox(height: 8),
          _GoldButton(label: 'View All Activity'),
        ],
      ),
    );
  }
}

class RewardTrackPanel extends StatelessWidget {
  const RewardTrackPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return OrnatePanel(
      child: Row(
        children: const [
          _ShieldNumber(value: '32'),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionTitle('REWARD TRACK'),
                SizedBox(height: 12),
                Text('Level 32',
                    style: TextStyle(
                        color: AppColors.parchment,
                        fontSize: 19,
                        fontWeight: FontWeight.w900)),
                Text('Veteran Seeker',
                    style: TextStyle(color: AppColors.muted, fontSize: 14)),
                SizedBox(height: 10),
                MiniProgress(value: 0.85, color: AppColors.gold, height: 7),
                SizedBox(height: 5),
                Text('4,250 / 5,000 XP',
                    style: TextStyle(color: AppColors.gold, fontSize: 14)),
              ],
            ),
          ),
          SizedBox(width: 10),
          AssetCrop(rect: _bannerRect, width: 64, height: 112),
        ],
      ),
    );
  }
}

class BadgesPanel extends StatelessWidget {
  const BadgesPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return OrnatePanel(
      child: Column(
        children: [
          const _SectionTitle('BADGES'),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: const [
              AssetCrop(
                  rect: Rect.fromLTWH(445, 462, 135, 135),
                  width: 60,
                  height: 60),
              AssetCrop(
                  rect: Rect.fromLTWH(805, 462, 135, 135),
                  width: 60,
                  height: 60),
              AssetCrop(
                  rect: Rect.fromLTWH(1165, 462, 135, 135),
                  width: 60,
                  height: 60),
            ],
          ),
          const SizedBox(height: 10),
          const _GoldButton(label: 'View All Badges'),
        ],
      ),
    );
  }
}

class RareLootPanel extends StatelessWidget {
  const RareLootPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrnatePanel(
      child: Column(
        children: [
          _SectionTitle('RARE LOOT'),
          SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              LootIcon(rect: _purpleCrystalRect, count: '2'),
              LootIcon(rect: _scrollRect, count: '1'),
              LootIcon(rect: _keyRect, count: '1'),
              LootIcon(rect: _coinRect, count: '250'),
            ],
          ),
          SizedBox(height: 12),
          _GoldButton(label: 'View Inventory'),
        ],
      ),
    );
  }
}

class ChestCollectionPanel extends StatelessWidget {
  const ChestCollectionPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrnatePanel(
      child: Column(
        children: [
          _SectionTitle('CHEST COLLECTION'),
          SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              ChestCount(rect: _bronzeChestRect, count: '12'),
              ChestCount(rect: _silverChestRect, count: '6'),
              ChestCount(rect: _goldChestRect, count: '1'),
            ],
          ),
          SizedBox(height: 10),
          _GoldButton(label: 'View Collection'),
        ],
      ),
    );
  }
}

class ClaimableRewardsPanel extends StatelessWidget {
  const ClaimableRewardsPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrnatePanel(
      child: Column(
        children: [
          _SectionTitle('CLAIMABLE REWARDS'),
          SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              LootIcon(rect: _blueCrystalRect, count: '250'),
              LootIcon(rect: _scrollRect, count: '2'),
              LootIcon(rect: _coinRect, count: '500'),
            ],
          ),
          SizedBox(height: 14),
          _GoldButton(label: 'Claim All', filled: true),
        ],
      ),
    );
  }
}

class CurrentRankPanel extends StatelessWidget {
  const CurrentRankPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrnatePanel(
      child: Row(
        children: [
          _ShieldNumber(value: 'III', icon: Icons.pets_rounded),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionTitle('CURRENT RANK'),
                SizedBox(height: 10),
                Text('IRON III',
                    style: TextStyle(
                        color: AppColors.gold,
                        fontSize: 18,
                        fontWeight: FontWeight.w900)),
                Text('Honor Score',
                    style: TextStyle(color: AppColors.muted, fontSize: 13)),
                SizedBox(height: 4),
                Text('1,250',
                    style: TextStyle(
                        color: AppColors.parchment,
                        fontSize: 32,
                        fontWeight: FontWeight.w900)),
                MiniProgress(value: 0.69, color: AppColors.gold, height: 7),
                SizedBox(height: 5),
                Text('1,250 / 1,800',
                    style: TextStyle(color: AppColors.gold, fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ProfileProgressPanel extends StatelessWidget {
  const ProfileProgressPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return OrnatePanel(
      child: Column(
        children: [
          const Row(
            children: [
              Expanded(
                  child: _MiniStat(
                      value: '8', label: 'LEVEL', icon: Icons.shield_rounded)),
              SizedBox(width: 10),
              Expanded(
                child: SizedBox(
                  height: 116,
                  child: CustomPaint(
                    painter: ArcGaugePainter(value: 0.63),
                    child: _GaugeLabel(
                        label: 'XP PROGRESS',
                        value: '1,250',
                        detail: '/ 2,000 XP',
                        small: true),
                  ),
                ),
              ),
            ],
          ),
          const Divider(color: Color(0x334F3B23)),
          Row(
            children: const [
              Expanded(
                  child: _MiniStat(
                      value: '42',
                      label: 'QUESTS\nCOMPLETED',
                      icon: Icons.history_edu_rounded)),
              Expanded(
                  child: _MiniStat(
                      value: '12',
                      label: 'CURRENT\nSTREAK',
                      icon: Icons.local_fire_department_rounded)),
              Expanded(
                  child: _MiniStat(
                      value: 'Silver II',
                      label: 'PATH\nRANK',
                      icon: Icons.explore_rounded)),
            ],
          ),
        ],
      ),
    );
  }
}

class GuildSummaryPanel extends StatelessWidget {
  const GuildSummaryPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrnatePanel(
      child: Row(
        children: [
          AssetCrop(rect: _bannerRect, width: 70, height: 86),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionTitle('GUILD'),
                Text('Dawnwardens',
                    style: TextStyle(
                        color: AppColors.parchment,
                        fontSize: 21,
                        fontWeight: FontWeight.w900)),
                Text('Rank: Initiate',
                    style: TextStyle(color: AppColors.muted, fontSize: 13)),
                Text('Together, we rise.',
                    style:
                        TextStyle(color: AppColors.goldBright, fontSize: 13)),
              ],
            ),
          ),
          Icon(Icons.chevron_right_rounded, color: AppColors.gold, size: 28),
        ],
      ),
    );
  }
}

class AchievementsPanel extends StatelessWidget {
  const AchievementsPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return OrnatePanel(
      child: Column(
        children: [
          const _SectionTitle('ACHIEVEMENTS'),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              for (final rect in _badgeRects.take(4))
                AssetCrop(rect: rect, width: 52, height: 52),
            ],
          ),
        ],
      ),
    );
  }
}

class QuestHistoryPanel extends StatelessWidget {
  const QuestHistoryPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrnatePanel(
      child: Column(
        children: [
          Row(children: [
            _SectionTitle('QUEST HISTORY'),
            Spacer(),
            Icon(Icons.chevron_right_rounded, color: AppColors.gold)
          ]),
          SizedBox(height: 12),
          _InfoRow(
              title: 'The Lost Relic',
              subtitle: 'Completed',
              trailing: 'Today',
              color: AppColors.green),
          _InfoRow(
              title: 'Whispers in the Woods',
              subtitle: 'Completed',
              trailing: '2d ago',
              color: AppColors.green),
          _InfoRow(
              title: 'Bandit Ambush',
              subtitle: 'Completed',
              trailing: '5d ago',
              color: AppColors.green),
          SizedBox(height: 10),
          _GoldButton(label: 'View All History'),
        ],
      ),
    );
  }
}

class EquippedTitlePanel extends StatelessWidget {
  const EquippedTitlePanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const OrnatePanel(
      child: Column(
        children: [
          Row(children: [
            _SectionTitle('EQUIPPED TITLE'),
            Spacer(),
            Icon(Icons.edit_rounded, color: AppColors.gold, size: 18)
          ]),
          SizedBox(height: 10),
          AssetCrop(rect: _bannerRect, width: 96, height: 130),
          SizedBox(height: 6),
          Text('Wayfarer',
              style: TextStyle(
                  color: AppColors.parchment,
                  fontSize: 23,
                  fontWeight: FontWeight.w900)),
          Text('Seeker of Paths',
              style: TextStyle(color: AppColors.muted, fontSize: 14)),
          SizedBox(height: 12),
          _GoldButton(label: 'Change Title'),
        ],
      ),
    );
  }
}

class StatsPanel extends StatelessWidget {
  const StatsPanel({super.key});

  @override
  Widget build(BuildContext context) {
    const stats = [
      ('Total Quests', '42', Icons.history_edu_rounded),
      ('Quests Completed', '38', Icons.verified_rounded),
      ('Lore Discovered', '56 / 120', Icons.map_rounded),
      ('Regions Explored', '7 / 15', Icons.auto_awesome_rounded),
      ('Bosses Defeated', '4', Icons.shield_rounded),
    ];
    return OrnatePanel(
      child: Column(
        children: [
          const Row(children: [
            _SectionTitle('STATISTICS'),
            Spacer(),
            Icon(Icons.bar_chart_rounded, color: AppColors.gold)
          ]),
          const SizedBox(height: 10),
          for (final row in stats)
            _InfoRow(
                title: row.$1,
                subtitle: '',
                trailing: row.$2,
                color: AppColors.gold,
                icon: row.$3),
          const SizedBox(height: 8),
          const _GoldButton(label: 'View Full Stats'),
        ],
      ),
    );
  }
}

class GearPreviewPanel extends StatelessWidget {
  const GearPreviewPanel({super.key});

  @override
  Widget build(BuildContext context) {
    const rects = [_bannerRect, _scrollRect, _keyRect, _coinRect];
    return OrnatePanel(
      child: Column(
        children: [
          const _SectionTitle('GEAR PREVIEW'),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              for (final rect in rects)
                Container(
                  width: 54,
                  height: 54,
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.panelSoft,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: AppColors.line.withValues(alpha: 0.7)),
                  ),
                  child: AssetCrop(rect: rect),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class CustomizationPanel extends StatelessWidget {
  const CustomizationPanel({super.key});

  @override
  Widget build(BuildContext context) {
    const items = [
      (Icons.face_rounded, 'Appearance'),
      (Icons.checkroom_rounded, 'Outfit'),
      (Icons.directions_run_rounded, 'Mount'),
      (Icons.pets_rounded, 'Companion'),
    ];
    return OrnatePanel(
      child: Column(
        children: [
          const _SectionTitle('CUSTOMIZATION'),
          const SizedBox(height: 12),
          Row(
            children: [
              for (var i = 0; i < items.length; i++) ...[
                Expanded(
                  child: Column(
                    children: [
                      _RoundIcon(
                          icon: items[i].$1, color: AppColors.gold, size: 48),
                      const SizedBox(height: 5),
                      FittedBox(
                        child: Text(items[i].$2,
                            style: const TextStyle(
                                color: AppColors.parchment, fontSize: 12)),
                      ),
                    ],
                  ),
                ),
                if (i != items.length - 1) const SizedBox(width: 5),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class LootIcon extends StatelessWidget {
  const LootIcon({required this.rect, required this.count, super.key});

  final Rect rect;
  final String count;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 58,
      child: Column(
        children: [
          Container(
            width: 55,
            height: 55,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: AppColors.panelSoft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.line.withValues(alpha: 0.7)),
            ),
            child: AssetCrop(rect: rect),
          ),
          Text(count,
              style: const TextStyle(
                  color: AppColors.goldBright,
                  fontSize: 16,
                  fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

class ChestCount extends StatelessWidget {
  const ChestCount({required this.rect, required this.count, super.key});

  final Rect rect;
  final String count;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        AssetCrop(rect: rect, width: 72, height: 58),
        Text(count,
            style: const TextStyle(
                color: AppColors.goldBright,
                fontSize: 16,
                fontWeight: FontWeight.w900)),
      ],
    );
  }
}

class StreakShield extends StatelessWidget {
  const StreakShield({this.compact = false, super.key});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final width = compact ? 82.0 : 92.0;
    final height = compact ? 116.0 : 132.0;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (!compact)
          const Text('STREAK',
              style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 13,
                  fontWeight: FontWeight.w900)),
        if (!compact) const SizedBox(height: 12),
        ClipPath(
          clipper: ShieldClipper(),
          child: Container(
            width: width,
            height: height,
            decoration: BoxDecoration(
              color: AppColors.panel,
              border: Border.all(color: AppColors.gold),
              boxShadow: const [
                BoxShadow(color: Colors.black87, blurRadius: 18)
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.local_fire_department_rounded,
                    color: AppColors.goldBright, size: 32),
                const SizedBox(height: 4),
                Text(
                  '12',
                  style: TextStyle(
                    color: AppColors.parchment,
                    fontSize: compact ? 35 : 42,
                    height: 1,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const Text('days',
                    style: TextStyle(color: AppColors.parchment, fontSize: 16)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class OrnatePanel extends StatelessWidget {
  const OrnatePanel({
    required this.child,
    this.padding = const EdgeInsets.all(16),
    super.key,
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.panel,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
            color: AppColors.line.withValues(alpha: 0.92), width: 1.35),
        boxShadow: const [
          BoxShadow(
              color: Colors.black87, blurRadius: 20, offset: Offset(0, 12)),
        ],
      ),
      child: child,
    );
  }
}

class MiniProgress extends StatelessWidget {
  const MiniProgress({
    required this.value,
    required this.color,
    this.height = 5,
    super.key,
  });

  final double value;
  final Color color;
  final double height;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: SizedBox(
        height: height,
        child: LinearProgressIndicator(
          value: value.clamp(0, 1),
          backgroundColor: const Color(0xFF2A2F2F),
          color: color,
        ),
      ),
    );
  }
}

class FantasyBottomNav extends StatelessWidget {
  const FantasyBottomNav({
    required this.items,
    required this.selectedIndex,
    required this.onSelected,
    super.key,
  });

  final List<_NavItem> items;
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 98,
      padding: const EdgeInsets.fromLTRB(7, 8, 7, 18),
      decoration: BoxDecoration(
        color: const Color(0xF2070B0D),
        border: Border(
            top: BorderSide(
                color: AppColors.line.withValues(alpha: 0.75), width: 1.2)),
        boxShadow: const [
          BoxShadow(
              color: Colors.black87, blurRadius: 22, offset: Offset(0, -10))
        ],
      ),
      child: Row(
        children: [
          for (var index = 0; index < items.length; index++)
            Expanded(
              child: _NavButton(
                item: items[index],
                selected: selectedIndex == index,
                onTap: () => onSelected(index),
              ),
            ),
        ],
      ),
    );
  }
}

class _NavButton extends StatelessWidget {
  const _NavButton(
      {required this.item, required this.selected, required this.onTap});

  final _NavItem item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: item.label,
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          margin: const EdgeInsets.symmetric(horizontal: 2),
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: selected ? const Color(0xFF241B10) : Colors.transparent,
            borderRadius: BorderRadius.circular(22),
            border: selected
                ? Border.all(color: AppColors.gold.withValues(alpha: 0.75))
                : null,
            boxShadow: selected
                ? const [BoxShadow(color: Color(0x55FFC35E), blurRadius: 20)]
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(item.icon,
                  color: selected ? AppColors.goldBright : AppColors.muted,
                  size: selected ? 27 : 24),
              const SizedBox(height: 3),
              FittedBox(
                child: Text(
                  item.label,
                  style: TextStyle(
                    color: selected ? AppColors.goldBright : AppColors.muted,
                    fontSize: 13,
                    fontWeight: selected ? FontWeight.w900 : FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class FantasyBackdrop extends StatelessWidget {
  const FantasyBackdrop({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(painter: BackdropPainter(), child: Container());
  }
}

class BackdropPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    canvas.drawRect(
      rect,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF11191D), Color(0xFF0A0D0E), Color(0xFF050607)],
        ).createShader(rect),
    );
    canvas.drawRect(
      rect,
      Paint()
        ..shader = RadialGradient(
          center: const Alignment(-0.7, -0.18),
          radius: 0.92,
          colors: [
            const Color(0xFFC08B4C).withValues(alpha: 0.32),
            const Color(0xFF21353B).withValues(alpha: 0.28),
            Colors.transparent,
          ],
        ).createShader(rect),
    );

    final mountainPaint = Paint()
      ..color = const Color(0xFF172023).withValues(alpha: 0.95);
    final far = Path()
      ..moveTo(0, size.height * 0.42)
      ..lineTo(size.width * 0.18, size.height * 0.3)
      ..lineTo(size.width * 0.36, size.height * 0.39)
      ..lineTo(size.width * 0.57, size.height * 0.25)
      ..lineTo(size.width * 0.78, size.height * 0.38)
      ..lineTo(size.width, size.height * 0.27)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(far, mountainPaint);

    final near = Path()
      ..moveTo(0, size.height * 0.55)
      ..quadraticBezierTo(size.width * 0.24, size.height * 0.43,
          size.width * 0.42, size.height * 0.58)
      ..quadraticBezierTo(
          size.width * 0.7, size.height * 0.77, size.width, size.height * 0.56)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(
        near, Paint()..color = const Color(0xFF060808).withValues(alpha: 0.78));

    canvas.drawRRect(
      RRect.fromRectAndRadius(rect.deflate(4), const Radius.circular(28)),
      Paint()
        ..color = AppColors.line.withValues(alpha: 0.34)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.1,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class ArcGaugePainter extends CustomPainter {
  const ArcGaugePainter({required this.value});

  final double value;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.shortestSide / 2 - 9;
    final ringRect = Rect.fromCircle(center: center, radius: radius);
    canvas.drawArc(
      ringRect,
      math.pi * 0.74,
      math.pi * 1.55,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 13
        ..strokeCap = StrokeCap.round
        ..color = const Color(0xFF2B302F),
    );
    canvas.drawArc(
      ringRect,
      math.pi * 0.74,
      math.pi * 1.55 * value,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 18
        ..strokeCap = StrokeCap.round
        ..color = AppColors.gold.withValues(alpha: 0.18)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10),
    );
    canvas.drawArc(
      ringRect,
      math.pi * 0.74,
      math.pi * 1.55 * value,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 13
        ..strokeCap = StrokeCap.round
        ..shader = const SweepGradient(
          colors: [Color(0xFFFFB63F), Color(0xFFFFE6A9), Color(0xFFFFB63F)],
        ).createShader(ringRect),
    );
    final fine = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = AppColors.line.withValues(alpha: 0.7);
    canvas.drawCircle(center, radius - 20, fine);
    canvas.drawCircle(center, radius + 16, fine);
  }

  @override
  bool shouldRepaint(covariant ArcGaugePainter oldDelegate) =>
      oldDelegate.value != value;
}

class WheelFramePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.width * 0.48;
    final outer = Rect.fromCircle(center: center, radius: radius);
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..shader = const RadialGradient(
          colors: [Color(0xFF25251F), Color(0xFF151A1A), Color(0xFF0A0C0C)],
        ).createShader(outer),
    );
    final border = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = AppColors.line;
    canvas.drawCircle(center, radius, border);
    canvas.drawCircle(center, radius * 0.36,
        border..color = AppColors.line.withValues(alpha: 0.75));

    final spoke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..color = AppColors.line.withValues(alpha: 0.55);
    for (var i = 0; i < 5; i++) {
      final angle = -math.pi / 2 + i * math.pi * 2 / 5;
      canvas.drawLine(
        Offset(center.dx + math.cos(angle) * radius * 0.35,
            center.dy + math.sin(angle) * radius * 0.35),
        Offset(center.dx + math.cos(angle) * radius * 0.96,
            center.dy + math.sin(angle) * radius * 0.96),
        spoke,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class ShieldClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    return Path()
      ..moveTo(size.width * 0.5, 0)
      ..lineTo(size.width * 0.92, size.height * 0.14)
      ..lineTo(size.width * 0.86, size.height * 0.68)
      ..quadraticBezierTo(
          size.width * 0.5, size.height, size.width * 0.14, size.height * 0.68)
      ..lineTo(size.width * 0.08, size.height * 0.14)
      ..close();
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

class _TwoColumn extends StatelessWidget {
  const _TwoColumn({required this.left, required this.right});

  final Widget left;
  final Widget right;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 520) {
          return Column(children: [left, const SizedBox(height: 12), right]);
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: left),
            const SizedBox(width: 12),
            Expanded(child: right),
          ],
        );
      },
    );
  }
}

class _SpeechBubble extends StatelessWidget {
  const _SpeechBubble({required this.text, required this.width});

  final String text;
  final double width;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
      decoration: BoxDecoration(
        color: AppColors.panel,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFF536061), width: 1),
        boxShadow: const [
          BoxShadow(
              color: Colors.black87, blurRadius: 20, offset: Offset(0, 12))
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.eco_rounded, color: AppColors.gold, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: AppColors.parchment,
                fontSize: 13,
                height: 1.24,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GaugeLabel extends StatelessWidget {
  const _GaugeLabel({
    required this.label,
    required this.value,
    required this.detail,
    this.small = false,
  });

  final String label;
  final String value;
  final String detail;
  final bool small;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label,
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: AppColors.gold,
                  fontSize: small ? 11 : 12,
                  fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          Text(value,
              style: TextStyle(
                  color: AppColors.goldBright,
                  fontSize: small ? 26 : 66,
                  height: 0.9,
                  fontWeight: FontWeight.w900)),
          const SizedBox(height: 6),
          Text(detail,
              style: TextStyle(
                  color: AppColors.gold,
                  fontSize: small ? 13 : 21,
                  fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: const TextStyle(
        color: AppColors.gold,
        fontSize: 15,
        fontWeight: FontWeight.w900,
      ),
    );
  }
}

class _RoundIcon extends StatelessWidget {
  const _RoundIcon({required this.icon, required this.color, this.size = 50});

  final IconData icon;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.16),
        border: Border.all(color: color.withValues(alpha: 0.72), width: 1.35),
        boxShadow: [
          BoxShadow(color: color.withValues(alpha: 0.18), blurRadius: 16)
        ],
      ),
      child: Icon(icon, color: color, size: size * 0.56),
    );
  }
}

class _GoldButton extends StatelessWidget {
  const _GoldButton(
      {required this.label, this.filled = false, this.compact = false});

  final String label;
  final bool filled;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(vertical: compact ? 7 : 10, horizontal: 10),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: filled
            ? const LinearGradient(colors: [
                Color(0xFF9D6C22),
                Color(0xFFE6B45E),
                Color(0xFF8C5D1D)
              ])
            : null,
        color: filled ? null : const Color(0x99101213),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.line),
      ),
      child: FittedBox(
        child: Text(
          label.toUpperCase(),
          style: const TextStyle(
              color: AppColors.goldBright,
              fontSize: 13,
              fontWeight: FontWeight.w900),
        ),
      ),
    );
  }
}

class _GoldDot extends StatelessWidget {
  const _GoldDot();

  @override
  Widget build(BuildContext context) {
    return Container(
        width: 12,
        height: 12,
        decoration:
            const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle));
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat(
      {required this.value, required this.label, required this.icon});

  final String value;
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: AppColors.gold, size: 31),
        const SizedBox(height: 5),
        FittedBox(
            child: Text(value,
                style: const TextStyle(
                    color: AppColors.parchment,
                    fontSize: 28,
                    fontWeight: FontWeight.w900))),
        Text(label,
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: AppColors.gold,
                fontSize: 11,
                fontWeight: FontWeight.w900)),
      ],
    );
  }
}

class _ShieldNumber extends StatelessWidget {
  const _ShieldNumber({required this.value, this.icon});

  final String value;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return ClipPath(
      clipper: ShieldClipper(),
      child: Container(
        width: 72,
        height: 86,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.panelSoft,
          border: Border.all(color: AppColors.gold),
        ),
        child: icon == null
            ? Text(value,
                style: const TextStyle(
                    color: AppColors.parchment,
                    fontSize: 30,
                    fontWeight: FontWeight.w900))
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, color: AppColors.goldBright, size: 28),
                  Text(value,
                      style: const TextStyle(
                          color: AppColors.parchment,
                          fontSize: 20,
                          fontWeight: FontWeight.w900)),
                ],
              ),
      ),
    );
  }
}

class _RosterRow extends StatelessWidget {
  const _RosterRow(
      {required this.name,
      required this.status,
      required this.level,
      required this.color});

  final String name;
  final String status;
  final String level;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          _RoundIcon(icon: Icons.person_rounded, color: color, size: 38),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: AppColors.parchment,
                        fontSize: 14,
                        fontWeight: FontWeight.w900)),
                Text(status, style: TextStyle(color: color, fontSize: 12)),
              ],
            ),
          ),
          _ShieldNumber(value: level),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.title,
    required this.subtitle,
    required this.trailing,
    required this.color,
    this.icon,
  });

  final String title;
  final String subtitle;
  final String trailing;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, color: AppColors.gold, size: 20),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: AppColors.parchment,
                        fontSize: 14,
                        fontWeight: FontWeight.w800)),
                if (subtitle.isNotEmpty)
                  Text(subtitle, style: TextStyle(color: color, fontSize: 12)),
              ],
            ),
          ),
          Text(trailing,
              style: const TextStyle(color: AppColors.muted, fontSize: 13)),
        ],
      ),
    );
  }
}

class _WheelStat {
  const _WheelStat(this.label, this.value, this.detail, this.icon, this.color,
      this.progress);

  final String label;
  final String value;
  final String detail;
  final IconData icon;
  final Color color;
  final double progress;
}

class _QuestRowData {
  const _QuestRowData(
      this.icon, this.title, this.subtitle, this.count, this.xp, this.progress);

  final IconData icon;
  final String title;
  final String subtitle;
  final String count;
  final String xp;
  final double progress;
}

class _AvailableQuest {
  const _AvailableQuest(this.icon, this.title, this.body, this.xp, this.energy);

  final IconData icon;
  final String title;
  final String body;
  final String xp;
  final String energy;
}

class _NavItem {
  const _NavItem(this.label, this.icon);

  final String label;
  final IconData icon;
}
