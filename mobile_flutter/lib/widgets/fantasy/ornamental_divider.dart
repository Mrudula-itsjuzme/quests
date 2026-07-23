import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';

/// Engraved separator with a center diamond ornament.
class OrnamentalDivider extends StatelessWidget {
  const OrnamentalDivider({super.key, this.width});

  final double? width;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width ?? double.infinity,
      height: 20,
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 1,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.transparent, AppColors.borderGold],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Transform.rotate(
              angle: 0.785, // 45 degrees
              child: Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: AppColors.antiqueGold,
                  border: Border.all(
                    color: AppColors.brightGold,
                    width: 0.5,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: Container(
              height: 1,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.borderGold, Colors.transparent],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
