import 'package:flutter/widgets.dart';

import 'frame_vector.dart';

Widget buildCamera({
  required void Function(HandFrame) onFrame,
  required void Function(String) onError,
}) => const Center(
  child: Text('The sign camera is not available on this device.'),
);
