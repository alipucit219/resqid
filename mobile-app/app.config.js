const appJson = require("./app.json");

module.exports = () => {
  const expo = appJson.expo ?? {};
  const extra = expo.extra ?? {};
  const eas = extra.eas ?? {};
  const projectIdCandidates = [
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    process.env.EAS_PROJECT_ID,
    eas.projectId,
  ];
  const projectId =
    projectIdCandidates.find(
      (value) => typeof value === "string" && value.trim().length > 0
    ) ?? null;

  return {
    ...expo,
    extra: {
      ...extra,
      eas: {
        ...eas,
        projectId,
      },
    },
  };
};
