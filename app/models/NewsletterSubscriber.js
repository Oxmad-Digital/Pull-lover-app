import { createPostgresModel } from "@/app/lib/postgres-model";

const NewsletterSubscriber = createPostgresModel({
  table: "newsletter_subscribers",
  normalize: (subscriber) => ({
    ...subscriber,
    email: subscriber.email?.toLowerCase().trim(),
  }),
});

export default NewsletterSubscriber;
