const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// react-native-qrcode-svg imports `qrcode` from its own src/ — hoist for Metro.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  qrcode: path.resolve(__dirname, 'node_modules/qrcode'),
};

module.exports = withNativeWind(config, { input: './global.css' });
