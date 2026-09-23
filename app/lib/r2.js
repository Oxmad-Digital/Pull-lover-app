import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const requiredVariables = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

function getConfig() {
  const missing = requiredVariables.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Configuration R2 manquante : ${missing.join(", ")}`);
  }

  return {
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME,
  };
}

let client;

export function getR2Client() {
  if (!client) {
    const config = getConfig();
    client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return client;
}

export function getR2Bucket() {
  return getConfig().bucket;
}

export function r2Url(key) {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `/api/media/${encodedKey}`;
}

export function r2KeyFromUrl(value) {
  if (!value || typeof value !== "string") return null;

  const marker = "/api/media/";
  const markerIndex = value.indexOf(marker);
  if (markerIndex === -1) return null;

  try {
    return value
      .slice(markerIndex + marker.length)
      .split("/")
      .map(decodeURIComponent)
      .join("/");
  } catch {
    return null;
  }
}

export async function uploadToR2({ key, body, contentType, cacheControl }) {
  await getR2Client().send(new PutObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: cacheControl || "public, max-age=31536000, immutable",
  }));

  return { key, url: r2Url(key) };
}

export async function getFromR2(key, range) {
  return getR2Client().send(new GetObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    ...(range ? { Range: range } : {}),
  }));
}

export async function getSignedR2Url(key) {
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({ Bucket: getR2Bucket(), Key: key }),
    { expiresIn: 15 * 60 }
  );
}

export async function deleteFromR2(key) {
  if (!key) return;
  await getR2Client().send(new DeleteObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
  }));
}
