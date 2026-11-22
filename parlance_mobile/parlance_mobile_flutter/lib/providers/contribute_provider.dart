import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';

import '../core/client.dart';
import '../core/session.dart';

/// "Help train Parlance" (ContributeEndpoint): consent, recorded signs, checks.

String contributeError(Object error) {
  if (error is ContributionException) return error.message;
  return 'Could not reach Parlance. Check your internet connection and try again.';
}

final contributeStatusProvider = FutureProvider.autoDispose<ContributionStats>((
  ref,
) async {
  await ensureSignedIn();
  return client.contribute.status();
});

final contributeWordsProvider = FutureProvider<List<ContributionWord>>((
  ref,
) async {
  await ensureSignedIn();
  return client.contribute.vocabulary();
});

final mySignsProvider = FutureProvider.autoDispose<List<ContributionSummary>>((
  ref,
) async {
  await ensureSignedIn();
  return client.contribute.mine();
});

final reviewQueueProvider = FutureProvider.autoDispose<List<ReviewItem>>((
  ref,
) async {
  await ensureSignedIn();
  return client.contribute.reviewQueue();
});
