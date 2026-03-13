#!/bin/bash

# Exit on error
set -e

# Define directories
SRC_DIR="src"
BUILD_DIR="dist-firefox"
ZIP_NAME="copy-latex-firefox.zip"

echo "🚀 Starting Firefox build process..."

# 1. Clean and create build directory
rm -rf "$BUILD_DIR" "$ZIP_NAME"
mkdir -p "$BUILD_DIR"

# 2. Copy all files from src
cp -r "$SRC_DIR/"* "$BUILD_DIR/"

echo "📂 Files copied to $BUILD_DIR"

# 3. Add browser_specific_settings to manifest.json (required for some Firefox features)
# This uses a temporary file to avoid complex in-place sed issues with JSON
MANIFEST_FILE="$BUILD_DIR/manifest.json"
cat > "$MANIFEST_FILE.tmp" <<EOF
$(cat "$MANIFEST_FILE" | sed '$d')
  ,"browser_specific_settings": {
    "gecko": {
      "id": "copy-latex@mapaor.github.io",
      "strict_min_version": "101.0"
    }
  }
}
EOF
mv "$MANIFEST_FILE.tmp" "$MANIFEST_FILE"

echo "✅ Added Firefox-specific settings to manifest.json"

# 4. Replace Chrome-specific shortcuts URL in popup.js
POPUP_JS="$BUILD_DIR/popup.js"
sed -i 's|chrome://extensions/shortcuts|about:addons|g' "$POPUP_JS"

echo "✅ Replaced Chrome-specific shortcuts URL with about:addons"

# 5. Create the zip file
cd "$BUILD_DIR"
zip -r "../$ZIP_NAME" ./* > /dev/null
cd ..

echo "📦 Build complete! Created $ZIP_NAME"
echo "ℹ️  You can load this zip as a temporary add-on in about:debugging or upload it to AMO."
