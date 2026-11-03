#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ "$(uname -s)" != "Darwin" ]; then echo 'This step requires macOS and Xcode.'; exit 1; fi
xcodebuild -version
command -v pod >/dev/null || { echo 'Install CocoaPods first.'; exit 1; }
npm ci
node scripts/prepare-personal-ios.mjs
npx cap sync ios
open ios/App/App.xcworkspace
printf '\nChoose your Apple signing team and attached iPhone, then Run.\n'
