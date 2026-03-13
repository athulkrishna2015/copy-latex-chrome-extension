#!/bin/bash

# Exit on error
set -e

# Define directories
SRC_DIR="src"
BUILD_DIR="dist-chrome"
ZIP_NAME="copy-latex-chrome.zip"

echo "🚀 Starting Chrome build process..."

# 1. Clean and create build directory
rm -rf "$BUILD_DIR" "$ZIP_NAME"
mkdir -p "$BUILD_DIR"

# 2. Copy all files from src
cp -r "$SRC_DIR/"* "$BUILD_DIR/"

echo "📂 Files copied to $BUILD_DIR"

# 3. Ensure the shortcuts URL is correct for Chrome (it should be by default)
# This is a safety check in case the source file was ever modified
POPUP_JS="$BUILD_DIR/popup.js"
sed -i 's|about:addons|chrome://extensions/shortcuts|g' "$POPUP_JS"

echo "✅ Verified Chrome-specific shortcuts URL"

# 4. Create the zip file
cd "$BUILD_DIR"
zip -r "../$ZIP_NAME" ./* > /dev/null
cd ..

echo "📦 Build complete! Created $ZIP_NAME"
echo "ℹ️  You can upload this zip directly to the Chrome Web Store Developer Dashboard."
