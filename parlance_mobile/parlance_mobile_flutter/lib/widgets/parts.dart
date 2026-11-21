import 'package:flutter/material.dart';

import '../app/theme.dart';

/// A large rounded tile that leads somewhere, the main building block of Home.
class ActionTile extends StatelessWidget {
  const ActionTile({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
    required this.onTap,
    this.background = Brand.surface,
    this.foreground = Brand.navy,
    this.iconBackground,
    this.bordered = true,
  });

  final IconData icon;
  final String title;
  final String body;
  final VoidCallback onTap;
  final Color background;
  final Color foreground;
  final Color? iconBackground;
  final bool bordered;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Material(
      color: background,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(28),
        side: bordered ? const BorderSide(color: Brand.line) : BorderSide.none,
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(18, 18, 14, 18),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: iconBackground ?? foreground.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: foreground, size: 26),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: text.titleLarge?.copyWith(
                        color: foreground,
                        fontSize: 21,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      body,
                      style: text.bodyMedium?.copyWith(
                        color: foreground.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_rounded, color: foreground),
            ],
          ),
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.title, {super.key, this.description});
  final String title;
  final String? description;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.only(top: 28, bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: text.titleLarge),
          if (description != null) ...[
            const SizedBox(height: 2),
            Text(
              description!,
              style: text.bodyMedium?.copyWith(color: Brand.ink3),
            ),
          ],
        ],
      ),
    );
  }
}

/// A clear message with an icon, for errors and notices. Never colour alone.
class Notice extends StatelessWidget {
  const Notice({
    super.key,
    required this.message,
    this.danger = false,
    this.action,
    this.onAction,
  });
  final String message;
  final bool danger;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final color = danger ? Brand.danger : Brand.navy;
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
      decoration: BoxDecoration(
        color: danger ? Brand.dangerSoft : Brand.sunSoft,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Icon(
            danger ? Icons.error_outline_rounded : Icons.info_outline_rounded,
            color: color,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: color, fontWeight: FontWeight.w600),
            ),
          ),
          if (action != null)
            TextButton(onPressed: onAction, child: Text(action!)),
        ],
      ),
    );
  }
}

/// Content width that reads well on phones and stays centred on a laptop.
class PageBody extends StatelessWidget {
  const PageBody({super.key, required this.child, this.maxWidth = 640});
  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: child,
      ),
    );
  }
}
