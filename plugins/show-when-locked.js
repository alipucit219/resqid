const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Adds android:showWhenLocked and android:turnScreenOn to MainActivity so the app
 * can be displayed over the lock screen when launched from a full-screen intent
 * notification or quick action.
 */
module.exports = function withShowWhenLocked(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    const activities = app?.activity ?? [];
    const mainActivity = activities.find(
      (activity) => activity.$["android:name"] === "MainActivity",
    );

    if (mainActivity) {
      mainActivity.$["android:showWhenLocked"] = "true";
      mainActivity.$["android:turnScreenOn"] = "true";
    }

    return config;
  });
};
