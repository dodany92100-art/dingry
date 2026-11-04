import { after } from "next/server";

/** Planifie un travail après la réponse HTTP ; hors scope requête (tests), exécution immédiate. */
export function deferAfter(task: () => void): void {
  try {
    after(task);
  } catch {
    task();
  }
}
