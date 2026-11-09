/**
 * Supprime tous les objets du bucket R2 configuré (.env.local).
 * Usage : npx tsx scripts/purge-r2-bucket.ts --confirm
 */
import { config } from "dotenv";
import path from "node:path";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  isR2ImageStorageEnabled,
  r2AccountId,
  r2BucketName,
  r2CredentialFormatError,
  r2S3Endpoint,
} from "../lib/r2/config";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

const confirm = process.argv.includes("--confirm");

async function listAllKeys(client: S3Client, bucket: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const out: ListObjectsV2CommandOutput = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }),
    );
    for (const item of out.Contents ?? []) {
      if (item.Key) keys.push(item.Key);
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function main(): Promise<void> {
  const formatError = r2CredentialFormatError();
  if (formatError) {
    console.error(formatError);
    process.exit(1);
  }
  if (!isR2ImageStorageEnabled() || !r2AccountId()) {
    console.error("R2 incomplet (ACCOUNT_ID, clés S3, bucket).");
    process.exit(1);
  }

  const bucket = r2BucketName();
  const client = new S3Client({
    region: "auto",
    endpoint: r2S3Endpoint(),
    credentials: {
      accessKeyId: (process.env.R2_ACCESS_KEY_ID ?? "").trim(),
      secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY ?? "").trim(),
    },
  });

  const keys = await listAllKeys(client, bucket);
  console.log(`Bucket ${bucket} : ${keys.length} objet(s).`);

  if (keys.length === 0) {
    console.log("Rien à supprimer.");
    return;
  }

  if (!confirm) {
    console.error("Relance avec --confirm pour effacer.");
    process.exit(2);
  }

  let deleted = 0;
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    deleted += chunk.length;
    console.log(`… ${deleted}/${keys.length}`);
  }

  console.log(`Purge terminée : ${deleted} objet(s) supprimés.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
