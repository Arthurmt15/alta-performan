const { getDefaultConfig } = require("expo/metro-config");

let withNativeWind = (c) => c;
try {
  // nativewind v4 tem metro, v2 não precisa - fallback seguro
  withNativeWind = require("nativewind/metro").withNativeWind;
} catch {}

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
