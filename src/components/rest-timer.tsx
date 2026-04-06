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
    setRemaining((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      return next;
    });
    setTotal((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      return next;
    });
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-[#262626] border border-[#333] flex items-center justify-center shadow-lg"
      >
        <span className="text-lg">⏱</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 rounded-xl bg-[#1a1a1a] border border-[#262626] p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#f5f5f5]">レストタイマー</p>
        <button
          onClick={() => {
            if (!running) stop();
            setIsOpen(false);
          }}
          className="text-[#737373] text-xs min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          閉じる
        </button>
      </div>

      {/* Timer display */}
      <div className="text-center mb-3">
        <p className="text-4xl font-bold text-[#f5f5f5] tabular-nums">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
        {remaining === 0 && total > 0 && (
          <p className="text-[#22c55e] text-sm mt-1">タイムアップ!</p>
        )}
      </div>

      {/* Progress bar */}
      {running && total > 0 && (
        <div className="w-full h-1.5 bg-[#262626] rounded-full mb-3">
          <div
            className="h-full bg-[#3b82f6] rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Adjust buttons (when running) */}
      {running && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => adjust(-10)}
            className="flex-1 rounded-lg bg-[#262626] py-2 text-sm text-[#a3a3a3] min-h-[44px]"
          >
            -10秒
          </button>
          <button
            onClick={stop}
            className="flex-1 rounded-lg bg-[#262626] py-2 text-sm text-[#f97316] font-medium min-h-[44px]"
          >
            停止
          </button>
          <button
            onClick={() => adjust(10)}
            className="flex-1 rounded-lg bg-[#262626] py-2 text-sm text-[#a3a3a3] min-h-[44px]"
          >
            +10秒
          </button>
        </div>
      )}

      {/* Preset buttons (when not running) */}
      {!running && (
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.seconds}
              onClick={() => start(p.seconds)}
              className="flex-1 rounded-lg bg-[#262626] py-3 text-sm text-[#a3a3a3] hover:bg-[#333] hover:text-[#f5f5f5] transition-colors min-h-[44px]"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
