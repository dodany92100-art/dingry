import { headers } from "next/headers";
import { isCrmHost, normalizeHostname } from "@/lib/host-routing";

export async function requestHostnameFromHeaders(): Promise<string> {
  const store = await headers();
  const host = store.get("host") ?? "";
  return normalizeHostname(host.split(",")[0]?.trim() ?? "");
}

export async function isRequestCrmHost(): Promise<boolean> {
  return isCrmHost(await requestHostnameFromHeaders());
}