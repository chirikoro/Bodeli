"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PRESETS = [
  { label: "1分", seconds: 60 },
  { label: "2分", seconds: 120 },
  { label: "3分", seconds: 180 },
];

export function RestTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    setRemaining(0);
    setTotal(0);
  }, []);

  const start = useCallback((seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(seconds);
    setTotal(seconds);
    setRunning(true);
    setIsOpen(true);
  }, []);

  const adjust = useCallback((delta: number) => {
    setRemaining((prev) => Math.max(0, prev + delta));
    setTotal((prev) => Math.max(0, prev + delta));
  }, []);

  useEffect(() => {
    if (!running || remaining <= 0) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setRunning(false);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;

  // Collapsed: small button at top right
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-2 right-4 z-40 h-10 px-3 rounded-full bg-[#262626] border border-[#333] flex items-center gap-1.5 shadow-lg"
      >
        <span className="text-sm">⏱</span>
        {running && (
          <span className="text-xs text-[#f5f5f5] tabular-nums">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-[#1a1a1a] border-b border-[#262626] px-4 py-3 shadow-lg safe-area-pt">
      {/* Header row: timer + controls */}
      <div className="flex items-center gap-3">
        <p className="text-2xl font-bold text-[#f5f5f5] tabular-nums shrink-0">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </p>

        {running ? (
          <>
            {/* Progress bar */}
            <div className="flex-1 h-1.5 bg-[#262626] rounded-full">
              <div
                className="h-full bg-[#3b82f6] rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <button
              onClick={() => adjust(-10)}
              className="text-xs text-[#a3a3a3] px-2 py-1 rounded bg-[#262626] min-h-[36px]"
            >
              -10s
            </button>
            <button
              onClick={() => adjust(10)}
              className="text-xs text-[#a3a3a3] px-2 py-1 rounded bg-[#262626] min-h-[36px]"
            >
              +10s
            </button>
            <button
              onClick={stop}
              className="text-xs text-[#f97316] px-2 py-1 rounded bg-[#262626] min-h-[36px]"
            >
              停止
            </button>
          </>
        ) : (
          <>
            {remaining === 0 && total > 0 && (
              <span className="text-[#22c55e] text-xs">完了!</span>
            )}
            <div className="flex-1" />
            {PRESETS.map((p) => (
              <button
                key={p.seconds}
                onClick={() => start(p.seconds)}
                className="text-xs text-[#a3a3a3] px-3 py-1 rounded bg-[#262626] hover:bg-[#333] min-h-[36px]"
              >
                {p.label}
              </button>
            ))}
          </>
        )}

        <button
          onClick={() => {
            if (!running) stop();
            setIsOpen(false);
          }}
          className="text-[#737373] text-xs ml-1 min-h-[36px]"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
