const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);

const rorkConfig = withRorkMetro(config);

rorkConfig.transformer = {
	...rorkConfig.transformer,
	babelTransformerPath: require.resolve("./metro-transformer"),
};

module.exports = rorkConfig;
