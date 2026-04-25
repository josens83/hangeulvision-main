"use client";

import { useEffect, useState } from "react";

interface ToastItem {
  id: string;
  name: string;
  icon: string | null;
}

let toastCallback: ((items: ToastItem[]) => void) | null = null;

export function showAchievementToasts(items: ToastItem[]) {
  toastCallback?.(items);
}

export function AchievementToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastCallback = (newItems) => {
      setItems((prev) => [...prev, ...newItems]);
      setTimeout(() => {
        setItems((prev) => prev.slice(newItems.length));
      }, 4000);
    };
    return () => { toastCallback = null; };
  }, []);

  if (!items.length) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 sm:bottom-8">
      {items.map((item, i) => (
        <div
          key={`${item.id}-${i}`}
          className="animate-fadeIn rounded-2xl border border-brand-200 bg-white px-5 py-3 shadow-pop"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{item.icon ?? "🏅"}</span>
            <div>
              <div className="text-xs text-brand-600 font-semibold">Achievement unlocked!</div>
              <div className="text-sm font-bold text-ink-900">{item.name}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
