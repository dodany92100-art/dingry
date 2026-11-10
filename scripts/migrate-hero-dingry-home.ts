import { config } from "dotenv";
import path from "node:path";
import { migrateUrlToR2, isR2ImageStorageEnabled } from "../lib/r2/migrate-image";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

void (async () => {
  if (!isR2ImageStorageEnabled()) throw new Error("R2 non configuré");
  const src = "https://res.cloudinary.com/dc9xmxpvv/image/upload/v1787869217/dingry-home_agf2gc.jpg";
  const { imageUrl } = await migrateUrlToR2(src, "dingry/brand/hero", "dingry-home");
  console.log(imageUrl);
})();
