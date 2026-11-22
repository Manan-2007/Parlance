#!/bin/sh
# Copies what the app needs to work without internet into assets/offline/
# (gitignored, so the 30 MB of weights and the signer build are not stored
# twice in Git):
#   recognition/  the sign recogniser's model (from parlance_mobile_server/assets/recognition)
#   signer/       the website's 3D signer build (from parlance_mobile_server/web/signer;
#                 build it first with parlance_mobile_server/tool/build_signer.sh)
# Run before building the Android or iOS app (tool/build_android.sh does).
# Without these files the app still works, online: it falls back to the server.
set -e
here=$(cd "$(dirname "$0")/.." && pwd)
server="$here/../parlance_mobile_server"
out="$here/assets/offline"

mkdir -p "$out/recognition" "$out/signer/assets" "$out/signer/signs" "$out/signer/icons"
cp "$server"/assets/recognition/transformer.json "$server"/assets/recognition/transformer.bin \
   "$server"/assets/recognition/forest.json "$server"/assets/recognition/forest.bin "$out/recognition/"

if [ ! -f "$server/web/signer/index.html" ]; then
  echo "No signer build in $server/web/signer. Run parlance_mobile_server/tool/build_signer.sh first." >&2
  exit 1
fi
# Only the 3D signer pages and the Ch22 avatar; the other avatars are unused.
rsync -a --delete --exclude .gitkeep --exclude remy.glb --exclude ybot.glb "$server/web/signer/assets/" "$out/signer/assets/"
rsync -a --delete --exclude .gitkeep "$server/web/signer/signs/" "$out/signer/signs/"
rsync -a --delete --exclude .gitkeep "$server/web/signer/icons/" "$out/signer/icons/"
for f in index.html favicon.svg manifest.webmanifest; do
  cp "$server/web/signer/$f" "$out/signer/$f"
done
echo "Offline assets: $(du -sh "$out" | cut -f1) in assets/offline"
