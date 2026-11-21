package space.serverpod.parlance_mobile

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.hardware.display.DisplayManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.util.Size
import android.view.Surface
import android.view.View
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.resolutionselector.AspectRatioStrategy
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker
import io.flutter.FlutterInjector
import io.flutter.embedding.android.FlutterActivity
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.StandardMessageCodec
import io.flutter.plugin.platform.PlatformView
import io.flutter.plugin.platform.PlatformViewFactory
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Hand frames for Dart, delivered on the main thread. An error is kept until
 * Dart listens, so a camera or tracker failure is always shown to the signer.
 */
object SignCameraFrames : EventChannel.StreamHandler {
    private var sink: EventChannel.EventSink? = null
    private var pendingError: Map<String, Any>? = null
    private val main = Handler(Looper.getMainLooper())

    override fun onListen(arguments: Any?, events: EventChannel.EventSink) {
        sink = events
        pendingError?.let { events.success(it) }
        pendingError = null
    }

    override fun onCancel(arguments: Any?) {
        sink = null
    }

    fun send(message: Map<String, Any>) {
        main.post {
            val target = sink
            if (target != null) target.success(message)
            else if (message.containsKey("error")) pendingError = message
        }
    }

    /** A new camera view starts clean. */
    fun reset() {
        main.post { pendingError = null }
    }
}

class SignCameraFactory(
    private val activity: FlutterActivity,
) : PlatformViewFactory(StandardMessageCodec.INSTANCE) {
    override fun create(context: Context, viewId: Int, args: Any?): PlatformView =
        SignCameraView(context, activity, SignCameraFrames)
}

/**
 * The front camera with MediaPipe Hand Landmarker, for signing.
 *
 * Matches the web app's recogniser input (parlance-isl/src/engine/workers/
 * mediapipe.worker.ts): the same hand_landmarker.task, two hands, confidence
 * 0.3, VIDEO mode on the CPU, and the raw camera frame rotated upright but NOT
 * mirrored (a webcam frame as the camera sees it). Only the on-screen preview
 * is mirrored. Frames are 16:9, like the webcam video the model was trained on.
 */
