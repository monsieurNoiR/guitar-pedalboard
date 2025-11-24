"use client";

import { PedalState } from "@/hooks/useAudioEngine";

interface PedalProps {
  pedal: PedalState;
  onToggle: () => void;
  onAmountChange: (amount: number) => void;
}

export default function Pedal({ pedal, onToggle, onAmountChange }: PedalProps) {
  return (
    <div
      className="pedal-card p-3 flex items-center gap-3"
      style={{
        borderColor: pedal.enabled ? pedal.color : undefined,
        boxShadow: pedal.enabled
          ? `0 0 20px ${pedal.color}40, 0 8px 16px rgba(0,0,0,0.4)`
          : undefined,
      }}
    >
      {/* 左側：フットスイッチ */}
      <div className="flex flex-col items-center gap-1">
        {/* LED */}
        <div className={`led ${pedal.enabled ? "led-on" : "led-off"}`} />

        {/* フットスイッチボタン */}
        <button
          className="footswitch w-14 h-14 flex items-center justify-center"
          onClick={onToggle}
          aria-label={`${pedal.name} ${pedal.enabled ? "OFF" : "ON"}`}
        >
          <span
            className="text-xs font-bold"
            style={{ color: pedal.enabled ? pedal.color : "#666" }}
          >
            {pedal.shortName}
          </span>
        </button>
      </div>

      {/* 中央：ペダル名と説明 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className="text-sm font-bold truncate"
            style={{ color: pedal.enabled ? pedal.color : "#aaa" }}
          >
            {pedal.name}
          </h3>
        </div>
        <p className="text-xs text-gray-400 leading-tight line-clamp-2">
          {pedal.description}
        </p>
      </div>

      {/* 右側：スライダー */}
      <div className="flex flex-col items-center gap-1 w-20">
        <span className="text-xs text-gray-400">かかり具合</span>
        <input
          type="range"
          min="0"
          max="100"
          value={pedal.amount}
          onChange={(e) => onAmountChange(Number(e.target.value))}
          className="w-full h-6"
          style={{
            accentColor: pedal.color,
          }}
        />
        <span
          className="text-xs font-mono"
          style={{ color: pedal.enabled ? pedal.color : "#666" }}
        >
          {pedal.amount}%
        </span>
      </div>
    </div>
  );
}
