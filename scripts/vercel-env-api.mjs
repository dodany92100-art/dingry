import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadProjectAuth() {
  const projectJson = JSON.parse(readFileSync(path.join(root, ".vercel", "project.json"), "utf8"));
  const auth = JSON.parse(
    readFileSync(
      path.join(process.env.HOME ?? "", "Library/Application Support/com.vercel.cli/auth.json"),
      "utf8",
    ),
  );
  return { projectId: projectJson.projectId, teamId: projectJson.orgId, token: auth.token };
}

export function createVercelApi({ projectId, teamId, token }) {
  async function api(pathname, init = {}) {
    const url = new URL(pathname, "https://api.vercel.com");
    url.searchParams.set("teamId", teamId);
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = typeof body.error?.message === "string" ? body.error.message : response.statusText;
      throw new Error(`${init.method ?? "GET"} ${pathname}: ${msg}`);
    }
    return body;
  }

  async function listEnvs(decrypt = false) {
    const q = decrypt ? "?decrypt=true" : "";
    const data = await api(`/v9/projects/${projectId}/env${q}`);
    return data.envs ?? [];
  }

  function envForTarget(envs, key, target) {
    return envs.find(
      (row) => row.key === key && row.target?.includes(target) && !row.gitBranch,
    );
  }

  async function upsertEnv(key, value, { plain, targets }) {
    const type = plain ? "plain" : "encrypted";
    const envs = await listEnvs();
    for (const target of targets) {
      const existing = envForTarget(envs, key, target);
      if (!value) {
        if (existing) console.log(`keep ${key} (${target}, valeur locale vide)`);
        else console.log(`skip ${key} (${target}, vide)`);
        continue;
      }
      const payload = { value, type, target: [target] };
      if (existing?.id) {
        await api(`/v9/projects/${projectId}/env/${existing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        console.log(`updated ${key} (${target})`);
      } else {
        await api(`/v10/projects/${projectId}/env`, {
          method: "POST",
          body: JSON.stringify({ key, ...payload }),
        });
        console.log(`added ${key} (${target})`);
      }
    }
  }

  return { listEnvs, upsertEnv, envForTarget };
}
