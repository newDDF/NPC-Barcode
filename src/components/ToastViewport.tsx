import { useEffect, useState } from 'react';
import type { ToastTone } from '../features/shared/notifications';

type ToastMessage = {
  message: string;
  tone: ToastTone;
};

export default function ToastViewport() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    let timeout: number | undefined;

    function handleToast(event: Event) {
      const detail = (event as CustomEvent<ToastMessage>).detail;
      if (!detail?.message) return;

      if (timeout !== undefined) window.clearTimeout(timeout);
      setToast(detail);

      timeout = window.setTimeout(() => {
        setToast(null);
        timeout = undefined;
      }, 2600);
    }

    window.addEventListener('npc:toast', handleToast);

    return () => {
      window.removeEventListener('npc:toast', handleToast);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, []);

  if (!toast) return null;

  const success = toast.tone === 'success';

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[100] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-2xl"
      role={success ? 'status' : 'alert'}
      aria-live={success ? 'polite' : 'assertive'}
    >
      <i
        className={`fa-solid ${success ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-red-400'}`}
        aria-hidden="true"
      />
      <span>{toast.message}</span>
    </div>
  );
}
