import { connectDB } from "@/app/lib/db";
import Review from "@/app/models/Review";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return Response.json({ error: "productId manquant" }, { status: 400 });
    }

    await connectDB();
    const reviews = await Review.find({ productId }).sort({ date: -1 }).lean();
    return Response.json(reviews);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { productId, name, rating, comment } = await req.json();

    if (!productId || !name || !comment || !rating) {
      return Response.json({ error: "Informations manquantes" }, { status: 400 });
    }

    await connectDB();
    const review = await Review.create({
      productId,
      name,
      rating: Number(rating),
      comment,
      date: new Date(),
    });

    return Response.json(review, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
