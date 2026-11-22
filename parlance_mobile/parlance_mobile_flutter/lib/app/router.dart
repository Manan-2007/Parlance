import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/cards/cards_screens.dart';
import '../features/community/community_screens.dart';
import '../features/community/live_screen.dart';
import '../features/contribute/contribute_screens.dart';
import '../features/home/home_screen.dart';
import '../features/interpret/interpret_screen.dart';
import '../features/learn/learn_screens.dart';
import '../features/room/conversation_screen.dart';
import '../features/room/start_screen.dart';
import '../features/sign_camera/sign_screen.dart';
import '../features/translate/translate_screen.dart';
import 'theme.dart';

final _root = GlobalKey<NavigatorState>();

/// Home, Translate, Learn, Cards and Community are tabs with a bottom bar; a
/// conversation, the sign camera and a card on show take the whole screen.
/// Paths are shared with the web build: a room's QR code opens `/#/join/123456`.
final router = GoRouter(
  navigatorKey: _root,
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, shell) => _Tabs(shell: shell),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/translate',
              builder: (context, state) => const TranslateScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/learn',
              builder: (context, state) => const LearnScreen(),
              routes: [
                GoRoute(
                  path: 'sign/:gloss',
                  builder: (context, state) =>
                      SignLearnScreen(gloss: state.pathParameters['gloss']!),
                ),
                GoRoute(
                  path: ':unit',
                  builder: (context, state) =>
                      UnitScreen(unitId: state.pathParameters['unit']!),
                  routes: [
                    GoRoute(
                      path: ':lesson',
                      parentNavigatorKey: _root,
                      builder: (context, state) => LessonScreen(
                        unitId: state.pathParameters['unit']!,
                        lessonId: state.pathParameters['lesson']!,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/cards',
              builder: (context, state) => const CardsScreen(),
              routes: [
                GoRoute(
                  path: ':place',
                  builder: (context, state) =>
                      PlaceScreen(placeId: state.pathParameters['place']!),
                  routes: [
                    GoRoute(
                      path: ':card',
                      parentNavigatorKey: _root,
                      builder: (context, state) => CardShowScreen(
                        placeId: state.pathParameters['place']!,
                        cardId: state.pathParameters['card']!,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/community',
              builder: (context, state) => const CommunityScreen(),
              routes: [
                GoRoute(
                  path: 's/:space',
                  builder: (context, state) =>
                      SpaceScreen(spaceId: state.pathParameters['space']!),
                ),
                GoRoute(
                  path: 't/:id',
                  builder: (context, state) => ThreadScreen(
                    threadId: int.tryParse(state.pathParameters['id']!) ?? 0,
                  ),
                ),
                GoRoute(
                  path: 'new',
                  parentNavigatorKey: _root,
                  builder: (context, state) => NewPostScreen(
                    space: state.uri.queryParameters['space'],
                    kind: state.uri.queryParameters['kind'],
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    ),
    // A meetup's live room ("Here, together"), full screen. Its QR code opens /#/community/live/123456.
    GoRoute(
      path: '/community/live',
      parentNavigatorKey: _root,
      builder: (context, state) => const LiveJoinScreen(),
    ),
    GoRoute(
      path: '/community/live/:code',
      parentNavigatorKey: _root,
      builder: (context, state) =>
          LiveScreen(code: state.pathParameters['code']!),
    ),
    // "Help train Parlance": opt-in, consent first.
    GoRoute(
      path: '/contribute',
      parentNavigatorKey: _root,
      builder: (context, state) => const ContributeScreen(),
      routes: [
        GoRoute(
          path: 'words',
          builder: (context, state) => const ContributeWordsScreen(),
        ),
        GoRoute(
          path: 'review',
          builder: (context, state) => const ReviewScreen(),
        ),
        GoRoute(
          path: 'mine',
          builder: (context, state) => const MySignsScreen(),
        ),
        GoRoute(
          path: 'record/:gloss',
          builder: (context, state) => SignScreen(
            record: state.pathParameters['gloss'],
            recordLabel: state.uri.queryParameters['label'],
          ),
        ),
      ],
    ),
    GoRoute(
      path: '/interpret',
      parentNavigatorKey: _root,
      builder: (context, state) => const InterpretScreen(),
    ),
    GoRoute(
      path: '/talk',
      parentNavigatorKey: _root,
      builder: (context, state) => const StartScreen(),
    ),
    GoRoute(
      path: '/join',
      parentNavigatorKey: _root,
      builder: (context, state) => const JoinScreen(),
    ),
    GoRoute(
      path: '/join/:code',
      parentNavigatorKey: _root,
      builder: (context, state) =>
          JoinScreen(code: state.pathParameters['code']),
    ),
    GoRoute(
      path: '/room',
      parentNavigatorKey: _root,
      builder: (context, state) => ConversationScreen(
        invite: state.uri.queryParameters['invite'] == '1',
      ),
      routes: [
        GoRoute(path: 'sign', builder: (context, state) => const SignScreen()),
      ],
    ),
    GoRoute(
      path: '/practice/:gloss',
      parentNavigatorKey: _root,
      builder: (context, state) => SignScreen(
        target: state.pathParameters['gloss'],
        targetEnglish: state.uri.queryParameters['en'],
      ),
    ),
    GoRoute(
      path: '/about',
      parentNavigatorKey: _root,
      builder: (context, state) => const AboutMeScreen(),
    ),
  ],
);

class _Tabs extends StatelessWidget {
  const _Tabs({required this.shell});
  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: shell,
      bottomNavigationBar: NavigationBar(
        backgroundColor: Brand.surface,
        indicatorColor: Brand.handsSoft,
        selectedIndex: shell.currentIndex,
        onDestinationSelected: (index) =>
            shell.goBranch(index, initialLocation: index == shell.currentIndex),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.record_voice_over_outlined),
            selectedIcon: Icon(Icons.record_voice_over_rounded),
            label: 'Translate',
          ),
          NavigationDestination(
            icon: Icon(Icons.school_outlined),
            selectedIcon: Icon(Icons.school_rounded),
            label: 'Learn',
          ),
          NavigationDestination(
            icon: Icon(Icons.style_outlined),
            selectedIcon: Icon(Icons.style_rounded),
            label: 'Cards',
          ),
          NavigationDestination(
            icon: Icon(Icons.forum_outlined),
            selectedIcon: Icon(Icons.forum_rounded),
            label: 'Community',
          ),
        ],
      ),
    );
  }
}
