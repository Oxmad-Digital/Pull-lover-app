import { createPostgresModel } from "@/app/lib/postgres-model";

const Promo = createPostgresModel({
  table: "promos",
  defaults: {
    description: "",
    minOrderAmount: 0,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
    isActive: true,
  },
  normalize: (promo) => ({
    ...promo,
    code: promo.code?.toUpperCase().trim(),
  }),
});

export default Promo;
