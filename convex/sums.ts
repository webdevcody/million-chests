import { query } from "./_generated/server";

export const getOpenBoxSum = query({
  async handler(ctx) {
    const sumRecord = await ctx.db.query("sums").first();
    return sumRecord?.value ?? 0;
  },
});
