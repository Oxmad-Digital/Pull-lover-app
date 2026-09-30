import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { connectDB, isValidId } from "@/app/lib/db";
import Review from "@/app/models/Review";
import Product from "@/app/models/Product";
import { publicReviews } from "@/app/lib/products";
import { rateLimit } from "@/app/lib/rateLimit";
import { translator } from "@/app/i18n/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return Response.json({ error: "productId manquant" }, { status: 400 });
    }

    await connectDB();
    const reviews = await Review.find({ productId }).sort({ date: -1 }).lean();
    // Le formulaire ajoute l'avis publié localement : un léger cache CDN ne le masque pas
    return Response.json(publicReviews(reviews), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("GET /api/reviews:", error);
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Avis réservés aux clients connectés (compte vérifié), avec des champs strictement typés :
// un objet stocké à la place d'un texte ferait planter le rendu de la fiche produit.
export async function POST(req) {
  const t = translator(req);
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: t("Connectez-vous pour laisser un avis.", "Please sign in to leave a review.") }, { status: 401 });
    }

    const { productId, name, rating, comment } = await req.json();
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanComment = typeof comment === "string" ? comment.trim() : "";
    const cleanRating = Number(rating);

    if (!isValidId(productId) || !Number.isInteger(cleanRating) || cleanRating < 1 || cleanRating > 5) {
      return Response.json({ error: t("Informations manquantes", "Missing information") }, { status: 400 });
    }
    if (cleanName.length < 2 || cleanName.length > 60) {
      return Response.json({ error: t("Le nom doit contenir entre 2 et 60 caractères.", "Your name must be between 2 and 60 characters.") }, { status: 400 });
    }
    if (cleanComment.length < 10 || cleanComment.length > 2000) {
      return Response.json({ error: t("Votre avis doit contenir entre 10 et 2 000 caractères.", "Your review must be between 10 and 2,000 characters.") }, { status: 400 });
    }

    const { allowed } = await rateLimit(`review:${session.user.id}`, { limit: 3, windowMs: 60 * 60 * 1000 });
    if (!allowed) {
      return Response.json({ error: t("Trop d'avis envoyés. Réessayez plus tard.", "Too many reviews sent. Please try again later.") }, { status: 429 });
    }

    await connectDB();
    if (!(await Product.findById(productId))) {
      return Response.json({ error: t("Produit introuvable", "Product not found") }, { status: 404 });
    }

    const review = await Review.create({
      productId,
      userId: session.user.id,
      name: cleanName,
      rating: cleanRating,
      comment: cleanComment,
      date: new Date(),
    });

    const [created] = publicReviews([review.toObject()]);
    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews:", error);
    return Response.json({ error: t("Erreur serveur", "Server error") }, { status: 500 });
  }
}
