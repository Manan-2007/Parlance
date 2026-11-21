plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// SERVERPOD_APP_BUILD is set when building on Serverpod Cloud.
val isServerpodCloudBuild = System.getenv("SERVERPOD_APP_BUILD") != null

android {
    signingConfigs {
        // Only configured on Serverpod Cloud builds. The keystore is provided
        // through the ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD,
        // ANDROID_KEY_ALIAS and ANDROID_KEY_PASSWORD environment variables.
        if (isServerpodCloudBuild) {
            create("release") {
                storeFile = file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ANDROID_KEY_ALIAS")
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }


    namespace = "space.serverpod.parlance_mobile"
    // permission_handler compiles against Android 17 (SDK 37).
    compileSdk = maxOf(flutter.compileSdkVersion, 37)
    ndkVersion = flutter.ndkVersion

    androidResources {
        // MediaPipe memory-maps the hand model, so it must not be compressed.
        noCompress += "task"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "app.parlance.mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        // MediaPipe Tasks and CameraX need Android 7.0 or later.
        minSdk = maxOf(flutter.minSdkVersion, 24)
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // No R8 shrinking: MediaPipe Tasks finds its protobuf fields and its
            // logger (Flogger) by class and field names, and renamed classes make
            // HandLandmarker fail on every phone ("Field platform_ ... not
            // found", "no caller found on the stack"). Keep-rules alone were not
            // enough; proguard-rules.pro stays for if shrinking is ever turned back on.
            isMinifyEnabled = false
            isShrinkResources = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // Release builds on Serverpod Cloud are signed with the release
            // signing config. Everywhere else, the debug keys are used so
            // `flutter run --release` works.
            signingConfig = if (isServerpodCloudBuild) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

dependencies {
    // The same MediaPipe release as the web app (@mediapipe/tasks-vision 1.0.0).
    implementation("com.google.mediapipe:tasks-vision:1.0.0")
    implementation("androidx.camera:camera-core:1.7.0")
    implementation("androidx.camera:camera-camera2:1.7.0")
    implementation("androidx.camera:camera-lifecycle:1.7.0")
    implementation("androidx.camera:camera-view:1.7.0")
}
