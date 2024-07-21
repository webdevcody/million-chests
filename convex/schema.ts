import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chests: defineTable({
    partition: v.number(),
    bitset: v.number(),
  }).index("by_partition", ["partition"]),
});