class SignCameraView(
    private val context: Context,
    private val activity: FlutterActivity,
    private val frames: SignCameraFrames,
) : PlatformView {
    private val preview = PreviewView(context).apply {
        // A TextureView composes correctly inside Flutter.
        implementationMode = PreviewView.ImplementationMode.COMPATIBLE
        scaleType = PreviewView.ScaleType.FILL_CENTER
    }
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()
    private var landmarker: HandLandmarker? = null
    private var provider: ProcessCameraProvider? = null
    private var previewUseCase: Preview? = null
    private var analysis: ImageAnalysis? = null
    private var lastTimestamp = 0L
    private var failed = false
    @Volatile private var disposed = false

    private val displays = context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
    private val displayListener = object : DisplayManager.DisplayListener {
        override fun onDisplayAdded(displayId: Int) {}
        override fun onDisplayRemoved(displayId: Int) {}
        override fun onDisplayChanged(displayId: Int) {
            // The screen turns to landscape after the view is created; keep the
            // frames upright as it turns.
            val rotation = rotation()
            previewUseCase?.targetRotation = rotation
            analysis?.targetRotation = rotation
        }
    }

    init {
        frames.reset()
        displays.registerDisplayListener(displayListener, Handler(Looper.getMainLooper()))
        start()
    }

    override fun getView(): View = preview

    override fun dispose() {
        disposed = true
        displays.unregisterDisplayListener(displayListener)
        provider?.unbindAll()
        executor.execute {
            landmarker?.close()
            landmarker = null
        }
        executor.shutdown()
    }

    @Suppress("DEPRECATION")
    private fun rotation(): Int = activity.windowManager.defaultDisplay?.rotation ?: Surface.ROTATION_0

    private fun start() {
        val future = ProcessCameraProvider.getInstance(context)
        future.addListener({
            if (disposed) return@addListener
            try {
                val cameras = future.get()
                provider = cameras
                val resolution = ResolutionSelector.Builder()
                    .setAspectRatioStrategy(AspectRatioStrategy.RATIO_16_9_FALLBACK_AUTO_STRATEGY)
                    .setResolutionStrategy(
                        ResolutionStrategy(Size(1280, 720), ResolutionStrategy.FALLBACK_RULE_CLOSEST_LOWER_THEN_HIGHER),
                    )
                    .build()
                val rotation = rotation()
                val previewCase = Preview.Builder()
                    .setResolutionSelector(resolution)
                    .setTargetRotation(rotation)
                    .build()
                previewCase.surfaceProvider = preview.surfaceProvider
                val analysisCase = ImageAnalysis.Builder()
                    .setResolutionSelector(resolution)
                    .setTargetRotation(rotation)
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                    .build()
                analysisCase.setAnalyzer(executor) { image -> analyze(image) }
                previewUseCase = previewCase
                analysis = analysisCase
                cameras.unbindAll()
                cameras.bindToLifecycle(activity, CameraSelector.DEFAULT_FRONT_CAMERA, previewCase, analysisCase)
            } catch (error: Exception) {
                Log.e(TAG, "Camera failed", error)
                frames.send(mapOf("error" to "The camera could not start. Close other apps using it and try again."))
            }
        }, ContextCompat.getMainExecutor(context))
    }

    /**
     * The hand tracker, created once. If it cannot start, it is not retried on
     * every frame (each try loads the 7.8 MB model); the signer is told instead.
     */
    private fun detector(): HandLandmarker? {
        landmarker?.let { return it }
        if (failed) return null
        return try {
            create().also { landmarker = it }
        } catch (error: Throwable) {
            failed = true
            Log.e(TAG, "Hand tracker could not start; telling the signer", error)
            frames.send(
                mapOf(
                    "error" to "Hand tracking could not start on this phone. Type or use a card instead.",
                    // Shown small under the message, so a tester can report it.
                    "detail" to "${error.javaClass.simpleName}: ${error.message ?: ""}".take(180),
                ),
            )
            null
        }
    }

    private fun create(): HandLandmarker {
        val options = HandLandmarker.HandLandmarkerOptions.builder()
            .setBaseOptions(
                BaseOptions.builder()
                    .setModelAssetBuffer(model())
                    .setDelegate(if (isEmulator) Delegate.GPU else Delegate.CPU)
                    .build(),
            )
            .setRunningMode(RunningMode.VIDEO)
            .setNumHands(2)
            .setMinHandDetectionConfidence(0.3f)
            .setMinHandPresenceConfidence(0.3f)
            .setMinTrackingConfidence(0.3f)
            .build()
        return HandLandmarker.createFromOptions(context, options)
    }

    /** The Flutter asset assets/models/hand_landmarker.task, shared with iOS and the web. */
    private fun model(): ByteBuffer {
        val key = FlutterInjector.instance().flutterLoader().getLookupKeyForAsset("assets/models/hand_landmarker.task")
        val bytes = context.assets.open(key).use { it.readBytes() }
        return ByteBuffer.allocateDirect(bytes.size).order(ByteOrder.nativeOrder()).apply {
            put(bytes)
            rewind()
        }
    }

    private fun analyze(image: ImageProxy) {
        if (disposed) {
            image.close()
            return
        }
        val tracker = detector()
        if (tracker == null) {
            image.close()
            return
        }
        try {
            val degrees = image.imageInfo.rotationDegrees
            val raw = image.toBitmap()
            image.close()
            // Upright, not mirrored: the frame as the camera sees it.
            val upright = if (degrees == 0) raw else Bitmap.createBitmap(
                raw, 0, 0, raw.width, raw.height,
                Matrix().apply { postRotate(degrees.toFloat()) }, false,
            )
            var now = SystemClock.uptimeMillis()
            if (now <= lastTimestamp) now = lastTimestamp + 1
            lastTimestamp = now
            val result = tracker.detectForVideo(BitmapImageBuilder(upright).build(), now)
            val hands = ArrayList<Map<String, Any>>()
            val labels = result.handedness()
            result.landmarks().forEachIndexed { index, points ->
                val category = labels.getOrNull(index)?.firstOrNull() ?: return@forEachIndexed
                val flat = ArrayList<Double>(points.size * 3)
                for (point in points) {
                    flat.add(point.x().toDouble())
                    flat.add(point.y().toDouble())
                    flat.add(point.z().toDouble())
                }
                hands.add(mapOf("label" to category.categoryName(), "score" to category.score().toDouble(), "points" to flat))
            }
            frames.send(mapOf("w" to upright.width, "h" to upright.height, "hands" to hands))
        } catch (error: Throwable) {
            Log.e(TAG, "Hand tracking failed", error)
            try { image.close() } catch (_: Throwable) {}
        }
    }

    companion object {
        private const val TAG = "ParlanceSignCamera"

        /**
         * The Android emulator on Apple M4 Macs advertises SME2/SVE2 CPU features
         * the hypervisor does not support, and MediaPipe's CPU kernels then crash
         * with an illegal instruction. The emulator uses the GPU instead; phones
         * keep the CPU, like the web app.
         */
        private val isEmulator: Boolean =
            Build.HARDWARE.contains("ranchu") || Build.HARDWARE.contains("goldfish") ||
                Build.FINGERPRINT.contains("generic") || Build.PRODUCT.contains("sdk")
    }
}
