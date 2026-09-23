import { createPostgresModel } from "@/app/lib/postgres-model";
import "./Product";

const Order = createPostgresModel({
  table: "orders",
  references: { "products.product": "products" },
  defaults: {
    customer: {},
    products: [],
    total: 0,
    stripePaymentId: null,
    payment: "cash",
    status: "pending",
    delivery: {
      method: "colissimo_domicile",
      trackingNumber: null,
      labelUrl: null,
      relayId: null,
      shippedAt: null,
    },
  },
});

export default Order;
