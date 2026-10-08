import { createPostgresModel } from "@/app/lib/postgres-model";

function createSlug(name) {
  return `${String(name || "produit")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${Date.now()}`;
}

const Product = createPostgresModel({
  table: "products",
  defaults: {
    description: "",
    image: "",
    images: [],
    imageKeys: [],
    price: 0,
    promoPrice: null,
    stock: 0,
    stocks: {},
    brand: "",
    size: "",
    condition: "",
    details: "",
    careInstructions: "",
    fitInfo: "",
    shippingInfo: "",
    color: "",
    specifications: [],
    sizes: [],
    colors: [],
    variants: [],
    weight: 0,
    rating: 0,
    reviewsCount: 0,
    isAvailable: true,
    isFeatured: false,
  },
  normalize: (product) => ({
    ...product,
    name: product.name?.trim(),
    slug: product.slug || createSlug(product.name),
  }),
});

export default Product;
