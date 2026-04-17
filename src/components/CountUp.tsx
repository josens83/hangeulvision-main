"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  end: number;
  suffix?: string;
  duration?: number;
  label: string;
}

export function CountUp({ end, suffix = "", duration = 1800, label }: CountUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.3 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const steps = 40;
    const inc = end / steps;
    const interval = duration / steps;
    let step = 0;
    const id = setInterval(() => {
      step++;
      if (step >= steps) {
        setValue(end);
        clearInterval(id);
      } else {
        setValue(Math.floor(inc * step));
      }
    }, interval);
    return () => clearInterval(id);
  }, [started, end, duration]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl font-bold text-brand-600 sm:text-4xl">
        {value.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-xs text-ink-500">{label}</div>
    </div>
  );
}
