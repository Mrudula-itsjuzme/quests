import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';

/// Antique gold progress bar with an embossed track.
class GoldProgressBar extends StatelessWidget {
  const GoldProgressBar({
    super.key,
    required this.value,
    this.color,
    this.height = 8,
    this.showLabel = false,
    this.label,
  });

  final double value;
  final Color? color;
  final double height;
  final bool showLabel;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final fillColor = color ?? AppColors.antiqueGold;
    final clampedValue = value.clamp(0.0, 1.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          height: height,
          decoration: BoxDecoration(
            color: AppColors.deepBrown,
            borderRadius: BorderRadius.circular(height),
            border: Border.all(
              color: AppColors.border,
              width: 0.5,
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x30000000),
                blurRadius: 2,
                offset: Offset(0, 1),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(height),
            child: AnimatedFractionallySizedBox(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
              alignment: Alignment.centerLeft,
              widthFactor: clampedValue,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      fillColor,
                      fillColor.withValues(alpha: 0.7),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(height),
                  boxShadow: [
                    BoxShadow(
                      color: fillColor.withValues(alpha: 0.3),
                      blurRadius: 4,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        if (showLabel && label != null) ...[
          const SizedBox(height: 4),
          Text(
            label!,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ],
    );
  }
}

/// Animated version of FractionallySizedBox that smoothly transitions widthFactor.
class AnimatedFractionallySizedBox extends ImplicitlyAnimatedWidget {
  const AnimatedFractionallySizedBox({
    super.key,
    required super.duration,
    super.curve,
    this.alignment = Alignment.center,
    required this.widthFactor,
    this.child,
  });

  final AlignmentGeometry alignment;
  final double widthFactor;
  final Widget? child;

  @override
  AnimatedWidgetBaseState<AnimatedFractionallySizedBox> createState() =>
      _AnimatedFractionallySizedBoxState();
}

class _AnimatedFractionallySizedBoxState
    extends AnimatedWidgetBaseState<AnimatedFractionallySizedBox> {
  Tween<double>? _widthFactor;

  @override
  void forEachTween(TweenVisitor<dynamic> visitor) {
    _widthFactor = visitor(
      _widthFactor,
      widget.widthFactor,
      (value) => Tween<double>(begin: value as double),
    ) as Tween<double>?;
  }

  @override
  Widget build(BuildContext context) {
    return FractionallySizedBox(
      alignment: widget.alignment,
      widthFactor: _widthFactor?.evaluate(animation) ?? widget.widthFactor,
      child: widget.child,
    );
  }
}
