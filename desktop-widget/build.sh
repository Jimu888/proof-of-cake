#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

APP="MementWidget.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS"

cat > "$APP/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>MementWidget</string>
  <key>CFBundleDisplayName</key>
  <string>Mement Desktop Widget</string>
  <key>CFBundleIdentifier</key>
  <string>art.mement.desktop-widget</string>
  <key>CFBundleVersion</key>
  <string>1.0</string>
  <key>CFBundleExecutable</key>
  <string>MementWidget</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>LSUIElement</key>
  <true/>
</dict>
</plist>
EOF

swiftc -O -framework Cocoa -framework WebKit MementWidget.swift -o "$APP/Contents/MacOS/MementWidget"
echo "Built $(pwd)/$APP"
