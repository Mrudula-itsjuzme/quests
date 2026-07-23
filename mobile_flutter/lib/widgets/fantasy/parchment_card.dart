import 'package:flutter/material.dart';
import '../../app/theme/fantasy_decorations.dart';

/// Parchment-textured card for quest notices.
///
/// Features darkened edges, a subtle parchment gradient, and
/// an optional category accent border.
class ParchmentCard extends StatefulWidget {
  const ParchmentCard({
    super.key,
    required this.child,
    this.accentColor,
    this.padding = const EdgeInsets.all(14),
    this.onTap,
  });

  final Widget child;
  final Color? accentColor;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  @override
  State<ParchmentCard> createState() => _ParchmentCardState();
}

class _ParchmentCardState extends State<ParchmentCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onTap != null ? (_) => setState(() => _pressed = true) : null,
      onTapUp: widget.onTap != null ? (_) => setState(() => _pressed = false) : null,
      onTapCancel: widget.onTap != null ? () => setState(() => _pressed = false) : null,
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: Container(
          padding: widget.padding,
          decoration: FantasyDecorations.parchmentCard(
            accentColor: widget.accentColor,
          ),
          child: widget.child,
        ),
      ),
    );
  }
}
