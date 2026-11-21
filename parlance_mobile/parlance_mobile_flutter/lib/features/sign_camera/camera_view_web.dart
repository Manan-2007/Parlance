import 'dart:js_interop';
import 'dart:ui_web' as ui_web;

import 'package:flutter/widgets.dart';
import 'package:web/web.dart' as web;

import 'frame_vector.dart';

@JS('parlanceSignCamera.start')
external JSPromise<JSAny?> _start(
  web.HTMLVideoElement video,
  JSFunction onFrame,
);

@JS('parlanceSignCamera.stop')
external void _stop();

Widget buildCamera({
  required void Function(HandFrame) onFrame,
  required void Function(String) onError,
}) => _WebCamera(onFrame: onFrame, onError: onError);

int _views = 0;

class _WebCamera extends StatefulWidget {
  const _WebCamera({required this.onFrame, required this.onError});
  final void Function(HandFrame) onFrame;
  final void Function(String) onError;

  @override
  State<_WebCamera> createState() => _WebCameraState();
}

class _WebCameraState extends State<_WebCamera> {
  late final String _type = 'parlance-sign-camera-${_views++}';

  @override
  void initState() {
    super.initState();
    ui_web.platformViewRegistry.registerViewFactory(_type, (int id) {
      final video = web.HTMLVideoElement()
        ..autoplay = true
        ..muted = true
        ..setAttribute('playsinline', 'true')
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.objectFit = 'cover'
        // The preview is a mirror; detection reads the raw frame.
        ..style.transform = 'scaleX(-1)';
      void frame(JSAny? message) {
        final map = (message.dartify() as Map?)?.cast<Object?, Object?>();
        if (map == null) return;
        if (map['error'] is String) {
          widget.onError(map['error'] as String);
        } else {
          widget.onFrame(HandFrame.fromMessage(map));
        }
      }

      _start(video, frame.toJS).toDart.catchError((Object error) {
        widget.onError('$error');
        return null;
      });
      return video;
    });
  }

  @override
  void dispose() {
    _stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => HtmlElementView(viewType: _type);
}
