#!/usr/bin/env bash
set -euo pipefail

PDFJS_DIR="$(dirname "$(node -p "require.resolve('pdfjs-dist/package.json')")")"

echo "> Copying pdfjs-dist assets to public/static"
mkdir -p public/static/cmaps public/static/scripts
cp -R "${PDFJS_DIR}/cmaps/." public/static/cmaps/
cp "${PDFJS_DIR}/build/pdf.worker.min.mjs" public/static/scripts/pdf.worker.min.mjs
