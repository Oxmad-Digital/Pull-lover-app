import { createPostgresModel } from "@/app/lib/postgres-model";

const Category = createPostgresModel({
  table: "categories",
  normalize: (category) => ({ ...category, name: category.name?.trim() }),
});

export default Category;
