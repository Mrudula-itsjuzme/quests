import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';

class ReferencePlayerHeader extends StatelessWidget {
  const ReferencePlayerHeader({
    super.key,
    required this.page,
    required this.displayName,
    required this.level,
    required this.totalXp,
  });

  final String page;
  final String displayName;
  final int level;
  final int totalXp;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 16, 12, 18),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.borderGold)),
        gradient:
            LinearGradient(colors: [AppColors.panelRaised, AppColors.ink]),
      ),
      child: Row(children: [
        Stack(clipBehavior: Clip.none, children: [
          Container(
            width: 72,
            height: 72,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                  colors: [Color(0xFFB94752), Color(0xFFD17752)]),
              border: Border.all(color: AppColors.brightGold, width: 2),
              boxShadow: const [
                BoxShadow(
                    color: Colors.black54, blurRadius: 14, offset: Offset(0, 7))
              ],
            ),
            child: Text(
              displayName.isEmpty ? '?' : displayName[0].toUpperCase(),
              style: const TextStyle(
                  fontFamily: 'Cinzel',
                  fontSize: 30,
                  color: AppColors.parchment),
            ),
          ),
          Positioned(
            right: -5,
            bottom: -4,
            child: Container(
              width: 30,
              height: 30,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.panel,
                border: Border.all(color: AppColors.antiqueGold),
              ),
              child: Text('$level',
                  style: const TextStyle(
                      color: AppColors.parchment, fontWeight: FontWeight.w800)),
            ),
          ),
        ]),
        const SizedBox(width: 16),
        Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(page, style: Theme.of(context).textTheme.headlineLarge),
            Text(displayName,
                style: const TextStyle(
                    color: AppColors.parchmentDark, fontFamily: 'Cinzel')),
            const SizedBox(height: 5),
            Row(children: [
              const Icon(Icons.shield_outlined,
                  color: AppColors.antiqueGold, size: 17),
              const SizedBox(width: 6),
              Text('${_number(totalXp)} XP',
                  style: const TextStyle(
                      color: AppColors.parchment, fontFamily: 'Cinzel')),
            ]),
          ]),
        ),
        IconButton(
          tooltip: 'Notifications',
          onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('No new notices. Your path is clear.'))),
          icon: const Icon(Icons.notifications_none_rounded),
          color: AppColors.brightGold,
        ),
        const Icon(Icons.explore_rounded, color: AppColors.brightGold),
      ]),
    );
  }

  static String _number(int value) => value
      .toString()
      .replaceAllMapped(RegExp(r'(?=(\d{3})+(?!\d))'), (_) => ',');
}

class GoldProgressRing extends StatelessWidget {
  const GoldProgressRing(
      {super.key, required this.value, required this.child, this.size = 148});
  final double value;
  final Widget child;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(alignment: Alignment.center, children: [
        SizedBox(
          width: size,
          height: size,
          child: CircularProgressIndicator(
            value: value.clamp(0, 1),
            strokeWidth: 9,
            backgroundColor: AppColors.border,
            color: AppColors.brightGold,
            strokeCap: StrokeCap.round,
          ),
        ),
        Container(
          width: size - 27,
          height: size - 27,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.panel,
            border: Border.all(color: AppColors.borderGold),
          ),
          child: child,
        ),
      ]),
    );
  }
}

class WayfarerPortrait extends StatelessWidget {
  const WayfarerPortrait({super.key, this.height = 360});
  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: Stack(alignment: Alignment.bottomCenter, children: [
        Positioned(
          top: 10,
          child: Container(
            width: 160,
            height: 160,
            decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                    colors: [Color(0x336F9B85), Colors.transparent])),
          ),
        ),
        ClipPath(
          clipper: _CloakClipper(),
          child: Container(
            width: 260,
            height: height * .72,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [
                Color(0xFF101A13),
                Color(0xFF304333),
                Color(0xFF111A14)
              ]),
              boxShadow: [BoxShadow(color: Colors.black87, blurRadius: 20)],
            ),
          ),
        ),
        Positioned(
          top: height * .13,
          child: Container(
            width: 84,
            height: 105,
            decoration: const BoxDecoration(
              borderRadius: BorderRadius.all(Radius.elliptical(42, 52)),
              gradient: LinearGradient(
                  colors: [Color(0xFFD1A070), Color(0xFF805339)]),
            ),
          ),
        ),
        Positioned(
          top: height * .08,
          child: Container(
            width: 116,
            height: 93,
            decoration: const BoxDecoration(
              borderRadius: BorderRadius.vertical(
                  top: Radius.circular(60), bottom: Radius.circular(24)),
              gradient: RadialGradient(
                  colors: [Color(0xFF62422D), Color(0xFF211815)]),
            ),
          ),
        ),
        Positioned(
          top: height * .36,
          child: const Icon(Icons.explore_rounded,
              color: AppColors.brightGold, size: 34),
        ),
      ]),
    );
  }
}

class _CloakClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) => Path()
    ..moveTo(size.width * .37, 0)
    ..lineTo(size.width * .63, 0)
    ..lineTo(size.width, size.height)
    ..lineTo(0, size.height)
    ..close();
  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}
