export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getFromR2, getSignedR2Url } from "@/app/lib/r2";
import { getAdminSession } from "@/app/lib/auth";

// Dossiers contenant des données personnelles (nom, adresse des clients)
const PRIVATE_PREFIXES = ["shipping-labels/"];

function objectKey(params) {
  return params.key.join("/");
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const key = objectKey(resolvedParams);

    if (PRIVATE_PREFIXES.some((prefix) => key.startsWith(prefix)) && !(await getAdminSession())) {
      return new Response("Accès refusé", { status: 401 });
    }

    if (/\.(?:mp4|webm|pdf)$/i.test(key)) {
      const signedUrl = await getSignedR2Url(key);
      return new Response(null, {
        status: 307,
        headers: {
          Location: signedUrl,
          "Cache-Control": "private, no-store",
        },
      });
    }

    const range = request.headers.get("range") || undefined;
    const object = await getFromR2(key, range);
    const headers = new Headers();
    if (object.ContentType) headers.set("Content-Type", object.ContentType);
    if (object.ContentLength != null) headers.set("Content-Length", String(object.ContentLength));
    if (object.ContentRange) headers.set("Content-Range", object.ContentRange);
    if (object.ETag) headers.set("ETag", object.ETag);
    if (object.LastModified) headers.set("Last-Modified", object.LastModified.toUTCString());
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", object.CacheControl || "public, max-age=31536000, immutable");
    // Sans s-maxage, le CDN de Vercel ne garde pas la réponse d'une fonction : chaque accès relirait R2.
    // Durée courte côté CDN (une image remplacée sous la même clé y reste au plus un jour).
    if (!object.ContentRange && !PRIVATE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      headers.set("Vercel-CDN-Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    }

    return new Response(object.Body?.transformToWebStream(), {
      status: object.ContentRange ? 206 : 200,
      headers,
    });
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NoSuchKey") {
      return new Response("Média introuvable", { status: 404 });
    }
    console.error("R2 GET ERROR:", error);
    return new Response("Erreur de lecture du média", { status: 500 });
  }
}
