export type ToastTone = 'success' | 'error';

export function showToast(message: string, tone: ToastTone = 'success') {
  window.dispatchEvent(
    new CustomEvent('npc:toast', {
      detail: { message, tone },
    }),
  );
}
