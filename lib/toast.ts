export type Toast = { id: string; message: string; type: "success" | "error" };
type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export function addToast(message: string, type: Toast["type"] = "success") {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => removeToast(id), 3500);
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
