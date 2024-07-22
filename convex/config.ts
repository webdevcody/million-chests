import { query } from "./_generated/server";

export const BITS_IN_PARTITION = 32;
export const DEFAULT_SUM_PARTITIONS = 5;

export const getFeatureFlags = query({
  async handler() {
    return {
      isEnabled: getIsEnabled(),
    };
  },
});

export function getSumPartitions() {
  return parseInt(process.env.SUM_PARTITIONS!) ?? DEFAULT_SUM_PARTITIONS;
}

export function getIsEnabled() {
  return process.env.IS_ENABLED === "true";
}
