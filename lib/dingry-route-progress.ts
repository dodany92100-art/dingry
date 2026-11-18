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

export function subscribeDingryRouteProgress(listener: ProgressListener): () => void {
  listeners.add(listener);
  listener(value, visible);
  return () => listeners.delete(listener);
}

/** Lance la barre (Alto, navigation client). */
export function startDingryRouteProgress(): void {
  clearHide();
  clearCreep();
  visible = true;
  value = 0.12;
  emit();
  creepTimer = setInterval(() => {
    if (!visible) return;
    value = Math.min(0.92, value + 0.04 + (0.92 - value) * 0.08);
    emit();
  }, 120);
}

/** Termine la barre quand la route est prête. */
export function finishDingryRouteProgress(): void {
  clearCreep();
  if (!visible) return;
  value = 1;
  emit();
  clearHide();
  hideTimer = setTimeout(() => {
    visible = false;
    value = 0;
    emit();
  }, 320);
}