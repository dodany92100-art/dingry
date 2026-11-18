type ProgressListener = (value: number, visible: boolean) => void;

let visible = false;
let value = 0;
let creepTimer: ReturnType<typeof setInterval> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<ProgressListener>();

function emit() {
  listeners.forEach((listener) => listener(value, visible));
}

function clearCreep() {
  if (creepTimer !== null) {
    clearInterval(creepTimer);
    creepTimer = null;
  }
}

function clearHide() {
  if (hideTimer !== null) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

export function subscribeCrmAdminLoadProgress(listener: ProgressListener): () => void {
  listeners.add(listener);
  listener(value, visible);
  return () => listeners.delete(listener);
}

/** Écran passage CRM (session, auth, chargement données). */
export function startCrmAdminLoadProgress(): void {
  clearHide();
  clearCreep();
  visible = true;
  value = Math.max(value, 0.08);
  emit();
  if (!creepTimer) {
    creepTimer = setInterval(() => {
      if (!visible) return;
      const cap = 0.94;
      value = Math.min(cap, value + 0.025 + (cap - value) * 0.06);
      emit();
    }, 140);
  }
}

export function setCrmAdminLoadProgress(next: number): void {
  clearHide();
  if (!visible) {
    visible = true;
    value = 0.08;
  }
  value = Math.min(0.97, Math.max(0.05, next));
  emit();
}

export function finishCrmAdminLoadProgress(): void {
  clearCreep();
  if (!visible) return;
  value = 1;
  emit();
  clearHide();
  hideTimer = setTimeout(() => {
    visible = false;
    value = 0;
    emit();
  }, 380);
}