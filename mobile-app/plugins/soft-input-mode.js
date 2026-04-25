const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Keeps MainActivity in pan mode so Android password/autofill interactions
 * don't force a resize-driven activity reset during auth flows.
 */
module.exports = function withSoftInputMode(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    const activities = app?.activity ?? [];
    const mainActivity = activities.find(
      (activity) => activity.$["android:name"] === "MainActivity",
    );

    if (mainActivity) {
      mainActivity.$["android:windowSoftInputMode"] = "stateHidden|adjustPan";
    }

    return config;
  });
};
