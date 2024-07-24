import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { BITS_IN_PARTITION, getIsEnabled, getSumPartitions } from "./config";

const LIMIT_PER_SECOND = 5;

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

async function rateLimitByKey(ctx: MutationCtx, key: string) {
  const rateLimit = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  if (!rateLimit) {
    await ctx.db.insert("rateLimits", {
      key,
      value: 1,
      resetOn: Date.now() + 1000,
    });
  } else {
    if (rateLimit.value >= LIMIT_PER_SECOND) {
      if (rateLimit.resetOn < Date.now()) {
        rateLimit.value = 0;
        rateLimit.resetOn = Date.now() + 1000;
      } else {
        return true;
      }
    }
    rateLimit.value++;
    await ctx.db.patch(rateLimit._id, {
      value: rateLimit.value,
      resetOn: rateLimit.resetOn,
    });
  }
  return false;
}

export const openChest = mutation({
  args: {
    index: v.number(),
    sessionId: v.string(),
  },
  async handler(ctx, args) {
    if (!getIsEnabled()) {
      return;
    }

    const isLimited = await rateLimitByKey(ctx, args.sessionId);
    if (!isLimited) {
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
