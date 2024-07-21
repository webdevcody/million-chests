import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chests: defineTable({
    index: v.number(),
    isOpen: v.boolean(),
  }).index("by_index", ["index"]),
});
