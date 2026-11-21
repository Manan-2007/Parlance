import AVFoundation
import Flutter
import MediaPipeTasksVision
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    if let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "ParlanceSignCamera") {
      let frames = SignCameraFrames()
      FlutterEventChannel(name: "parlance/sign_camera/frames", binaryMessenger: registrar.messenger())
        .setStreamHandler(frames)
      registrar.register(SignCameraFactory(frames: frames), withId: "parlance/sign_camera")
    }
  }
}

// MARK: - Sign camera

/// Hand frames for Dart, delivered on the main thread.
final class SignCameraFrames: NSObject, FlutterStreamHandler {
  private var sink: FlutterEventSink?

  func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
    sink = events
    return nil
  }

  func onCancel(withArguments arguments: Any?) -> FlutterError? {
    sink = nil
    return nil
  }

  func send(_ message: [String: Any]) {
    DispatchQueue.main.async { self.sink?(message) }
  }
}

final class SignCameraFactory: NSObject, FlutterPlatformViewFactory {
  private let frames: SignCameraFrames

  init(frames: SignCameraFrames) {
    self.frames = frames
    super.init()
  }

  func create(withFrame frame: CGRect, viewIdentifier viewId: Int64, arguments args: Any?) -> FlutterPlatformView {
    SignCameraView(frame: frame, frames: frames)
  }

  func createArgsCodec() -> FlutterMessageCodec & NSObjectProtocol {
    FlutterStandardMessageCodec.sharedInstance()
  }
}

final class CameraPreviewView: UIView {
  override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
  var previewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
}

/// The front camera with MediaPipe Hand Landmarker, for signing.
///
/// Matches the web app's recogniser input (parlance-isl/src/engine/workers/
/// mediapipe.worker.ts): the same hand_landmarker.task, two hands, confidence
/// 0.3, VIDEO mode on the CPU, and the camera frame upright but NOT mirrored
/// (a webcam frame as the camera sees it). Only the preview is mirrored. Frames
/// are 1280x720 landscape, like the webcam video the model was trained on.
final class SignCameraView: NSObject, FlutterPlatformView, AVCaptureVideoDataOutputSampleBufferDelegate {
  private let preview = CameraPreviewView()
  private let session = AVCaptureSession()
  private let output = AVCaptureVideoDataOutput()
  private let queue = DispatchQueue(label: "app.parlance.signcamera")
  private let frames: SignCameraFrames
  private var landmarker: HandLandmarker?
  private var lastTimestamp = 0

  init(frame: CGRect, frames: SignCameraFrames) {
    self.frames = frames
    super.init()
    preview.frame = frame
    preview.backgroundColor = .black
    preview.previewLayer.session = session
    preview.previewLayer.videoGravity = .resizeAspectFill
    NotificationCenter.default.addObserver(
      self, selector: #selector(orientationChanged),
      name: UIDevice.orientationDidChangeNotification, object: nil)
    queue.async { self.configure() }
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
    let session = self.session
    queue.async { session.stopRunning() }
  }

  func view() -> UIView { preview }

  private func configure() {
    guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
          let input = try? AVCaptureDeviceInput(device: camera) else {
      frames.send(["error": "The front camera could not start."])
      return
    }
    session.beginConfiguration()
    session.sessionPreset = session.canSetSessionPreset(.hd1280x720) ? .hd1280x720 : .high
    if session.canAddInput(input) { session.addInput(input) }
    output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
    output.alwaysDiscardsLateVideoFrames = true
    output.setSampleBufferDelegate(self, queue: queue)
    if session.canAddOutput(output) { session.addOutput(output) }
    if let connection = output.connection(with: .video) {
      // The recogniser reads the frame as the camera sees it, never mirrored.
      connection.automaticallyAdjustsVideoMirroring = false
      connection.isVideoMirrored = false
    }
    session.commitConfiguration()
    DispatchQueue.main.async { self.orientationChanged() }
    session.startRunning()
  }

  /// Keeps both the frames and the preview upright in landscape.
  @objc private func orientationChanged() {
    let interface = preview.window?.windowScene?.interfaceOrientation ?? .landscapeRight
    let orientation: AVCaptureVideoOrientation
    switch interface {
    case .landscapeLeft: orientation = .landscapeLeft
    case .portraitUpsideDown: orientation = .portraitUpsideDown
    case .portrait: orientation = .portrait
    default: orientation = .landscapeRight
    }
    preview.previewLayer.connection?.videoOrientation = orientation
    queue.async {
      self.output.connection(with: .video)?.videoOrientation = orientation
    }
  }

  private func detector() throws -> HandLandmarker {
    if let landmarker { return landmarker }
    let key = FlutterDartProject.lookupKey(forAsset: "assets/models/hand_landmarker.task")
    guard let path = Bundle.main.path(forResource: key, ofType: nil) else {
      throw NSError(domain: "ParlanceSignCamera", code: 1, userInfo: [NSLocalizedDescriptionKey: "Hand model missing"])
    }
    let options = HandLandmarkerOptions()
    options.baseOptions.modelAssetPath = path
    options.baseOptions.delegate = .CPU
    options.runningMode = .video
    options.numHands = 2
    options.minHandDetectionConfidence = 0.3
    options.minHandPresenceConfidence = 0.3
    options.minTrackingConfidence = 0.3
    let created = try HandLandmarker(options: options)
    landmarker = created
    return created
  }

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard let pixels = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
    do {
      let image = try MPImage(sampleBuffer: sampleBuffer, orientation: .up)
      var now = Int(CACurrentMediaTime() * 1000)
      if now <= lastTimestamp { now = lastTimestamp + 1 }
      lastTimestamp = now
      let result = try detector().detect(videoFrame: image, timestampInMilliseconds: now)
      var hands: [[String: Any]] = []
      for (index, points) in result.landmarks.enumerated() {
        guard index < result.handedness.count, let category = result.handedness[index].first else { continue }
        var flat: [Double] = []
        flat.reserveCapacity(points.count * 3)
        for point in points {
          flat.append(Double(point.x))
          flat.append(Double(point.y))
          flat.append(Double(point.z))
        }
        hands.append(["label": category.categoryName ?? "", "score": Double(category.score), "points": flat])
      }
      frames.send(["w": CVPixelBufferGetWidth(pixels), "h": CVPixelBufferGetHeight(pixels), "hands": hands])
    } catch {
      NSLog("Parlance sign camera: \(error)")
    }
  }
}
