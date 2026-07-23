import 'package:flutter/material.dart';
import '../../app/theme/fantasy_decorations.dart';

/// Dark medieval panel with layered borders and subtle shadows.
///
/// The foundation for most content containers in the quest journal.
class FantasyPanel extends StatelessWidget {
  const FantasyPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.raised = false,
    this.goldBorder = false,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final bool raised;
  final bool goldBorder;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final panel = Container(
      padding: padding,
      decoration: FantasyDecorations.panel(
        raised: raised,
        goldBorder: goldBorder,
      ),
      child: child,
    );

    if (onTap == null) return panel;

    return GestureDetector(
      onTap: onTap,
      child: panel,
    );
  }
}
