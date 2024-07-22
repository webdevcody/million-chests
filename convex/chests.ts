import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { BITS_IN_PARTITION, getIsEnabled, getSumPartitions } from "./config";

export const getTotalGoldChests = query({
  async handler() {
    return process.env.GOLD_CHESTS!.split(";").length;
  },
});

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
  const randomIndex = Math.floor(Math.random() * getSumPartitions());
  const sumRecord = await ctx.db
    .query("sums")
    .withIndex("by_index", (q) => q.eq("index", randomIndex))
    .first();

  if (!sumRecord) {
    await ctx.db.insert("sums", { index: randomIndex, value: 1 });
  } else {
    sumRecord.value++;
    await ctx.db.patch(sumRecord._id, { value: sumRecord.value });
  }
}

export const openChest = mutation({
  args: {
    index: v.number(),
  },
  async handler(ctx, args) {
    if (!getIsEnabled()) {
      return;
    }

    const partition = Math.floor(args.index / BITS_IN_PARTITION);

    const chestPartition = await ctx.db
      .query("chests")
      .withIndex("by_partition", (q) => q.eq("partition", partition))
      .first();

    const bit = 1 << args.index % BITS_IN_PARTITION;
    const isChestAlreadyOpen =
      chestPartition && (chestPartition.bitset & bit) !== 0;

    if (isChestAlreadyOpen) {
      return;
    }

    if (!chestPartition) {
      await ctx.db.insert("chests", {
        partition,
        bitset: bit,
      });
    } else {
      chestPartition.bitset |= bit;
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
