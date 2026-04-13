"use client";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-sm rounded-2xl border border-brand-200 bg-white p-4 shadow-pop safe-bottom">
      <div className="text-sm font-semibold text-ink-900">Install HangeulVision AI</div>
      <div className="mt-1 text-xs text-ink-500">
        Works offline. One-tap launch. Web, Android & iOS in one app.
      </div>
      <div className="mt-3 flex gap-2">
        <button
          className="btn-primary flex-1"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
          }}
        >
          Install
        </button>
        <button className="btn-ghost" onClick={() => setDismissed(true)}>
          Later
        </button>
      </div>
    </div>
  );
}
