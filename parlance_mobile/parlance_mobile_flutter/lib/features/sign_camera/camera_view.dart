import 'package:flutter/widgets.dart';

import 'frame_vector.dart';
import 'camera_view_stub.dart'
    if (dart.library.js_interop) 'camera_view_web.dart'
    if (dart.library.io) 'camera_view_native.dart'
    as impl;

/// The front camera with on-device hand tracking (MediaPipe Hand Landmarker,
/// the same model as the web app). Shows a mirrored preview and reports every
/// processed frame's hands from the raw, un-mirrored, upright image.
///
/// Android and iOS run MediaPipe natively (see `MainActivity.kt` and
/// `SignCamera.swift`); the web build runs MediaPipe's WebAssembly build
/// (`web/sign_camera.js`).
class SignCameraView extends StatelessWidget {
  const SignCameraView({
    super.key,
    required this.onFrame,
    required this.onError,
  });

  final void Function(HandFrame frame) onFrame;
  final void Function(String message) onError;

  @override
  Widget build(BuildContext context) =>
      impl.buildCamera(onFrame: onFrame, onError: onError);
}
