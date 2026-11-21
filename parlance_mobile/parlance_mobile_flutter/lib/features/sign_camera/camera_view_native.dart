import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import 'frame_vector.dart';

const _viewType = 'parlance/sign_camera';

/// One shared stream: the platform side has a single listener per channel, so
/// two overlapping camera widgets must not each subscribe and cancel it.
final _frames = const EventChannel(
  'parlance/sign_camera/frames',
).receiveBroadcastStream();

Widget buildCamera({
  required void Function(HandFrame) onFrame,
  required void Function(String) onError,
}) => _NativeCamera(onFrame: onFrame, onError: onError);

class _NativeCamera extends StatefulWidget {
  const _NativeCamera({required this.onFrame, required this.onError});
  final void Function(HandFrame) onFrame;
  final void Function(String) onError;

  @override
  State<_NativeCamera> createState() => _NativeCameraState();
}

class _NativeCameraState extends State<_NativeCamera> {
  StreamSubscription<dynamic>? _sub;

  @override
  void initState() {
    super.initState();
    _sub = _frames.listen(
      (event) {
        if (event is Map) {
          if (event['error'] is String) {
            final detail = event['detail'];
            widget.onError(
              detail is String
                  ? '${event['error']}\n\n$detail'
                  : event['error'] as String,
            );
          } else {
            widget.onFrame(HandFrame.fromMessage(event));
          }
        }
      },
      onError: (Object error) => widget.onError(
        error is PlatformException ? (error.message ?? error.code) : '$error',
      ),
    );
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return const AndroidView(
          viewType: _viewType,
          creationParamsCodec: StandardMessageCodec(),
        );
      case TargetPlatform.iOS:
        return const UiKitView(
          viewType: _viewType,
          creationParamsCodec: StandardMessageCodec(),
        );
      default:
        return const Center(child: Text('The sign camera needs a phone.'));
    }
  }
}
