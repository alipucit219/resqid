const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Adds USE_FULL_SCREEN_INTENT permission (already declared in app.json) and ensures
 * the main activity can be used as the target for full-screen intent notifications.
 */
module.exports = function withFullscreenIntent(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    const activities = app?.activity ?? [];
    const mainActivity = activities.find(
      (activity) => activity.$["android:name"] === "MainActivity",
    );

    if (mainActivity) {
      mainActivity.$["android:showOnLockScreen"] = "true"; // legacy key some OEMs check
    }

    return config;
  });
};
