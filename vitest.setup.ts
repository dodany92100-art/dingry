import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const root = path.dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: path.join(root, ".env") });
loadDotenv({ path: path.join(root, ".env.local"), override: true });
