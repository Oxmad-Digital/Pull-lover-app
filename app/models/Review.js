import { createPostgresModel } from "@/app/lib/postgres-model";

const Review = createPostgresModel({
  table: "reviews",
  defaults: { date: null },
});

export default Review;
