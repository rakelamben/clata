const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// The signed package format uses Opus files. Metro does not treat `.opus` as
// an asset by default, so static bundled audio references would fail during
// bundling before the resolver can safely mark POC audio unavailable.
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, 'opus'])];

module.exports = config;
