#!/bin/sh
# Builds the Android app pointed at a deployed server and puts it in web/get,
# so the server offers it at <server>/get/parlance.apk, and records its build
# number so installed apps offer the update. Redeploy afterwards.
#   tool/build_android.sh https://<project>.api.serverpod.space/
set -e
case "$1" in https://*/) ;; *) echo "Usage: $0 https://<project>.api.serverpod.space/  (the API address, ending with /)"; exit 1;; esac
here=$(cd "$(dirname "$0")/.." && pwd)
cd "$here/../parlance_mobile_flutter"
build=$(date +%Y%m%d%H%M)
flutter build apk --release --target-platform android-arm,android-arm64 --dart-define=SERVER_URL="$1" --dart-define=APP_BUILD="$build"
mkdir -p "$here/web/get"
cp build/app/outputs/flutter-apk/app-release.apk "$here/web/get/parlance.apk"
echo "Android app: $(du -h "$here/web/get/parlance.apk" | cut -f1), build $build, served at /get/parlance.apk after the next deploy"
# Older installed apps compare their build with this and offer the update.
(cd "$here" && serverpod cloud --non-interactive password set --name androidBuild --value "$build" >/dev/null 2>&1 && echo "androidBuild set to $build") || echo "Set it yourself: serverpod cloud password set androidBuild $build"
