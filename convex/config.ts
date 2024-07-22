import { query } from "./_generated/server";

export const getFeatureFlags = query({
  async handler() {
    return {
      isEnabled: getIsEnabled(),
    };
  },
});

export function getIsEnabled() {
  return process.env.IS_ENABLED === "true";
}
