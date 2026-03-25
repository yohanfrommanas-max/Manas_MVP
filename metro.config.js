const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.watchFolders = (config.watchFolders || []).filter(
  (f) => !f.includes("/.local/")
);

config.resolver = {
  ...config.resolver,
  blockList: [
    /\.local[/\\].*/,
    /\.git[/\\].*/,
  ],
  sourceExts: [...(config.resolver.sourceExts || []), 'mjs', 'cjs'],
  resolverMainFields: ['react-native', 'browser', 'main'],
  unstable_enablePackageExports: false,
};

module.exports = config;
