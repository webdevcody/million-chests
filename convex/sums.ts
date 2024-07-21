import { query } from "./_generated/server";

export const getOpenBoxSum = query({
  async handler(ctx) {
    const sumRecords = await ctx.db.query("sums").collect();
    return sumRecords.reduce((acc, record) => acc + record.value, 0);
  },
});
