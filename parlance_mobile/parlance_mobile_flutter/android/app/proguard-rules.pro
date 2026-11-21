# Release builds shrink and rename code with R8. MediaPipe Tasks reads its
# protobuf messages by reflection (field names such as "platform_"), so
# renamed protobuf/MediaPipe classes make HandLandmarker fail on every phone
# ("Field platform_ for ... not found"). Keep them as they are.
-keep class com.google.mediapipe.** { *; }
-keep class com.google.protobuf.** { *; }
-keepclassmembers class * extends com.google.protobuf.GeneratedMessageLite { *; }
-dontwarn com.google.mediapipe.**
-dontwarn com.google.protobuf.**
# MediaPipe logs through Flogger, which looks up its caller by class name.
-keep class com.google.common.flogger.** { *; }
-dontwarn com.google.common.flogger.**
