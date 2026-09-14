const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// inlineRem 16 keeps Tailwind's spacing scale honest: `p-4` is 16dp, as on the web.
module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
