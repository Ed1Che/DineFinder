// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        unstable_transformImportMeta: true, // <- Add this to fix Hermes import.meta error
      }],
    ],
  };
};
