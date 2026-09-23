import { createPostgresModel } from "@/app/lib/postgres-model";
import "./Category";

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
  references: { category: "categories" },
  defaults: {
    description: "",
    image: "",
    images: [],
    imageKeys: [],
    price: 0,
    promoPrice: null,
    stock: 0,
    stocks: {},
    category: null,
    brand: "",
    size: "",
    condition: "",
    details: "",
    careInstructions: "",
    specifications: [],
    sizes: [],
    colors: [],
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
