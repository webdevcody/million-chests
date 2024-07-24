import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chests: defineTable({
    partition: v.number(),
    bitset: v.number(),
  }).index("by_partition", ["partition"]),
  sums: defineTable({
    value: v.number(),
    index: v.number(),
  }).index("by_index", ["index"]),
  rateLimits: defineTable({
    key: v.string(),
    value: v.number(),
    resetOn: v.number(),
  }).index("by_key", ["key"]),
});
