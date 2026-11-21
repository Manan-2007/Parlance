package space.serverpod.parlance_mobile

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, "parlance/sign_camera/frames")
            .setStreamHandler(SignCameraFrames)
        flutterEngine.platformViewsController.registry
            .registerViewFactory("parlance/sign_camera", SignCameraFactory(this))
    }
}
