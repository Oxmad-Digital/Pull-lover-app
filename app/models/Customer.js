import { createPostgresModel } from "@/app/lib/postgres-model";

const Customer = createPostgresModel({
  table: "customers",
  defaults: {
    phone: "",
    city: "",
    address: "",
    totalOrders: 0,
    totalSpent: 0,
    status: "active",
    notes: "",
    lastOrderAt: null,
  },
  normalize: (customer) => ({
    ...customer,
    firstname: customer.firstname?.trim(),
    lastname: customer.lastname?.trim(),
    email: customer.email?.toLowerCase().trim(),
  }),
});

export default Customer;
