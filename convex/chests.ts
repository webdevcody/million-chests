import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

export const BITS_IN_PARTITION = 32;
export const SUM_PARTITIONS = 5;

function getGoldChestsEnv() {
  return process.env.GOLD_CHESTS!.split(";").map((s) => {
    const [index, code] = s.split(",");
    return {
      index: parseInt(index),
      code,
    };
  });
}

async function incrementCount(ctx: MutationCtx) {
  const randomIndex = Math.floor(Math.random() * SUM_PARTITIONS);
  const sumRecord = await ctx.db
    .query("sums")
    .withIndex("by_index", (q) => q.eq("index", randomIndex))
    .first();
  sumRecord!.value++;
  await ctx.db.patch(sumRecord!._id, { value: sumRecord!.value });
}

export const openChest = mutation({
  args: {
    index: v.number(),
  },
  async handler(ctx, args) {
    const partition = Math.floor(args.index / BITS_IN_PARTITION);

    const chestPartition = await ctx.db
      .query("chests")
      .withIndex("by_partition", (q) => q.eq("partition", partition))
      .first();

    if (!chestPartition) {
      await ctx.db.insert("chests", {
        partition,
        bitset: 1 << args.index % BITS_IN_PARTITION,
      });
    } else {
      chestPartition.bitset |= 1 << args.index % BITS_IN_PARTITION;
      await ctx.db.patch(chestPartition._id, {
        bitset: chestPartition.bitset,
      });
    }

    await incrementCount(ctx);

    const goldChest = getGoldChestsEnv().find((c) => c.index === args.index);
    if (goldChest) {
      return goldChest.code;
    }
  },
});

export const getChestPartition = query({
  args: {
    partition: v.number(),
  },
  async handler(ctx, args) {
    const chestPartition = await ctx.db
      .query("chests")
      .withIndex("by_partition", (q) => q.eq("partition", args.partition))
      .first();

    return chestPartition;
  },
});

async function isChestOpen(ctx: QueryCtx, index: number) {
  const partition = Math.floor(index / BITS_IN_PARTITION);
  const bit = 1 << index % BITS_IN_PARTITION;

  const chestPartition = await ctx.db
    .query("chests")
    .withIndex("by_partition", (q) => q.eq("partition", partition))
    .first();

  return chestPartition ? (chestPartition.bitset & bit) !== 0 : false;
}

export const getGoldChests = query({
  async handler(ctx) {
    const chests = await Promise.all(
      getGoldChestsEnv().map(async (chest) => {
        return {
          isOpen: await isChestOpen(ctx, chest.index),
          index: chest.index,
        };
      })
    );
    const onlyOpenGoldChests = chests.filter((chest) => chest.isOpen);
    return onlyOpenGoldChests;
  },
});
