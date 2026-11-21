#!/bin/sh
# Builds the Parlance website's 3D signer (the repo root, page /embed/sign) into
# web/signer, served by this server at /signer/. The app's "See it in sign"
# opens /signer/embed/sign?text=... . Camera and sound models are left out:
# the signer only needs the avatar and the sign tables.
set -e
here=$(cd "$(dirname "$0")/.." && pwd)
site="$here/../.."  # the repo root: the Parlance website
tmp=$(mktemp -d)
(cd "$site" && npx vite build --base=/signer/ --outDir "$tmp" --emptyOutDir --logLevel warn)
mkdir -p "$here/web/signer"
rsync -a --delete --delete-excluded --exclude mediapipe --exclude models --exclude evaluation "$tmp/" "$here/web/signer/"
echo "Signer: $(du -sh "$here/web/signer" | cut -f1) in web/signer"
