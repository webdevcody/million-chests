import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const openChest = mutation({
  args: {
    index: v.number(),
  },
  async handler(ctx, args) {
    const chest = await ctx.db
      .query("chests")
      .withIndex("by_index", (q) => q.eq("index", args.index))
      .first();

    if (chest) {
      return;
    }

    await ctx.db.insert("chests", {
      index: args.index,
      isOpen: true,
    });
  },
});

export const getChest = query({
  args: {
    index: v.number(),
  },
  async handler(ctx, args) {
    const chest = await ctx.db
      .query("chests")
      .withIndex("by_index", (q) => q.eq("index", args.index))
      .first();
    if (!chest) {
      return null;
    }
    return chest;
  },
});
